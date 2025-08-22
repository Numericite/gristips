// Gestion d'erreurs côté client pour les appels API

export interface ApiError {
  type: string;
  message: string;
  timestamp: string;
  requestId?: string;
  details?: string;
}

export interface ApiErrorResponse {
  error: ApiError;
  details?: string;
}

// Classe d'erreur personnalisée pour les erreurs API
export class ClientApiError extends Error {
  public readonly type: string;
  public readonly timestamp: string;
  public readonly requestId?: string;
  public readonly statusCode: number;

  constructor(apiError: ApiError, statusCode: number) {
    super(apiError.message);
    this.type = apiError.type;
    this.timestamp = apiError.timestamp;
    this.requestId = apiError.requestId;
    this.statusCode = statusCode;
    this.name = "ClientApiError";
  }
}

// Messages d'erreur utilisateur-friendly pour le client
const CLIENT_ERROR_MESSAGES: Record<string, string> = {
  authentication_failed:
    "Échec de l'authentification. Veuillez vous reconnecter.",
  access_denied: "Accès refusé. Vous n'avez pas les permissions nécessaires.",
  session_expired: "Votre session a expiré. Veuillez vous reconnecter.",
  server_error: "Erreur serveur. Veuillez réessayer plus tard.",
  network_error: "Erreur de connexion. Vérifiez votre connexion internet.",
  validation_error: "Données invalides. Veuillez vérifier votre saisie.",
  proconnect_error: "Erreur de connexion avec ProConnect. Veuillez réessayer.",
  database_error: "Erreur de base de données. Veuillez réessayer plus tard.",
  method_not_allowed: "Opération non autorisée.",
  invalid_configuration: "Configuration invalide. Contactez l'administrateur.",
};

// Fonction pour obtenir un message d'erreur utilisateur-friendly
export function getFriendlyErrorMessage(errorType: string): string {
  return (
    CLIENT_ERROR_MESSAGES[errorType] || "Une erreur inattendue s'est produite."
  );
}

// Wrapper pour les appels fetch avec gestion d'erreur
export async function apiCall<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    // Tenter de parser la réponse JSON
    let data: unknown;
    try {
      data = await response.json();
    } catch {
      // Si le parsing JSON échoue, créer une erreur générique
      throw new ClientApiError(
        {
          type: "server_error",
          message: "Réponse serveur invalide",
          timestamp: new Date().toISOString(),
        },
        response.status
      );
    }

    // Si la réponse n'est pas OK, traiter comme une erreur
    if (!response.ok) {
      // Type guards pour vérifier les types
      const isErrorResponse = (obj: unknown): obj is { error: ApiError } => {
        return (
          obj !== null &&
          typeof obj === "object" &&
          "error" in obj &&
          obj.error !== null &&
          typeof obj.error === "object" &&
          "type" in obj.error &&
          "message" in obj.error &&
          typeof (obj.error as Record<string, unknown>).type === "string" &&
          typeof (obj.error as Record<string, unknown>).message === "string"
        );
      };

      const hasMessage = (obj: unknown): obj is { message: string } => {
        return (
          obj !== null &&
          typeof obj === "object" &&
          "message" in obj &&
          typeof (obj as { message: unknown }).message === "string"
        );
      };

      // Si c'est une réponse d'erreur structurée de notre API
      if (isErrorResponse(data)) {
        throw new ClientApiError(data.error, response.status);
      }

      // Sinon, créer une erreur générique basée sur le status
      const errorType = getErrorTypeFromStatus(response.status);
      throw new ClientApiError(
        {
          type: errorType,
          message: hasMessage(data)
            ? data.message
            : getFriendlyErrorMessage(errorType),
          timestamp: new Date().toISOString(),
        },
        response.status
      );
    }

    return data as T;
  } catch (error) {
    // Si c'est déjà une ClientApiError, la relancer
    if (error instanceof ClientApiError) {
      throw error;
    }

    // Si c'est une erreur réseau ou autre
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ClientApiError(
        {
          type: "network_error",
          message: "Impossible de contacter le serveur",
          timestamp: new Date().toISOString(),
        },
        0
      );
    }

    // Erreur inconnue
    throw new ClientApiError(
      {
        type: "server_error",
        message: error instanceof Error ? error.message : "Erreur inconnue",
        timestamp: new Date().toISOString(),
      },
      500
    );
  }
}

// Mapper les codes de statut HTTP vers les types d'erreur
function getErrorTypeFromStatus(status: number): string {
  switch (status) {
    case 400:
      return "validation_error";
    case 401:
      return "authentication_failed";
    case 403:
      return "access_denied";
    case 404:
      return "not_found";
    case 405:
      return "method_not_allowed";
    case 500:
      return "server_error";
    case 502:
    case 503:
    case 504:
      return "server_error";
    default:
      return "server_error";
  }
}

// Hook React pour gérer les erreurs API
export function useApiErrorHandler() {
  const handleError = (error: unknown) => {
    if (error instanceof ClientApiError) {
      // Logger l'erreur côté client
      console.error("Erreur API:", {
        type: error.type,
        message: error.message,
        statusCode: error.statusCode,
        requestId: error.requestId,
        timestamp: error.timestamp,
      });

      // Rediriger vers la page d'erreur appropriée selon le type
      switch (error.type) {
        case "authentication_failed":
        case "session_expired":
          // Rediriger vers la page de connexion
          window.location.href = "/auth/signin";
          break;
        case "access_denied":
          // Rediriger vers la page d'accès refusé
          window.location.href = "/auth/access-denied";
          break;
        default:
          // Pour les autres erreurs, afficher un message ou rediriger vers une page d'erreur générique
          break;
      }

      return {
        type: error.type,
        message: getFriendlyErrorMessage(error.type),
        originalMessage: error.message,
      };
    }

    // Erreur non-API
    console.error("Erreur non-API:", error);
    return {
      type: "unknown_error",
      message: "Une erreur inattendue s'est produite",
      originalMessage: error instanceof Error ? error.message : String(error),
    };
  };

  return { handleError };
}

// Utilitaire pour les appels API avec retry automatique
export async function apiCallWithRetry<T = unknown>(
  url: string,
  options: RequestInit = {},
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<T> {
  let lastError: ClientApiError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall<T>(url, options);
    } catch (error) {
      lastError =
        error instanceof ClientApiError
          ? error
          : new ClientApiError(
              {
                type: "server_error",
                message:
                  error instanceof Error ? error.message : "Erreur inconnue",
                timestamp: new Date().toISOString(),
              },
              500
            );

      // Ne pas retry pour certains types d'erreur
      if (
        lastError.type === "authentication_failed" ||
        lastError.type === "access_denied" ||
        lastError.type === "validation_error" ||
        lastError.statusCode === 404
      ) {
        throw lastError;
      }

      // Si c'est le dernier essai, relancer l'erreur
      if (attempt === maxRetries) {
        throw lastError;
      }

      // Attendre avant le prochain essai
      await new Promise((resolve) => setTimeout(resolve, retryDelay * attempt));
    }
  }

  throw lastError!;
}

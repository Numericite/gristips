import { NextApiRequest, NextApiResponse } from "next";
// This file will be moved to src/lib/api/error-handling.ts

// Types d'erreurs spécifiques à l'application
export enum ErrorType {
  AUTHENTICATION_FAILED = "authentication_failed",
  ACCESS_DENIED = "access_denied",
  INVALID_CONFIGURATION = "invalid_configuration",
  DATABASE_ERROR = "database_error",
  PROCONNECT_ERROR = "proconnect_error",
  SESSION_EXPIRED = "session_expired",
  VALIDATION_ERROR = "validation_error",
  SERVER_ERROR = "server_error",
  METHOD_NOT_ALLOWED = "method_not_allowed",
  EXTERNAL_SERVICE_ERROR = "external_service_error",
  RATE_LIMIT_EXCEEDED = "rate_limit_exceeded",
  NOT_FOUND = "not_found",
  AUTHENTICATION_ERROR = "authentication_error",
  GRIST_API_ERROR = "grist_api_error",
  COLUMN_TYPE_MISMATCH = "column_type_mismatch",
}

// Interface pour les erreurs structurées
export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  statusCode: number;
  timestamp: string;
  requestId?: string;
}

// Messages d'erreur utilisateur-friendly
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.AUTHENTICATION_FAILED]:
    "Échec de l'authentification. Veuillez réessayer.",
  [ErrorType.ACCESS_DENIED]:
    "Accès refusé. Vous devez être un agent public pour accéder à cette ressource.",
  [ErrorType.INVALID_CONFIGURATION]:
    "Configuration invalide. Veuillez contacter l'administrateur.",
  [ErrorType.DATABASE_ERROR]:
    "Erreur de base de données. Veuillez réessayer plus tard.",
  [ErrorType.PROCONNECT_ERROR]:
    "Erreur de connexion avec ProConnect. Veuillez réessayer.",
  [ErrorType.SESSION_EXPIRED]:
    "Votre session a expiré. Veuillez vous reconnecter.",
  [ErrorType.VALIDATION_ERROR]:
    "Données invalides. Veuillez vérifier votre saisie.",
  [ErrorType.SERVER_ERROR]:
    "Erreur serveur interne. Veuillez réessayer plus tard.",
  [ErrorType.METHOD_NOT_ALLOWED]: "Méthode HTTP non autorisée.",
  [ErrorType.EXTERNAL_SERVICE_ERROR]:
    "Erreur de service externe. Veuillez réessayer plus tard.",
  [ErrorType.RATE_LIMIT_EXCEEDED]:
    "Trop de requêtes. Veuillez patienter avant de réessayer.",
  [ErrorType.NOT_FOUND]: "Ressource non trouvée.",
  [ErrorType.AUTHENTICATION_ERROR]:
    "Erreur d'authentification. Veuillez vérifier vos identifiants.",
  [ErrorType.GRIST_API_ERROR]:
    "Erreur de l'API Grist. Veuillez vérifier votre configuration.",
  [ErrorType.COLUMN_TYPE_MISMATCH]: "Types de colonnes incompatibles détectés.",
};

// Codes de statut HTTP correspondants
const STATUS_CODES: Record<ErrorType, number> = {
  [ErrorType.AUTHENTICATION_FAILED]: 401,
  [ErrorType.ACCESS_DENIED]: 403,
  [ErrorType.INVALID_CONFIGURATION]: 500,
  [ErrorType.DATABASE_ERROR]: 500,
  [ErrorType.PROCONNECT_ERROR]: 502,
  [ErrorType.SESSION_EXPIRED]: 401,
  [ErrorType.VALIDATION_ERROR]: 400,
  [ErrorType.SERVER_ERROR]: 500,
  [ErrorType.METHOD_NOT_ALLOWED]: 405,
  [ErrorType.EXTERNAL_SERVICE_ERROR]: 502,
  [ErrorType.RATE_LIMIT_EXCEEDED]: 429,
  [ErrorType.NOT_FOUND]: 404,
  [ErrorType.AUTHENTICATION_ERROR]: 401,
  [ErrorType.GRIST_API_ERROR]: 502,
  [ErrorType.COLUMN_TYPE_MISMATCH]: 400,
};

// Classe d'erreur personnalisée
export class AppErrorClass extends Error {
  public readonly type: ErrorType;
  public readonly statusCode: number;
  public readonly details?: string;
  public readonly timestamp: string;

  constructor(type: ErrorType, details?: string, message?: string) {
    super(message || ERROR_MESSAGES[type]);
    this.type = type;
    this.statusCode = STATUS_CODES[type];
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.name = "AppError";
  }
}

// Fonction pour créer une erreur structurée
export function createAppError(
  type: ErrorType,
  details?: string,
  message?: string,
  requestId?: string
): AppError {
  return {
    type,
    message: message || ERROR_MESSAGES[type],
    details,
    statusCode: STATUS_CODES[type],
    timestamp: new Date().toISOString(),
    requestId,
  };
}

// Logger d'erreurs avec contexte
export function logError(
  error: Error | AppError | unknown,
  context: {
    userId?: string;
    email?: string;
    action?: string;
    requestId?: string;
    req?: NextApiRequest;
  } = {}
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: "ERROR",
    context: {
      userId: context.userId,
      email: context.email,
      action: context.action,
      requestId: context.requestId,
      method: context.req?.method,
      url: context.req?.url,
      userAgent: context.req?.headers["user-agent"],
      ip:
        context.req?.headers["x-forwarded-for"] ||
        context.req?.connection?.remoteAddress,
    },
    error: {
      name: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      type: error instanceof AppErrorClass ? error.type : undefined,
      details: error instanceof AppErrorClass ? error.details : undefined,
    },
  };

  // En développement, afficher l'erreur complète
  if (process.env.NODE_ENV === "development") {
    console.error("🚨 Erreur détectée:", JSON.stringify(logEntry, null, 2));
  } else {
    // En production, logger de manière plus concise
    console.error(`[${timestamp}] ERROR: ${logEntry.error.message}`, {
      type: logEntry.error.type,
      userId: context.userId,
      action: context.action,
    });
  }
}

// Logger pour les événements d'authentification
export function logAuthEvent(
  event: "signin_success" | "signin_failed" | "signout" | "access_denied",
  context: {
    userId?: string;
    email?: string;
    isPublicAgent?: boolean;
    provider?: string;
    reason?: string;
    req?: NextApiRequest;
  }
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level: "INFO",
    event,
    context: {
      userId: context.userId,
      email: context.email,
      isPublicAgent: context.isPublicAgent,
      provider: context.provider,
      reason: context.reason,
      ip:
        context.req?.headers["x-forwarded-for"] ||
        context.req?.connection?.remoteAddress,
      userAgent: context.req?.headers["user-agent"],
    },
  };

  console.log(`[${timestamp}] AUTH_EVENT: ${event}`, logEntry.context);
}

// Handler d'erreur global pour les API routes
export function handleApiError(
  error: Error | AppError | unknown,
  req: NextApiRequest,
  res: NextApiResponse,
  context: {
    userId?: string;
    email?: string;
    action?: string;
  } = {}
) {
  // Générer un ID de requête unique pour le tracking
  const requestId = `req_${Date.now()}_${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Logger l'erreur avec contexte
  logError(error, {
    ...context,
    requestId,
    req,
  });

  // Déterminer le type d'erreur et la réponse appropriée
  let appError: AppError;

  if (error instanceof AppErrorClass) {
    appError = {
      type: error.type,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      requestId,
    };
  } else if (error instanceof Error) {
    // Mapper les erreurs communes
    if (
      error.message.includes("ECONNREFUSED") ||
      error.message.includes("database")
    ) {
      appError = createAppError(
        ErrorType.DATABASE_ERROR,
        error.message,
        undefined,
        requestId
      );
    } else if (
      error.message.includes("ProConnect") ||
      error.message.includes("OAuth")
    ) {
      appError = createAppError(
        ErrorType.PROCONNECT_ERROR,
        error.message,
        undefined,
        requestId
      );
    } else {
      appError = createAppError(
        ErrorType.SERVER_ERROR,
        error.message,
        undefined,
        requestId
      );
    }
  } else {
    appError = createAppError(
      ErrorType.SERVER_ERROR,
      String(error),
      undefined,
      requestId
    );
  }

  // Réponse d'erreur structurée
  const errorResponse = {
    error: {
      type: appError.type,
      message: appError.message,
      timestamp: appError.timestamp,
      requestId: appError.requestId,
    },
    // Inclure les détails seulement en développement
    ...(process.env.NODE_ENV === "development" &&
      appError.details && {
        details: appError.details,
      }),
  };

  res.status(appError.statusCode).json(errorResponse);
}

// Wrapper pour les API routes avec gestion d'erreur automatique
export function withErrorHandling(
  handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>,
  context?: {
    action?: string;
    requiresAuth?: boolean;
  }
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, req, res, {
        action: context?.action,
      });
    }
  };
}

// Validation des méthodes HTTP
export function validateHttpMethod(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedMethods: string[]
): boolean {
  if (!req.method || !allowedMethods.includes(req.method)) {
    const error = createAppError(
      ErrorType.METHOD_NOT_ALLOWED,
      `Méthode ${
        req.method
      } non autorisée. Méthodes acceptées: ${allowedMethods.join(", ")}`
    );

    res.status(error.statusCode).json({
      error: {
        type: error.type,
        message: error.message,
        timestamp: error.timestamp,
      },
    });

    return false;
  }

  return true;
}

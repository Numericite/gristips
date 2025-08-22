import {
  GristDocument,
  GristTable,
  GristColumn,
  GristDocumentsResponse,
  GristTablesResponse,
} from "./types";
import { ExponentialBackoff } from "../api/rate-limiting";
import { AppErrorClass, ErrorType } from "../error-handling";

/**
 * Grist API Client for interacting with Grist documents
 */
export class GristApiClient {
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(
    baseUrl: string = "https://docs.getgrist.com",
    timeout: number = 10000
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.timeout = timeout;
  }

  /**
   * Validate API key by making a test request to Grist API
   */
  async validateApiKey(apiKey: string): Promise<boolean> {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      console.log("❌ API key validation failed: empty or invalid key");
      return false;
    }

    console.log(
      "🔍 Validating API key format:",
      apiKey.substring(0, 8) + "..."
    );

    const backoff = new ExponentialBackoff(2, 1000, 5000); // Max 2 attempts, 1s base delay, 5s max delay

    try {
      return await backoff.execute(async () => {
        console.log("📡 Making request to Grist API for validation...");
        const response = await this.makeRequest("/api/orgs", apiKey, {
          method: "GET",
        });

        console.log("📊 Grist API response status:", response.status);

        if (response.status === 401 || response.status === 403) {
          console.log("❌ Authentication failed - invalid API key");
          // Don't retry authentication errors
          return false;
        }

        if (!response.ok) {
          console.log(
            "❌ API request failed:",
            response.status,
            response.statusText
          );
          throw new Error(
            `API validation failed: ${response.status} ${response.statusText}`
          );
        }

        console.log("✅ API key validation successful");
        return true;
      });
    } catch (error) {
      console.error("❌ API key validation failed with error:", error);
      return false;
    }
  }

  /**
   * Fetch user's accessible Grist documents
   */
  async getDocuments(apiKey: string): Promise<GristDocument[]> {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "API key is required",
        "Clé API requise pour récupérer les documents"
      );
    }

    const backoff = new ExponentialBackoff(3, 1000, 10000);

    try {
      return await backoff.execute(async () => {
        const response = await this.makeRequest("/api/docs", apiKey, {
          method: "GET",
        });

        if (response.status === 401 || response.status === 403) {
          throw new AppErrorClass(
            ErrorType.AUTHENTICATION_ERROR,
            "Invalid or expired API key",
            "Clé API invalide ou expirée"
          );
        }

        if (response.status === 429) {
          throw new AppErrorClass(
            ErrorType.RATE_LIMIT_EXCEEDED,
            "Rate limit exceeded",
            "Limite de taux dépassée. Veuillez patienter."
          );
        }

        if (!response.ok) {
          throw new AppErrorClass(
            ErrorType.GRIST_API_ERROR,
            `Failed to fetch documents: ${response.status} ${response.statusText}`,
            "Erreur lors de la récupération des documents Grist"
          );
        }

        const data: GristDocumentsResponse = await response.json();

        if (!data || !Array.isArray(data.docs)) {
          throw new AppErrorClass(
            ErrorType.GRIST_API_ERROR,
            "Invalid response format from Grist API",
            "Format de réponse invalide de l'API Grist"
          );
        }

        return data.docs;
      });
    } catch (error) {
      console.error("Failed to fetch documents:", error);

      if (error instanceof AppErrorClass) {
        throw error;
      }

      throw new AppErrorClass(
        ErrorType.EXTERNAL_SERVICE_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        "Erreur lors de la récupération des documents"
      );
    }
  }

  /**
   * Fetch tables for a specific document
   */
  async getTables(apiKey: string, documentId: string): Promise<GristTable[]> {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "API key is required",
        "Clé API requise pour récupérer les tables"
      );
    }

    if (
      !documentId ||
      typeof documentId !== "string" ||
      documentId.trim().length === 0
    ) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "Document ID is required",
        "ID du document requis pour récupérer les tables"
      );
    }

    const backoff = new ExponentialBackoff(3, 1000, 10000);

    try {
      return await backoff.execute(async () => {
        const response = await this.makeRequest(
          `/api/docs/${encodeURIComponent(documentId)}/tables`,
          apiKey,
          {
            method: "GET",
          }
        );

        if (response.status === 401 || response.status === 403) {
          throw new AppErrorClass(
            ErrorType.AUTHENTICATION_ERROR,
            "Invalid or expired API key",
            "Clé API invalide ou expirée"
          );
        }

        if (response.status === 404) {
          throw new AppErrorClass(
            ErrorType.NOT_FOUND,
            "Document not found",
            "Document non trouvé ou inaccessible"
          );
        }

        if (response.status === 429) {
          throw new AppErrorClass(
            ErrorType.RATE_LIMIT_EXCEEDED,
            "Rate limit exceeded",
            "Limite de taux dépassée. Veuillez patienter."
          );
        }

        if (!response.ok) {
          throw new AppErrorClass(
            ErrorType.GRIST_API_ERROR,
            `Failed to fetch tables: ${response.status} ${response.statusText}`,
            "Erreur lors de la récupération des tables Grist"
          );
        }

        const data: GristTablesResponse = await response.json();

        if (!data || !Array.isArray(data.tables)) {
          throw new AppErrorClass(
            ErrorType.GRIST_API_ERROR,
            "Invalid response format from Grist API",
            "Format de réponse invalide de l'API Grist"
          );
        }

        return data.tables;
      });
    } catch (error) {
      console.error("Failed to fetch tables:", error);

      if (error instanceof AppErrorClass) {
        throw error;
      }

      throw new AppErrorClass(
        ErrorType.EXTERNAL_SERVICE_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        "Erreur lors de la récupération des tables"
      );
    }
  }

  /**
   * Fetch column information for a specific table
   */
  async getTableSchema(
    apiKey: string,
    documentId: string,
    tableId: string
  ): Promise<GristColumn[]> {
    if (!apiKey || typeof apiKey !== "string" || apiKey.trim().length === 0) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "API key is required",
        "Clé API requise pour récupérer le schéma de la table"
      );
    }

    if (
      !documentId ||
      typeof documentId !== "string" ||
      documentId.trim().length === 0
    ) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "Document ID is required",
        "ID du document requis pour récupérer le schéma de la table"
      );
    }

    if (
      !tableId ||
      typeof tableId !== "string" ||
      tableId.trim().length === 0
    ) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "Table ID is required",
        "ID de la table requis pour récupérer le schéma"
      );
    }

    const backoff = new ExponentialBackoff(3, 1000, 10000);

    try {
      return await backoff.execute(async () => {
        const response = await this.makeRequest(
          `/api/docs/${encodeURIComponent(
            documentId
          )}/tables/${encodeURIComponent(tableId)}/columns`,
          apiKey,
          {
            method: "GET",
          }
        );

        if (response.status === 401 || response.status === 403) {
          throw new AppErrorClass(
            ErrorType.AUTHENTICATION_ERROR,
            "Invalid or expired API key",
            "Clé API invalide ou expirée"
          );
        }

        if (response.status === 404) {
          throw new AppErrorClass(
            ErrorType.NOT_FOUND,
            "Document or table not found",
            "Document ou table non trouvé"
          );
        }

        if (response.status === 429) {
          throw new AppErrorClass(
            ErrorType.RATE_LIMIT_EXCEEDED,
            "Rate limit exceeded",
            "Limite de taux dépassée. Veuillez patienter."
          );
        }

        if (!response.ok) {
          throw new AppErrorClass(
            ErrorType.GRIST_API_ERROR,
            `Failed to fetch table schema: ${response.status} ${response.statusText}`,
            "Erreur lors de la récupération du schéma de la table"
          );
        }

        const data: { columns: GristColumn[] } = await response.json();

        if (!data || !Array.isArray(data.columns)) {
          throw new AppErrorClass(
            ErrorType.GRIST_API_ERROR,
            "Invalid response format from Grist API",
            "Format de réponse invalide de l'API Grist"
          );
        }

        return data.columns;
      });
    } catch (error) {
      console.error("Failed to fetch table schema:", error);

      if (error instanceof AppErrorClass) {
        throw error;
      }

      throw new AppErrorClass(
        ErrorType.EXTERNAL_SERVICE_ERROR,
        error instanceof Error ? error.message : "Unknown error",
        "Erreur lors de la récupération du schéma de la table"
      );
    }
  }

  /**
   * Make HTTP request to Grist API with proper authentication and error handling
   */
  private async makeRequest(
    endpoint: string,
    apiKey: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Request timeout after ${this.timeout}ms`);
      }

      throw error;
    }
  }
}

// Export singleton instance
export const gristApiClient = new GristApiClient();

import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import {
  withErrorHandling,
  validateHttpMethod,
  AppErrorClass,
  ErrorType,
} from "../../../../lib/error-handling";
import { requireAuth } from "../../../../lib/auth";
import { decrypt } from "../../../../lib/encryption";
import { gristApiClient } from "../../../../lib/grist/client";
import { GristDocument } from "../../../../lib/grist/types";

const prisma = new PrismaClient();

interface GetDocumentsResponse {
  documents: GristDocument[];
}

// GET /api/admin/grist/documents - Fetch user's Grist documents
async function getDocumentsHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate HTTP method
  if (!validateHttpMethod(req, res, ["GET"])) {
    return;
  }

  // Require authentication and public agent status
  const session = await requireAuth(req, res, true);
  if (!session) {
    return; // requireAuth already sent the response
  }

  try {
    // Fetch user from database with API key
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        gristApiKey: true,
        gristApiKeyHash: true,
      },
    });

    if (!user) {
      throw new AppErrorClass(
        ErrorType.NOT_FOUND,
        "User not found",
        "Utilisateur non trouvé"
      );
    }

    // Check if user has configured API key
    if (!user.gristApiKey || !user.gristApiKeyHash) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "Grist API key not configured",
        "Clé API Grist non configurée. Veuillez configurer votre clé API dans les paramètres."
      );
    }

    // Decrypt API key
    let decryptedApiKey: string;
    try {
      decryptedApiKey = decrypt(user.gristApiKey);
    } catch (error) {
      console.error("Failed to decrypt API key:", error);
      throw new AppErrorClass(
        ErrorType.SERVER_ERROR,
        "Failed to decrypt API key",
        "Erreur lors du déchiffrement de la clé API"
      );
    }

    // Fetch documents from Grist API
    let documents: GristDocument[];
    try {
      documents = await gristApiClient.getDocuments(decryptedApiKey);
    } catch (error) {
      console.error("Failed to fetch documents from Grist:", error);

      if (error instanceof Error) {
        if (error.message.includes("timeout")) {
          throw new AppErrorClass(
            ErrorType.EXTERNAL_SERVICE_ERROR,
            "Grist API timeout",
            "Délai d'attente dépassé lors de la récupération des documents"
          );
        }

        if (error.message.includes("401") || error.message.includes("403")) {
          throw new AppErrorClass(
            ErrorType.AUTHENTICATION_ERROR,
            "Invalid or expired API key",
            "Clé API invalide ou expirée. Veuillez reconfigurer votre clé API."
          );
        }

        if (
          error.message.includes("network") ||
          error.message.includes("fetch")
        ) {
          throw new AppErrorClass(
            ErrorType.EXTERNAL_SERVICE_ERROR,
            "Network error",
            "Erreur réseau lors de la récupération des documents"
          );
        }
      }

      throw new AppErrorClass(
        ErrorType.EXTERNAL_SERVICE_ERROR,
        "Failed to fetch documents from Grist",
        "Erreur lors de la récupération des documents Grist"
      );
    }

    const response: GetDocumentsResponse = {
      documents,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching Grist documents:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return getDocumentsHandler(req, res);
    default:
      res.setHeader("Allow", ["GET"]);
      res.status(405).json({
        error: "Method not allowed",
        message: `Method ${req.method} not allowed`,
      });
  }
}

export default withErrorHandling(handler, {
  action: "grist_documents_fetch",
  requiresAuth: true,
});

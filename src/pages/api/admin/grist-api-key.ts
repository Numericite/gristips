import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import {
  withErrorHandling,
  validateHttpMethod,
  AppErrorClass,
  ErrorType,
} from "../../../lib/error-handling";
import { requireAuth } from "../../../lib/auth";
import {
  encrypt,
  decrypt,
  hashApiKey,
  verifyApiKeyHash,
} from "../../../lib/encryption";
import { gristApiClient } from "../../../lib/grist/client";
import { validateApiKey } from "../../../lib/validation/automation";
import {
  gristValidationRateLimiter,
  withRateLimit,
} from "../../../lib/api/rate-limiting";

const prisma = new PrismaClient();

// GET /api/admin/grist-api-key - Check if user has API key
async function getApiKeyHandler(req: NextApiRequest, res: NextApiResponse) {
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
    // Fetch user from database
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

    const hasApiKey = !!user.gristApiKey && !!user.gristApiKeyHash;
    let isValid = false;

    // If user has an API key, validate it
    if (hasApiKey && user.gristApiKey) {
      try {
        const decryptedApiKey = decrypt(user.gristApiKey);
        isValid = await gristApiClient.validateApiKey(decryptedApiKey);
      } catch (error) {
        console.error("Failed to validate stored API key:", error);
        isValid = false;
      }
    }

    res.status(200).json({
      hasApiKey,
      isValid: hasApiKey ? isValid : undefined,
    });
  } catch (error) {
    console.error("Error checking API key:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// POST /api/admin/grist-api-key - Save and validate API key
async function setApiKeyHandler(req: NextApiRequest, res: NextApiResponse) {
  // Validate HTTP method
  if (!validateHttpMethod(req, res, ["POST"])) {
    return;
  }

  // Require authentication and public agent status
  const session = await requireAuth(req, res, true);
  if (!session) {
    return; // requireAuth already sent the response
  }

  // Check rate limit for API key validation
  const rateLimitCheck = withRateLimit(gristValidationRateLimiter)(
    session.user.id,
    "api_key_validation"
  );
  if (!rateLimitCheck.allowed) {
    throw new AppErrorClass(
      ErrorType.RATE_LIMIT_EXCEEDED,
      `Rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds`,
      `Trop de tentatives de validation. Réessayez dans ${rateLimitCheck.retryAfter} secondes.`
    );
  }

  const { apiKey } = req.body;

  // Comprehensive validation
  const validation = validateApiKey(apiKey);
  if (!validation.isValid) {
    throw new AppErrorClass(
      ErrorType.VALIDATION_ERROR,
      validation.errors.join(", "),
      validation.errors.join(", ")
    );
  }

  // Log warnings if any
  if (validation.warnings.length > 0) {
    console.warn("API key validation warnings:", validation.warnings);
  }

  try {
    // Validate API key with Grist API
    const isValid = await gristApiClient.validateApiKey(apiKey);

    if (!isValid) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "Invalid API key",
        "Clé API invalide. Veuillez vérifier votre clé API Grist."
      );
    }

    // Encrypt API key and create hash
    const encryptedApiKey = encrypt(apiKey);
    const apiKeyHash = hashApiKey(apiKey);

    // Update user in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        gristApiKey: encryptedApiKey,
        gristApiKeyHash: apiKeyHash,
        updatedAt: new Date(),
      },
    });

    res.status(200).json({
      success: true,
      isValid: true,
      message: "Clé API sauvegardée avec succès",
    });
  } catch (error) {
    console.error("Error setting API key:", error);

    // If it's already an AppErrorClass, re-throw it
    if (error instanceof AppErrorClass) {
      throw error;
    }

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes("timeout")) {
        throw new AppErrorClass(
          ErrorType.EXTERNAL_SERVICE_ERROR,
          "Grist API timeout",
          "Délai d'attente dépassé lors de la validation de la clé API"
        );
      }

      if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        throw new AppErrorClass(
          ErrorType.EXTERNAL_SERVICE_ERROR,
          "Network error",
          "Erreur réseau lors de la validation de la clé API"
        );
      }
    }

    throw new AppErrorClass(
      ErrorType.SERVER_ERROR,
      "Failed to save API key",
      "Erreur lors de la sauvegarde de la clé API"
    );
  } finally {
    await prisma.$disconnect();
  }
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case "GET":
      return getApiKeyHandler(req, res);
    case "POST":
      return setApiKeyHandler(req, res);
    default:
      res.setHeader("Allow", ["GET", "POST"]);
      res.status(405).json({
        error: "Method not allowed",
        message: `Method ${req.method} not allowed`,
      });
  }
}

export default withErrorHandling(handler, {
  action: "grist_api_key_management",
  requiresAuth: true,
});

import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../../../lib/auth";
import {
  logError,
  withErrorHandling,
  validateHttpMethod,
  AppErrorClass,
  ErrorType,
} from "../../../lib/error-handling";
import {
  validateAutomationForm,
  validateGristIds,
  AutomationFormData,
} from "../../../lib/validation/automation";
import {
  gristApiRateLimiter,
  withRateLimit,
} from "../../../lib/api/rate-limiting";

const prisma = new PrismaClient();

interface CreateAutomationRequest {
  name: string;
  type: "table_copy";
  sourceDocumentId: string;
  sourceDocumentName: string;
  sourceTableId: string;
  sourceTableName: string;
  targetDocumentId: string;
  targetDocumentName: string;
  targetTableId: string;
  targetTableName: string;
  selectedColumns: string[];
  description?: string;
}

interface AutomationResponse {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: string;
  sourceDocumentId: string;
  sourceDocumentName: string;
  sourceTableId: string;
  sourceTableName: string;
  targetDocumentId: string;
  targetDocumentName: string;
  targetTableId: string;
  targetTableName: string;
  selectedColumns: string[];
  lastExecuted?: string;
  lastExecutionStatus?: string;
  createdAt: string;
  updatedAt: string;
}

async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Validate HTTP method
  if (!validateHttpMethod(req, res, ["GET", "POST"])) {
    return;
  }

  // Require authentication and public agent status
  const session = await requireAuth(req, res, true);
  if (!session) {
    return;
  }

  const userId = session.user.id;

  switch (req.method) {
    case "GET":
      return await handleGetAutomations(req, res, userId);
    case "POST":
      return await handleCreateAutomation(req, res, userId);
    default:
      // This should never be reached due to validateHttpMethod
      throw new AppErrorClass(
        ErrorType.METHOD_NOT_ALLOWED,
        `Method ${req.method} not allowed`
      );
  }
}

export default withErrorHandling(handler, {
  action: "automation_management",
  requiresAuth: true,
});

async function handleGetAutomations(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    const automations = await prisma.automation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    const response: AutomationResponse[] = automations.map((automation) => ({
      id: automation.id,
      name: automation.name,
      description: automation.description || undefined,
      type: automation.type,
      status: automation.status,
      sourceDocumentId: automation.sourceDocumentId,
      sourceDocumentName: automation.sourceDocumentName,
      sourceTableId: automation.sourceTableId,
      sourceTableName: automation.sourceTableName,
      targetDocumentId: automation.targetDocumentId,
      targetDocumentName: automation.targetDocumentName,
      targetTableId: automation.targetTableId,
      targetTableName: automation.targetTableName,
      selectedColumns: automation.selectedColumns as string[],
      lastExecuted: automation.lastExecuted?.toISOString(),
      lastExecutionStatus: automation.lastExecutionStatus || undefined,
      createdAt: automation.createdAt.toISOString(),
      updatedAt: automation.updatedAt.toISOString(),
    }));

    return res.status(200).json({ automations: response });
  } catch (error) {
    logError("Failed to fetch automations", { error, userId });
    return res.status(500).json({ error: "Failed to fetch automations" });
  }
}

async function handleCreateAutomation(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string
) {
  try {
    // Check rate limit
    const rateLimitCheck = withRateLimit(gristApiRateLimiter)(
      userId,
      "create_automation"
    );
    if (!rateLimitCheck.allowed) {
      throw new AppErrorClass(
        ErrorType.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds`,
        `Trop de requêtes. Réessayez dans ${rateLimitCheck.retryAfter} secondes.`
      );
    }

    const requestData = req.body as CreateAutomationRequest;

    // Comprehensive validation
    const formData: AutomationFormData = {
      name: requestData.name,
      description: requestData.description,
      sourceDocumentId: requestData.sourceDocumentId,
      sourceTableId: requestData.sourceTableId,
      targetDocumentId: requestData.targetDocumentId,
      targetTableId: requestData.targetTableId,
      selectedColumns: requestData.selectedColumns || [],
    };

    const validation = validateAutomationForm(formData);
    if (!validation.isValid) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        validation.errors.join(", "),
        validation.errors.join(", ")
      );
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn("Automation creation warnings:", validation.warnings);
    }

    // Validate automation type
    if (requestData.type !== "table_copy") {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "Invalid automation type. Only 'table_copy' is supported.",
        "Type d'automation invalide. Seul 'table_copy' est supporté."
      );
    }

    // Validate Grist IDs format
    const idsValidation = validateGristIds(
      requestData.sourceDocumentId,
      requestData.sourceTableId
    );
    if (!idsValidation.isValid) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        idsValidation.errors.join(", "),
        idsValidation.errors.join(", ")
      );
    }

    const targetIdsValidation = validateGristIds(
      requestData.targetDocumentId,
      requestData.targetTableId
    );
    if (!targetIdsValidation.isValid) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        targetIdsValidation.errors.join(", "),
        targetIdsValidation.errors.join(", ")
      );
    }

    // Additional validation for required metadata fields
    if (
      !requestData.sourceDocumentName ||
      !requestData.sourceTableName ||
      !requestData.targetDocumentName ||
      !requestData.targetTableName
    ) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "Document and table names are required",
        "Les noms des documents et tables sont requis"
      );
    }

    // Create automation
    const automation = await prisma.automation.create({
      data: {
        userId,
        name: requestData.name.trim(),
        description: requestData.description?.trim() || null,
        type: requestData.type,
        status: "active",
        sourceDocumentId: requestData.sourceDocumentId,
        sourceDocumentName: requestData.sourceDocumentName,
        sourceTableId: requestData.sourceTableId,
        sourceTableName: requestData.sourceTableName,
        targetDocumentId: requestData.targetDocumentId,
        targetDocumentName: requestData.targetDocumentName,
        targetTableId: requestData.targetTableId,
        targetTableName: requestData.targetTableName,
        selectedColumns: requestData.selectedColumns,
      },
    });

    const response: AutomationResponse = {
      id: automation.id,
      name: automation.name,
      description: automation.description || undefined,
      type: automation.type,
      status: automation.status,
      sourceDocumentId: automation.sourceDocumentId,
      sourceDocumentName: automation.sourceDocumentName,
      sourceTableId: automation.sourceTableId,
      sourceTableName: automation.sourceTableName,
      targetDocumentId: automation.targetDocumentId,
      targetDocumentName: automation.targetDocumentName,
      targetTableId: automation.targetTableId,
      targetTableName: automation.targetTableName,
      selectedColumns: automation.selectedColumns as string[],
      lastExecuted: automation.lastExecuted?.toISOString(),
      lastExecutionStatus: automation.lastExecutionStatus || undefined,
      createdAt: automation.createdAt.toISOString(),
      updatedAt: automation.updatedAt.toISOString(),
    };

    return res.status(201).json(response);
  } catch (error) {
    logError("Failed to create automation", { error, userId });

    if (error instanceof AppErrorClass) {
      throw error;
    }

    throw new AppErrorClass(
      ErrorType.SERVER_ERROR,
      error instanceof Error ? error.message : "Unknown error",
      "Erreur lors de la création de l'automation"
    );
  }
}

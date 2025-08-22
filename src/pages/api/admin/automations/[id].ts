import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../../../../lib/auth";
import {
  logError,
  withErrorHandling,
  validateHttpMethod,
  AppErrorClass,
  ErrorType,
} from "../../../../lib/error-handling";
import { validateAutomationUpdate } from "../../../../lib/validation/automation";
import {
  gristApiRateLimiter,
  withRateLimit,
} from "../../../../lib/api/rate-limiting";

const prisma = new PrismaClient();

interface UpdateAutomationRequest {
  name?: string;
  description?: string;
  status?: "active" | "inactive";
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  sourceTableId?: string;
  sourceTableName?: string;
  targetDocumentId?: string;
  targetDocumentName?: string;
  targetTableId?: string;
  targetTableName?: string;
  selectedColumns?: string[];
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
  if (!validateHttpMethod(req, res, ["GET", "PUT", "DELETE"])) {
    return;
  }

  // Require authentication and public agent status
  const session = await requireAuth(req, res, true);
  if (!session) {
    return;
  }

  const userId = session.user.id;
  const { id } = req.query;

  if (!id || typeof id !== "string") {
    throw new AppErrorClass(
      ErrorType.VALIDATION_ERROR,
      "Invalid automation ID",
      "ID d'automation invalide"
    );
  }

  // Validate automation ID format
  if (id.trim().length === 0) {
    throw new AppErrorClass(
      ErrorType.VALIDATION_ERROR,
      "Automation ID cannot be empty",
      "L'ID d'automation ne peut pas être vide"
    );
  }

  switch (req.method) {
    case "GET":
      return await handleGetAutomation(req, res, userId, id);
    case "PUT":
      return await handleUpdateAutomation(req, res, userId, id);
    case "DELETE":
      return await handleDeleteAutomation(req, res, userId, id);
    default:
      // This should never be reached due to validateHttpMethod
      throw new AppErrorClass(
        ErrorType.METHOD_NOT_ALLOWED,
        `Method ${req.method} not allowed`
      );
  }
}

export default withErrorHandling(handler, {
  action: "automation_individual_management",
  requiresAuth: true,
});

async function handleGetAutomation(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  automationId: string
) {
  try {
    const automation = await prisma.automation.findFirst({
      where: {
        id: automationId,
        userId,
      },
    });

    if (!automation) {
      return res.status(404).json({ error: "Automation not found" });
    }

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

    return res.status(200).json(response);
  } catch (error) {
    logError("Failed to fetch automation", { error, userId, automationId });
    return res.status(500).json({ error: "Failed to fetch automation" });
  }
}

async function handleUpdateAutomation(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  automationId: string
) {
  try {
    // Check rate limit
    const rateLimitCheck = withRateLimit(gristApiRateLimiter)(
      userId,
      "update_automation"
    );
    if (!rateLimitCheck.allowed) {
      throw new AppErrorClass(
        ErrorType.RATE_LIMIT_EXCEEDED,
        `Rate limit exceeded. Try again in ${rateLimitCheck.retryAfter} seconds`,
        `Trop de requêtes. Réessayez dans ${rateLimitCheck.retryAfter} secondes.`
      );
    }

    const updateData = req.body as UpdateAutomationRequest;

    // Validate that at least one field is being updated
    if (!updateData || Object.keys(updateData).length === 0) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        "No update data provided",
        "Aucune donnée de mise à jour fournie"
      );
    }

    // Comprehensive validation
    const validation = validateAutomationUpdate(updateData);
    if (!validation.isValid) {
      throw new AppErrorClass(
        ErrorType.VALIDATION_ERROR,
        validation.errors.join(", "),
        validation.errors.join(", ")
      );
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn("Automation update warnings:", validation.warnings);
    }

    // Additional validation for status field
    if (updateData.status !== undefined) {
      if (!["active", "inactive"].includes(updateData.status)) {
        throw new AppErrorClass(
          ErrorType.VALIDATION_ERROR,
          "Status must be 'active' or 'inactive'",
          "Le statut doit être 'active' ou 'inactive'"
        );
      }
    }

    // Check if automation exists and belongs to user
    const existingAutomation = await prisma.automation.findFirst({
      where: {
        id: automationId,
        userId,
      },
    });

    if (!existingAutomation) {
      return res.status(404).json({ error: "Automation not found" });
    }

    // Prepare update data
    const updatePayload: any = {};

    if (updateData.name !== undefined) {
      updatePayload.name = updateData.name.trim();
    }
    if (updateData.description !== undefined) {
      updatePayload.description = updateData.description?.trim() || null;
    }
    if (updateData.status !== undefined) {
      updatePayload.status = updateData.status;
    }
    if (updateData.sourceDocumentId !== undefined) {
      updatePayload.sourceDocumentId = updateData.sourceDocumentId;
    }
    if (updateData.sourceDocumentName !== undefined) {
      updatePayload.sourceDocumentName = updateData.sourceDocumentName;
    }
    if (updateData.sourceTableId !== undefined) {
      updatePayload.sourceTableId = updateData.sourceTableId;
    }
    if (updateData.sourceTableName !== undefined) {
      updatePayload.sourceTableName = updateData.sourceTableName;
    }
    if (updateData.targetDocumentId !== undefined) {
      updatePayload.targetDocumentId = updateData.targetDocumentId;
    }
    if (updateData.targetDocumentName !== undefined) {
      updatePayload.targetDocumentName = updateData.targetDocumentName;
    }
    if (updateData.targetTableId !== undefined) {
      updatePayload.targetTableId = updateData.targetTableId;
    }
    if (updateData.targetTableName !== undefined) {
      updatePayload.targetTableName = updateData.targetTableName;
    }
    if (updateData.selectedColumns !== undefined) {
      updatePayload.selectedColumns = updateData.selectedColumns;
    }

    // Update automation
    const automation = await prisma.automation.update({
      where: { id: automationId },
      data: updatePayload,
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

    return res.status(200).json(response);
  } catch (error) {
    logError("Failed to update automation", { error, userId, automationId });

    if (error instanceof AppErrorClass) {
      throw error;
    }

    throw new AppErrorClass(
      ErrorType.SERVER_ERROR,
      error instanceof Error ? error.message : "Unknown error",
      "Erreur lors de la mise à jour de l'automation"
    );
  }
}

async function handleDeleteAutomation(
  req: NextApiRequest,
  res: NextApiResponse,
  userId: string,
  automationId: string
) {
  try {
    // Check if automation exists and belongs to user
    const existingAutomation = await prisma.automation.findFirst({
      where: {
        id: automationId,
        userId,
      },
    });

    if (!existingAutomation) {
      return res.status(404).json({ error: "Automation not found" });
    }

    // Delete automation
    await prisma.automation.delete({
      where: { id: automationId },
    });

    return res.status(204).end();
  } catch (error) {
    logError("Failed to delete automation", { error, userId, automationId });
    return res.status(500).json({ error: "Failed to delete automation" });
  }
}

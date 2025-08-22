import { NextApiRequest, NextApiResponse } from "next";
import { validateSession } from "../../../lib/auth";
import {
  withErrorHandling,
  validateHttpMethod,
  AppErrorClass,
  ErrorType,
} from "../../../lib/error-handling";

async function validateSessionHandler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Valider la méthode HTTP
  if (!validateHttpMethod(req, res, ["GET"])) {
    return;
  }

  const validation = await validateSession(req, res);

  if (!validation.valid) {
    const reason = validation.reason || "unknown";
    const errorType = getErrorTypeFromReason(reason);
    throw new AppErrorClass(
      errorType,
      `Validation échouée: ${reason}`,
      getValidationErrorMessage(reason)
    );
  }

  // Session valide
  if (!validation.session) {
    throw new AppErrorClass(
      ErrorType.SERVER_ERROR,
      "Session manquante malgré validation réussie",
      "Une erreur interne s'est produite"
    );
  }

  res.status(200).json({
    valid: true,
    session: {
      user: {
        id: validation.session.user.id,
        email: validation.session.user.email,
        name: validation.session.user.name,
        isPublicAgent: validation.session.user.isPublicAgent,
        organizational_unit: validation.session.user.organizational_unit,
      },
      expires: validation.session.expires,
    },
  });
}

function getErrorTypeFromReason(reason: string): ErrorType {
  switch (reason) {
    case "expired":
      return ErrorType.SESSION_EXPIRED;
    case "no_session":
      return ErrorType.AUTHENTICATION_FAILED;
    default:
      return ErrorType.AUTHENTICATION_FAILED;
  }
}

function getValidationErrorMessage(reason: string): string {
  switch (reason) {
    case "no_session":
      return "Aucune session active trouvée";
    case "expired":
      return "La session a expiré";
    default:
      return "Session invalide";
  }
}

export default withErrorHandling(validateSessionHandler, {
  action: "validate_session",
  requiresAuth: true,
});

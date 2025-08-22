import { NextApiRequest, NextApiResponse } from "next";
import {
  withErrorHandling,
  validateHttpMethod,
} from "../../../lib/error-handling";
import {
  validateProConnectEnvironment,
  validateProConnectConnectivity,
  getValidatedProConnectConfig,
} from "../../../lib/config-validation";

interface HealthCheckResponse {
  status: "healthy" | "unhealthy" | "warning";
  timestamp: string;
  environment: string;
  configuration: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
  connectivity?: {
    isReachable: boolean;
    errors: string[];
    latency?: number;
  };
  endpoints: {
    issuer: string;
    authorization: string;
    token: string;
    userinfo: string;
    jwks: string;
  };
}

async function proConnectHealthHandler(
  req: NextApiRequest,
  res: NextApiResponse<HealthCheckResponse>
) {
  // Valider la méthode HTTP
  if (!validateHttpMethod(req, res, ["GET"])) {
    return;
  }

  const timestamp = new Date().toISOString();

  // Vérifier la configuration
  const configResult = validateProConnectEnvironment();

  let connectivityResult;
  let config;

  try {
    // Si la configuration est valide, tester la connectivité
    if (configResult.isValid) {
      config = getValidatedProConnectConfig();
      connectivityResult = await validateProConnectConnectivity();
    }
  } catch (error) {
    // Si on ne peut pas obtenir la config ou tester la connectivité
    connectivityResult = {
      isReachable: false,
      errors: [error instanceof Error ? error.message : "Erreur inconnue"],
    };
  }

  // Déterminer le statut global
  let status: "healthy" | "unhealthy" | "warning";

  if (!configResult.isValid) {
    status = "unhealthy";
  } else if (connectivityResult && !connectivityResult.isReachable) {
    status = "unhealthy";
  } else if (configResult.warnings.length > 0) {
    status = "warning";
  } else {
    status = "healthy";
  }

  // Préparer la réponse
  const response: HealthCheckResponse = {
    status,
    timestamp,
    environment: configResult.environment,
    configuration: {
      isValid: configResult.isValid,
      errors: configResult.errors,
      warnings: configResult.warnings,
    },
    endpoints: config
      ? config.endpoints
      : {
          issuer: "Configuration invalide",
          authorization: "Configuration invalide",
          token: "Configuration invalide",
          userinfo: "Configuration invalide",
          jwks: "Configuration invalide",
        },
  };

  if (connectivityResult) {
    response.connectivity = connectivityResult;
  }

  // Définir le code de statut HTTP approprié
  const httpStatus = status === "unhealthy" ? 503 : 200;

  res.status(httpStatus).json(response);
}

export default withErrorHandling(proConnectHealthHandler, {
  action: "proconnect_health_check",
});

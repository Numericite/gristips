/* eslint-disable @typescript-eslint/no-explicit-any */
import { jwtVerify, importJWK } from "jose";
import {
  getValidatedProConnectConfig,
  validateRuntimeConfiguration,
} from "./config-validation";
import { AppErrorClass, ErrorType, logError } from "./error-handling";

// Interface pour les informations utilisateur ProConnect
export interface ProConnectUserInfo {
  sub: string;
  email: string;
  given_name: string;
  usual_name: string;
  organizational_unit?: string;
  belonging_population: string[];
}

// Configuration ProConnect selon l'environnement avec validation complète
export const getProConnectConfig = () => {
  try {
    // Utiliser la configuration validée si disponible
    return getValidatedProConnectConfig();
  } catch (error) {
    // Fallback vers la configuration basée sur le domaine
    // Ne pas logger l'erreur pendant le build pour éviter les échecs
    if (
      process.env.NODE_ENV !== "production" ||
      process.env.NEXT_PHASE === "phase-production-build"
    ) {
      console.warn(
        "ProConnect configuration validation failed, using domain-based configuration"
      );
    } else {
      logError(error, {
        action: "get_proconnect_config",
      });
    }

    const domain =
      process.env.PROCONNECT_DOMAIN || "fca.integ01.dev-agentconnect.fr";
    const isProduction = process.env.NODE_ENV === "production";

    return {
      clientId: process.env.PROCONNECT_CLIENT_ID!,
      clientSecret: process.env.PROCONNECT_CLIENT_SECRET!,
      issuer: process.env.PROCONNECT_ISSUER || `https://${domain}`,
      domain: domain,

      // Endpoints basés sur le domaine (approche API v2)
      endpoints: {
        authorization: `https://${domain}/api/v2/authorize`,
        token: `https://${domain}/api/v2/token`,
        userinfo: `https://${domain}/api/v2/userinfo`,
        jwks: `https://${domain}/api/v2/jwks`,
        wellKnown: `https://${domain}/api/v2/.well-known/openid-configuration`,
      },

      // Scopes obligatoires ProConnect
      scopes: [
        "openid",
        "given_name",
        "usual_name",
        "email",
        "organizational_unit",
        "belonging_population",
      ],
      environment: isProduction ? "production" : "integration",
      nextAuthUrl: process.env.NEXTAUTH_URL!,
      nextAuthSecret: process.env.NEXTAUTH_SECRET!,
    };
  }
};

// Vérification du statut d'agent public
export const isPublicAgent = (belongingPopulation: string[]): boolean => {
  console.log(belongingPopulation);
  return (
    Array.isArray(belongingPopulation) && belongingPopulation.includes("agent")
  );
};

// Transformation des claims ProConnect vers le format utilisateur
export const transformProConnectProfile = (
  profile: any
): ProConnectUserInfo => {
  return {
    sub: profile.sub,
    email: profile.email,
    given_name: profile.given_name,
    usual_name: profile.usual_name,
    organizational_unit: profile.organizational_unit,
    belonging_population: Array.isArray(profile.belonging_population)
      ? profile.belonging_population
      : [],
  };
};

// Cache pour les clés JWKS
let jwksCache: { keys: any[]; expires: number } | null = null;

// Récupération et mise en cache des clés JWKS ProConnect avec gestion d'erreur améliorée
export const getJWKS = async (): Promise<any[]> => {
  const now = Date.now();

  // Utiliser le cache si valide (1 heure)
  if (jwksCache && jwksCache.expires > now) {
    return jwksCache.keys;
  }

  try {
    // Valider la configuration avant de faire l'appel (sauf pendant le build)
    const isBuildTime =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.npm_lifecycle_event === "build" ||
      process.argv.includes("build");

    if (!isBuildTime) {
      validateRuntimeConfiguration();
    }
    const config = getProConnectConfig();
    const domain =
      process.env.PROCONNECT_DOMAIN || "fca.integ01.dev-agentconnect.fr";
    const jwksUrl = config.endpoints?.jwks || `https://${domain}/api/v2/jwks`;

    const response = await fetch(jwksUrl, {
      headers: {
        "User-Agent": "ProConnect-NextJS-Integration",
        Accept: "application/json",
      },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new AppErrorClass(
        ErrorType.PROCONNECT_ERROR,
        `Échec de récupération des clés JWKS: ${response.status} ${response.statusText}`,
        `Impossible de récupérer les clés de vérification depuis ${jwksUrl}`
      );
    }

    const jwks = await response.json();

    if (!jwks.keys || !Array.isArray(jwks.keys) || jwks.keys.length === 0) {
      throw new AppErrorClass(
        ErrorType.PROCONNECT_ERROR,
        "Format JWKS invalide: aucune clé trouvée",
        "La réponse JWKS ne contient pas de clés valides"
      );
    }

    // Mettre en cache pour 1 heure
    jwksCache = {
      keys: jwks.keys,
      expires: now + 60 * 60 * 1000,
    };

    return jwks.keys;
  } catch (error) {
    if (error instanceof AppErrorClass) {
      logError(error, {
        action: "fetch_jwks",
      });
      throw error;
    }

    // Gérer les erreurs de timeout et réseau
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        const timeoutError = new AppErrorClass(
          ErrorType.PROCONNECT_ERROR,
          "Timeout lors de la récupération des clés JWKS",
          "Le serveur ProConnect n'a pas répondu dans les temps"
        );
        logError(timeoutError, { action: "fetch_jwks" });
        throw timeoutError;
      }

      if (error.message.includes("fetch")) {
        const networkError = new AppErrorClass(
          ErrorType.PROCONNECT_ERROR,
          "Erreur réseau lors de la récupération des clés JWKS",
          "Impossible de contacter le serveur ProConnect"
        );
        logError(networkError, { action: "fetch_jwks" });
        throw networkError;
      }
    }

    const unknownError = new AppErrorClass(
      ErrorType.PROCONNECT_ERROR,
      error instanceof Error ? error.message : "Erreur inconnue",
      "Erreur inattendue lors de la récupération des clés JWKS"
    );
    logError(unknownError, { action: "fetch_jwks" });
    throw unknownError;
  }
};

// Vérification des tokens JWT ProConnect avec gestion d'erreur améliorée
export const verifyProConnectToken = async (token: string): Promise<any> => {
  if (!token || typeof token !== "string") {
    throw new AppErrorClass(
      ErrorType.VALIDATION_ERROR,
      "Token JWT manquant ou invalide",
      "Le token fourni n'est pas une chaîne valide"
    );
  }

  try {
    const keys = await getJWKS();
    const config = getProConnectConfig();

    let lastError: Error | null = null;

    // Essayer chaque clé jusqu'à trouver la bonne
    for (const key of keys) {
      try {
        const jwk = await importJWK(key);
        const { payload } = await jwtVerify(token, jwk, {
          issuer: config.issuer,
          audience: config.clientId,
          // Vérifications supplémentaires
          clockTolerance: 30, // 30 secondes de tolérance pour l'horloge
        });

        // Vérifier que le payload contient les claims requis
        if (!payload.sub || !payload.email) {
          throw new AppErrorClass(
            ErrorType.PROCONNECT_ERROR,
            "Token JWT valide mais claims manquants",
            "Le token ne contient pas les informations utilisateur requises"
          );
        }

        return payload;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        // Continuer avec la clé suivante
        continue;
      }
    }

    // Aucune clé n'a fonctionné
    const verificationError = new AppErrorClass(
      ErrorType.PROCONNECT_ERROR,
      "Impossible de vérifier le token JWT",
      lastError
        ? `Dernière erreur: ${lastError.message}`
        : "Aucune clé JWKS valide trouvée"
    );

    logError(verificationError, {
      action: "verify_proconnect_token",
    });

    throw verificationError;
  } catch (error) {
    if (error instanceof AppErrorClass) {
      throw error;
    }

    const unknownError = new AppErrorClass(
      ErrorType.PROCONNECT_ERROR,
      error instanceof Error ? error.message : "Erreur inconnue",
      "Erreur inattendue lors de la vérification du token JWT"
    );

    logError(unknownError, {
      action: "verify_proconnect_token",
    });

    throw unknownError;
  }
};

// Validation des variables d'environnement ProConnect (utilise maintenant le système centralisé)
export const validateProConnectConfig = (): void => {
  try {
    // Ne pas valider pendant le build
    const isBuildTime =
      process.env.NEXT_PHASE === "phase-production-build" ||
      process.env.npm_lifecycle_event === "build" ||
      process.argv.includes("build");

    if (!isBuildTime) {
      validateRuntimeConfiguration();
    }
  } catch (error) {
    if (error instanceof AppErrorClass) {
      throw error;
    }

    throw new AppErrorClass(
      ErrorType.INVALID_CONFIGURATION,
      error instanceof Error ? error.message : "Erreur de validation inconnue",
      "Échec de la validation de la configuration ProConnect"
    );
  }
};

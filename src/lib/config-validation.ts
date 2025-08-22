// Validation complète de la configuration ProConnect au démarrage
// This file will be moved to src/lib/validation/config.ts
import { AppErrorClass, ErrorType, logError } from "./error-handling";

export interface ProConnectValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  environment: "development" | "integration" | "production";
}

// Endpoints officiels ProConnect selon l'environnement
const PROCONNECT_ENDPOINTS = {
  integration: {
    issuer:
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect-particulier",
    authorization:
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect-particulier/protocol/openid-connect/auth",
    token:
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect-particulier/protocol/openid-connect/token",
    userinfo:
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect-particulier/protocol/openid-connect/userinfo",
    jwks: "https://auth.proconnect.gouv.fr/auth/realms/agent-connect-particulier/protocol/openid-connect/certs",
  },
  production: {
    issuer: "https://auth.proconnect.gouv.fr/auth/realms/agent-connect",
    authorization:
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect/protocol/openid-connect/auth",
    token:
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect/protocol/openid-connect/token",
    userinfo:
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect/protocol/openid-connect/userinfo",
    jwks: "https://auth.proconnect.gouv.fr/auth/realms/agent-connect/protocol/openid-connect/certs",
  },
};

// Scopes obligatoires selon la documentation ProConnect
const REQUIRED_PROCONNECT_SCOPES = [
  "openid",
  "given_name",
  "usual_name",
  "email",
  "organizational_unit",
  "belonging_population",
];

export function validateProConnectEnvironment(): ProConnectValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Déterminer l'environnement ProConnect
  const environment = determineProConnectEnvironment();

  // Variables d'environnement requises
  const requiredEnvVars = [
    "PROCONNECT_CLIENT_ID",
    "PROCONNECT_CLIENT_SECRET",
    "PROCONNECT_DOMAIN",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "DATABASE_URL",
  ];

  // Vérifier les variables requises
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      errors.push(`Variable d'environnement manquante: ${varName}`);
    }
  }

  // Validation spécifique ProConnect
  const clientId = process.env.PROCONNECT_CLIENT_ID;
  const clientSecret = process.env.PROCONNECT_CLIENT_SECRET;
  const nextAuthUrl = process.env.NEXTAUTH_URL;
  const issuer = process.env.PROCONNECT_ISSUER;

  // Validation du CLIENT_ID ProConnect
  if (clientId) {
    if (clientId === "your_client_id_here" || clientId === "your_client_id") {
      errors.push("PROCONNECT_CLIENT_ID contient encore la valeur par défaut");
    }
    if (clientId.length < 10) {
      warnings.push(
        "PROCONNECT_CLIENT_ID semble trop court (minimum recommandé: 10 caractères)"
      );
    }
    // Validation du format UUID pour ProConnect
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(clientId)) {
      warnings.push("PROCONNECT_CLIENT_ID ne semble pas être un UUID valide");
    }
  }

  // Validation du CLIENT_SECRET ProConnect
  if (clientSecret) {
    if (
      clientSecret === "your_client_secret_here" ||
      clientSecret === "your_client_secret"
    ) {
      errors.push(
        "PROCONNECT_CLIENT_SECRET contient encore la valeur par défaut"
      );
    }
    if (clientSecret.length < 32) {
      warnings.push(
        "PROCONNECT_CLIENT_SECRET semble trop court (minimum recommandé: 32 caractères)"
      );
    }
    // Vérifier que le secret ne contient pas d'espaces ou de caractères problématiques
    if (/\s/.test(clientSecret)) {
      errors.push("PROCONNECT_CLIENT_SECRET ne doit pas contenir d'espaces");
    }
  }

  // Validation de NEXTAUTH_URL
  if (nextAuthUrl) {
    try {
      const url = new URL(nextAuthUrl);
      if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
        errors.push("NEXTAUTH_URL doit utiliser HTTPS en production");
      }
      // Vérifier que l'URL se termine par un slash ou non selon les bonnes pratiques
      if (url.pathname !== "/" && url.pathname.endsWith("/")) {
        warnings.push("NEXTAUTH_URL ne devrait pas se terminer par un slash");
      }
      // Vérifier les domaines gouvernementaux en production
      if (
        process.env.NODE_ENV === "production" &&
        !url.hostname.endsWith(".gouv.fr")
      ) {
        warnings.push(
          "En production, il est recommandé d'utiliser un domaine .gouv.fr"
        );
      }
    } catch {
      errors.push("NEXTAUTH_URL n'est pas une URL valide");
    }
  }

  // Validation du domaine ProConnect
  const proConnectDomain = process.env.PROCONNECT_DOMAIN;
  if (proConnectDomain) {
    // Vérifier que le domaine est valide
    if (!proConnectDomain.includes(".")) {
      errors.push("PROCONNECT_DOMAIN doit être un domaine valide");
    }
    // Vérifier les domaines recommandés selon l'environnement
    if (environment === "integration" && !proConnectDomain.includes("integ")) {
      warnings.push(
        "Pour l'environnement d'intégration, utilisez un domaine contenant 'integ'"
      );
    }
  }

  // Validation de l'issuer ProConnect selon l'environnement
  if (issuer) {
    if (proConnectDomain && !issuer.includes(proConnectDomain)) {
      warnings.push(
        `PROCONNECT_ISSUER (${issuer}) ne correspond pas au PROCONNECT_DOMAIN (${proConnectDomain})`
      );
    }
  } else if (proConnectDomain) {
    // Si pas d'issuer défini mais domaine présent, construire l'issuer
    warnings.push(
      `PROCONNECT_ISSUER non défini. Utilisation par défaut: https://${proConnectDomain}`
    );
  }

  // Validation de NEXTAUTH_SECRET
  const nextAuthSecret = process.env.NEXTAUTH_SECRET;
  if (nextAuthSecret) {
    const defaultSecrets = [
      "development_secret_change_in_production",
      "your_nextauth_secret",
      "change_me_in_production",
      "secret",
    ];

    if (
      defaultSecrets.includes(nextAuthSecret) &&
      process.env.NODE_ENV === "production"
    ) {
      errors.push(
        "NEXTAUTH_SECRET doit être changé en production (valeur par défaut détectée)"
      );
    }
    if (nextAuthSecret.length < 32) {
      warnings.push(
        "NEXTAUTH_SECRET devrait faire au moins 32 caractères pour une sécurité optimale"
      );
    }
    // Vérifier la complexité du secret
    if (
      !/[A-Z]/.test(nextAuthSecret) ||
      !/[a-z]/.test(nextAuthSecret) ||
      !/[0-9]/.test(nextAuthSecret)
    ) {
      warnings.push(
        "NEXTAUTH_SECRET devrait contenir des majuscules, minuscules et chiffres"
      );
    }
  }

  // Validation de la base de données
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl) {
    if (
      !databaseUrl.startsWith("postgresql://") &&
      !databaseUrl.startsWith("postgres://")
    ) {
      errors.push(
        "DATABASE_URL doit être une URL PostgreSQL valide (postgresql:// ou postgres://)"
      );
    }
    try {
      const dbUrl = new URL(databaseUrl);
      if (!dbUrl.hostname) {
        errors.push("DATABASE_URL doit contenir un hostname valide");
      }
      if (!dbUrl.pathname || dbUrl.pathname === "/") {
        errors.push("DATABASE_URL doit spécifier un nom de base de données");
      }
      // Vérifier les credentials en production
      if (process.env.NODE_ENV === "production") {
        if (dbUrl.username === "postgres" || dbUrl.password === "password") {
          warnings.push(
            "Utilisez des credentials de base de données sécurisés en production"
          );
        }
      }
    } catch {
      errors.push("DATABASE_URL n'est pas une URL valide");
    }
  }

  // Validation des scopes ProConnect (si définis)
  const proConnectScopes = process.env.PROCONNECT_SCOPES;
  if (proConnectScopes) {
    const scopes = proConnectScopes.split(" ");
    const missingScopes = REQUIRED_PROCONNECT_SCOPES.filter(
      (scope) => !scopes.includes(scope)
    );
    if (missingScopes.length > 0) {
      errors.push(`Scopes ProConnect manquants: ${missingScopes.join(", ")}`);
    }
  }

  // Validation des URLs de callback
  if (nextAuthUrl) {
    try {
      const baseUrl = new URL(nextAuthUrl);
      const callbackUrl = `${baseUrl.origin}/api/auth/callback/proconnect`;

      // Vérifier que l'URL de callback est bien configurée
      warnings.push(
        `Assurez-vous que l'URL de callback ${callbackUrl} est configurée dans votre application ProConnect`
      );
    } catch {
      // URL déjà validée plus haut
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    environment,
  };
}

// Fonction pour déterminer l'environnement ProConnect
function determineProConnectEnvironment():
  | "development"
  | "integration"
  | "production" {
  const nodeEnv = process.env.NODE_ENV;
  const issuer = process.env.PROCONNECT_ISSUER;

  // Si l'issuer est explicitement défini, l'utiliser pour déterminer l'environnement
  if (issuer) {
    if (issuer.includes("agent-connect-particulier")) {
      return "integration";
    }
    if (issuer.includes("agent-connect") && !issuer.includes("particulier")) {
      return "production";
    }
  }

  // Sinon, utiliser NODE_ENV
  if (nodeEnv === "production") {
    return "production";
  }

  return "integration"; // Par défaut pour development et test
}

// Fonction pour afficher les résultats de validation
export function logValidationResults(result: ProConnectValidationResult): void {
  console.log(
    `🔧 Validation de la configuration ProConnect (environnement: ${result.environment})`
  );

  if (result.errors.length > 0) {
    console.error("❌ Erreurs de configuration ProConnect:");
    result.errors.forEach((error) => console.error(`  - ${error}`));
    console.error("");
    console.error("📖 Pour résoudre ces erreurs:");
    console.error("  1. Vérifiez votre fichier .env.local");
    console.error(
      "  2. Consultez la documentation ProConnect: https://docs.proconnect.gouv.fr/"
    );
    console.error(
      "  3. Vérifiez votre inscription sur le portail partenaires ProConnect"
    );
    console.error("");
  }

  if (result.warnings.length > 0) {
    console.warn("⚠️  Avertissements de configuration ProConnect:");
    result.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    console.warn("");
  }

  if (result.isValid && result.warnings.length === 0) {
    console.log("✅ Configuration ProConnect valide");
  } else if (result.isValid) {
    console.log("✅ Configuration ProConnect valide (avec avertissements)");
  }

  // Afficher les endpoints utilisés
  const endpoints =
    PROCONNECT_ENDPOINTS[
      result.environment === "development" ? "integration" : result.environment
    ];
  console.log(`🔗 Endpoints ProConnect utilisés (${result.environment}):`);
  console.log(`  - Issuer: ${endpoints.issuer}`);
  console.log(`  - Authorization: ${endpoints.authorization}`);
  console.log(`  - Token: ${endpoints.token}`);
  console.log(`  - UserInfo: ${endpoints.userinfo}`);
  console.log(`  - JWKS: ${endpoints.jwks}`);
  console.log("");
}

// Validation au démarrage avec gestion d'erreur
export function validateConfigurationAtStartup(): void {
  try {
    const result = validateProConnectEnvironment();
    logValidationResults(result);

    if (!result.isValid) {
      const configError = new AppErrorClass(
        ErrorType.INVALID_CONFIGURATION,
        `Configuration ProConnect invalide: ${result.errors.join(", ")}`,
        "L'application ne peut pas démarrer avec ces erreurs de configuration"
      );

      logError(configError, {
        action: "startup_validation",
      });

      console.error(
        "\n🚨 L'application ne peut pas démarrer avec ces erreurs de configuration."
      );
      console.error(
        "Veuillez corriger les erreurs ci-dessus et redémarrer l'application."
      );
      console.error("\n📋 Actions recommandées:");
      console.error("  1. Copiez .env.example vers .env.local");
      console.error(
        "  2. Remplissez les variables avec vos vraies valeurs ProConnect"
      );
      console.error(
        "  3. Vérifiez que votre application est bien enregistrée sur ProConnect"
      );
      console.error("  4. Redémarrez l'application\n");

      if (process.env.NODE_ENV === "production") {
        process.exit(1);
      } else {
        // En développement, continuer mais avec un warning visible
        console.warn(
          "⚠️  Démarrage en mode développement malgré les erreurs de configuration"
        );
      }
    }
  } catch (error) {
    const validationError = new AppErrorClass(
      ErrorType.INVALID_CONFIGURATION,
      error instanceof Error
        ? error.message
        : "Erreur inconnue lors de la validation",
      "Échec de la validation de la configuration au démarrage"
    );

    logError(validationError, {
      action: "startup_validation",
    });

    console.error(
      "🚨 Erreur critique lors de la validation de la configuration:",
      error
    );

    if (process.env.NODE_ENV === "production") {
      process.exit(1);
    }
  }
}

// Fonction pour valider la configuration à l'exécution (pour les API routes)
export function validateRuntimeConfiguration(): void {
  const result = validateProConnectEnvironment();

  if (!result.isValid) {
    throw new AppErrorClass(
      ErrorType.INVALID_CONFIGURATION,
      `Configuration ProConnect invalide: ${result.errors.join(", ")}`,
      "La configuration ProConnect n'est pas valide pour cette opération"
    );
  }
}

// Fonction pour obtenir la configuration validée
export function getValidatedProConnectConfig() {
  const result = validateProConnectEnvironment();

  if (!result.isValid) {
    throw new AppErrorClass(
      ErrorType.INVALID_CONFIGURATION,
      `Configuration ProConnect invalide: ${result.errors.join(", ")}`
    );
  }

  const environment =
    result.environment === "development" ? "integration" : result.environment;
  const endpoints = PROCONNECT_ENDPOINTS[environment];

  return {
    clientId: process.env.PROCONNECT_CLIENT_ID!,
    clientSecret: process.env.PROCONNECT_CLIENT_SECRET!,
    issuer: process.env.PROCONNECT_ISSUER || endpoints.issuer,
    endpoints,
    scopes: REQUIRED_PROCONNECT_SCOPES,
    environment: result.environment,
    nextAuthUrl: process.env.NEXTAUTH_URL!,
    nextAuthSecret: process.env.NEXTAUTH_SECRET!,
  };
}

// Fonction pour vérifier la connectivité aux endpoints ProConnect
export async function validateProConnectConnectivity(): Promise<{
  isReachable: boolean;
  errors: string[];
  latency?: number;
}> {
  const errors: string[] = [];
  const startTime = Date.now();

  try {
    const config = getValidatedProConnectConfig();

    // Tester la connectivité vers l'endpoint JWKS (le plus critique)
    const response = await fetch(config.endpoints.jwks, {
      method: "GET",
      headers: {
        "User-Agent": "ProConnect-Integration-Test",
      },
      // Timeout de 10 secondes
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      errors.push(
        `Endpoint JWKS non accessible: ${response.status} ${response.statusText}`
      );
    }

    const latency = Date.now() - startTime;

    return {
      isReachable: errors.length === 0,
      errors,
      latency,
    };
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        errors.push("Timeout lors de la connexion aux endpoints ProConnect");
      } else {
        errors.push(`Erreur de connectivité: ${error.message}`);
      }
    } else {
      errors.push("Erreur inconnue lors du test de connectivité");
    }

    return {
      isReachable: false,
      errors,
    };
  }
}

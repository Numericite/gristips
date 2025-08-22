import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { validateProConnectEnvironment } from "../../lib/config-validation";
import { useState } from "react";
import { apiCall } from "../../lib/client-error-handling";

interface ConfigCheckProps {
  configResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    environment: string;
  };
}

interface HealthCheckResult {
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

export default function ConfigCheckPage({ configResult }: ConfigCheckProps) {
  const [healthCheck, setHealthCheck] = useState<HealthCheckResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const runHealthCheck = async () => {
    setIsLoading(true);
    try {
      const result = await apiCall<HealthCheckResult>("/api/health/proconnect");
      setHealthCheck(result);
    } catch (error) {
      console.error("Erreur lors du health check:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
        return <Badge severity="success">Sain</Badge>;
      case "warning":
        return <Badge severity="warning">Avertissement</Badge>;
      case "unhealthy":
        return <Badge severity="error">Problème</Badge>;
      default:
        return <Badge severity="info">Inconnu</Badge>;
    }
  };

  return (
    <div className="fr-container fr-py-4w">
      <div className="fr-grid-row">
        <div className="fr-col-12">
          <h1>Vérification de la configuration ProConnect</h1>
          <p className="fr-text--lead">
            Cette page permet de vérifier la configuration ProConnect de
            l&apos;application.
          </p>

          {/* Configuration statique */}
          <Card
            title="Configuration ProConnect"
            desc={
              <div>
                <div className="fr-mb-2w">
                  <strong>Environnement:</strong> {configResult.environment}
                </div>
                <div className="fr-mb-2w">
                  <strong>Statut:</strong>{" "}
                  {getStatusBadge(
                    configResult.isValid ? "healthy" : "unhealthy"
                  )}
                </div>

                {configResult.errors.length > 0 && (
                  <Alert
                    severity="error"
                    title="Erreurs de configuration"
                    description={
                      <ul>
                        {configResult.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    }
                  />
                )}

                {configResult.warnings.length > 0 && (
                  <Alert
                    severity="warning"
                    title="Avertissements de configuration"
                    description={
                      <ul>
                        {configResult.warnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    }
                  />
                )}

                {configResult.isValid && configResult.warnings.length === 0 && (
                  <Alert
                    severity="success"
                    title="Configuration valide"
                    description="Toutes les variables d'environnement ProConnect sont correctement configurées."
                  />
                )}
              </div>
            }
          />

          {/* Test de connectivité */}
          <Card
            title="Test de connectivité ProConnect"
            desc={
              <div>
                <p>
                  Testez la connectivité vers les endpoints ProConnect pour
                  vérifier que l&apos;application peut communiquer avec les
                  services.
                </p>

                <Button
                  priority="primary"
                  onClick={runHealthCheck}
                  disabled={isLoading || !configResult.isValid}
                >
                  {isLoading ? "Test en cours..." : "Tester la connectivité"}
                </Button>

                {!configResult.isValid && (
                  <p className="fr-text--sm fr-mt-2w">
                    <em>
                      Le test de connectivité nécessite une configuration
                      valide.
                    </em>
                  </p>
                )}

                {healthCheck && (
                  <div className="fr-mt-4w">
                    <h3>Résultats du test</h3>

                    <div className="fr-mb-2w">
                      <strong>Statut global:</strong>{" "}
                      {getStatusBadge(healthCheck.status)}
                    </div>

                    <div className="fr-mb-2w">
                      <strong>Timestamp:</strong>{" "}
                      {new Date(healthCheck.timestamp).toLocaleString("fr-FR")}
                    </div>

                    {healthCheck.connectivity && (
                      <div className="fr-mb-2w">
                        <strong>Connectivité:</strong>{" "}
                        {healthCheck.connectivity.isReachable
                          ? "✅ Accessible"
                          : "❌ Inaccessible"}
                        {healthCheck.connectivity.latency && (
                          <span>
                            {" "}
                            (Latence: {healthCheck.connectivity.latency}ms)
                          </span>
                        )}
                      </div>
                    )}

                    {healthCheck.connectivity?.errors &&
                      healthCheck.connectivity.errors.length > 0 && (
                        <Alert
                          severity="error"
                          title="Erreurs de connectivité"
                          description={
                            <ul>
                              {healthCheck.connectivity.errors.map(
                                (error, index) => (
                                  <li key={index}>{error}</li>
                                )
                              )}
                            </ul>
                          }
                        />
                      )}

                    <details className="fr-mt-3w">
                      <summary>Endpoints testés</summary>
                      <ul className="fr-mt-2w">
                        <li>
                          <strong>Issuer:</strong>{" "}
                          {healthCheck.endpoints.issuer}
                        </li>
                        <li>
                          <strong>Authorization:</strong>{" "}
                          {healthCheck.endpoints.authorization}
                        </li>
                        <li>
                          <strong>Token:</strong> {healthCheck.endpoints.token}
                        </li>
                        <li>
                          <strong>UserInfo:</strong>{" "}
                          {healthCheck.endpoints.userinfo}
                        </li>
                        <li>
                          <strong>JWKS:</strong> {healthCheck.endpoints.jwks}
                        </li>
                      </ul>
                    </details>
                  </div>
                )}
              </div>
            }
          />

          <div className="fr-mt-4w">
            <Button
              priority="secondary"
              linkProps={{
                href: "/admin",
              }}
            >
              Retour à l&apos;administration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Vérifier que l'utilisateur est connecté et est un agent public
  if (!session || !session.user.isPublicAgent) {
    return {
      redirect: {
        destination: "/auth/access-denied",
        permanent: false,
      },
    };
  }

  // Valider la configuration ProConnect
  let configResult;
  try {
    configResult = validateProConnectEnvironment();
  } catch (error) {
    // Si la validation échoue, créer un résultat d'erreur
    configResult = {
      isValid: false,
      errors: [
        error instanceof Error
          ? error.message
          : "Erreur de configuration inconnue",
      ],
      warnings: [],
      environment:
        process.env.NODE_ENV === "production" ? "production" : "integration",
    };
  }

  return {
    props: {
      configResult,
    },
  };
};

import React, { useState, useEffect } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

interface GristApiKeyConfigProps {
  onApiKeyUpdate?: (hasValidKey: boolean) => void;
}

interface ApiKeyStatus {
  hasApiKey: boolean;
  isValid?: boolean;
}

interface ApiKeyResponse {
  success: boolean;
  isValid: boolean;
  message?: string;
}

export function GristApiKeyConfig({ onApiKeyUpdate }: GristApiKeyConfigProps) {
  const { classes } = useStyles();
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatus | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  // Load current API key status on component mount
  useEffect(() => {
    loadApiKeyStatus();
  }, []);

  // Notify parent component when API key status changes
  useEffect(() => {
    if (apiKeyStatus && onApiKeyUpdate) {
      onApiKeyUpdate(apiKeyStatus.hasApiKey && apiKeyStatus.isValid === true);
    }
  }, [apiKeyStatus, onApiKeyUpdate]);

  const loadApiKeyStatus = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/grist-api-key", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la vérification de la clé API");
      }

      const data: ApiKeyStatus = await response.json();
      setApiKeyStatus(data);
    } catch (err) {
      console.error("Error loading API key status:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement du statut de la clé API"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!apiKey.trim()) {
      setError("Veuillez saisir une clé API");
      return;
    }

    if (apiKey.trim().length < 10) {
      setError("La clé API semble trop courte (moins de 10 caractères)");
      return;
    }

    if (apiKey.trim().length > 500) {
      setError("La clé API semble trop longue (plus de 500 caractères)");
      return;
    }

    if (apiKey.includes(" ")) {
      setError("La clé API ne devrait pas contenir d'espaces");
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/grist-api-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      const data: ApiKeyResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Erreur lors de la sauvegarde de la clé API"
        );
      }

      if (data.success && data.isValid) {
        setSuccess(data.message || "Clé API sauvegardée avec succès");
        setApiKey("");
        // Reload status to get updated information
        await loadApiKeyStatus();
      } else {
        setError("La clé API n'est pas valide");
      }
    } catch (err) {
      console.error("Error saving API key:", err);

      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes("429") || err.message.includes("rate limit")) {
          setError(
            "Trop de tentatives de validation. Veuillez patienter avant de réessayer."
          );
        } else if (err.message.includes("timeout")) {
          setError(
            "Délai d'attente dépassé. Vérifiez votre connexion internet et réessayez."
          );
        } else if (err.message.includes("network")) {
          setError(
            "Erreur réseau. Vérifiez votre connexion internet et réessayez."
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Erreur lors de la sauvegarde de la clé API");
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleTestApiKey = async () => {
    if (!apiKeyStatus?.hasApiKey) {
      return;
    }

    setIsValidating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/admin/grist-api-key", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la validation de la clé API");
      }

      const data: ApiKeyStatus = await response.json();
      setApiKeyStatus(data);

      if (data.hasApiKey && data.isValid) {
        setSuccess("La clé API est valide et fonctionnelle");
      } else if (data.hasApiKey && data.isValid === false) {
        setError("La clé API stockée n'est plus valide");
      } else {
        setError("Aucune clé API configurée");
      }
    } catch (err) {
      setError("Erreur lors de la validation de la clé API");
    } finally {
      setIsValidating(false);
    }
  };

  const getStatusBadge = () => {
    if (!apiKeyStatus?.hasApiKey) {
      return (
        <Badge severity="warning" small>
          Non configurée
        </Badge>
      );
    }

    if (apiKeyStatus.isValid === true) {
      return (
        <Badge severity="success" small>
          Valide
        </Badge>
      );
    }

    if (apiKeyStatus.isValid === false) {
      return (
        <Badge severity="error" small>
          Invalide
        </Badge>
      );
    }

    return (
      <Badge severity="info" small>
        En cours de vérification
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card
        background
        border
        title="Configuration de la clé API Grist"
        desc="Chargement..."
        start={
          <div className={classes.cardIcon}>
            <i className={fr.cx("ri-key-2-line")} />
          </div>
        }
      />
    );
  }

  return (
    <Card
      background
      border
      title="Configuration de la clé API Grist"
      desc="Configurez votre clé API Grist pour accéder à vos documents"
      start={
        <div className={classes.cardIcon}>
          <i className={fr.cx("ri-key-2-line")} />
        </div>
      }
      footer={
        <div className={classes.cardContent}>
          {/* Current status */}
          <div className={classes.statusSection}>
            <div className={classes.statusRow}>
              <strong>Statut actuel :</strong>
              {getStatusBadge()}
            </div>
            {apiKeyStatus?.hasApiKey && (
              <div className={classes.testSection}>
                <Button
                  priority="tertiary"
                  size="small"
                  iconId="fr-icon-refresh-line"
                  onClick={handleTestApiKey}
                  disabled={isValidating}
                >
                  {isValidating ? "Test en cours..." : "Tester la clé API"}
                </Button>
              </div>
            )}
          </div>

          {/* Error/Success messages */}
          {error && (
            <Alert
              severity="error"
              title="Erreur"
              description={error}
              className={classes.alert}
              closable
              onClose={() => setError(null)}
            />
          )}

          {success && (
            <Alert
              severity="success"
              title="Succès"
              description={success}
              className={classes.alert}
              closable
              onClose={() => setSuccess(null)}
            />
          )}

          {/* API Key form */}
          <form onSubmit={handleSubmit} className={classes.form}>
            <div className={classes.inputSection}>
              <Input
                label="Clé API Grist"
                hintText="Saisissez votre clé API Grist pour accéder à vos documents"
                nativeInputProps={{
                  type: showApiKey ? "text" : "password",
                  value: apiKey,
                  onChange: (e) => setApiKey(e.target.value),
                  placeholder: "Votre clé API Grist...",
                  autoComplete: "off",
                }}
                state="default"
              />

              <div className={classes.inputActions}>
                <Button
                  priority="tertiary no outline"
                  size="small"
                  iconId={
                    showApiKey ? "fr-icon-eye-off-line" : "fr-icon-eye-line"
                  }
                  onClick={() => setShowApiKey(!showApiKey)}
                  type="button"
                >
                  {showApiKey ? "Masquer" : "Afficher"}
                </Button>
              </div>
            </div>

            <div className={classes.formActions}>
              <Button
                priority="primary"
                size="small"
                iconId="fr-icon-save-line"
                type="submit"
                disabled={isValidating || !apiKey.trim()}
              >
                {isValidating
                  ? "Validation en cours..."
                  : "Sauvegarder la clé API"}
              </Button>
            </div>
          </form>

          {/* Help text */}
          <div className={classes.helpText}>
            <p>
              <strong>Comment obtenir votre clé API Grist :</strong>
            </p>
            <ol>
              <li>Connectez-vous à votre compte Grist</li>
              <li>Allez dans les paramètres de votre profil</li>
              <li>Générez une nouvelle clé API dans la section "API"</li>
              <li>Copiez la clé et collez-la dans le champ ci-dessus</li>
            </ol>
            <p className={classes.securityNote}>
              <i className={fr.cx("fr-icon-information-line")} />
              Votre clé API sera stockée de manière sécurisée et chiffrée.
            </p>
          </div>
        </div>
      }
    />
  );
}

const useStyles = tss.withName("GristApiKeyConfig").create(() => ({
  cardIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "3rem",
    height: "3rem",
    borderRadius: "50%",
    backgroundColor:
      fr.colors.decisions.background.actionHigh.blueFrance.default,
    color: fr.colors.decisions.text.inverted.grey.default,

    "& i": {
      fontSize: "1.5rem",

      "&::before": {
        "--icon-size": "1.5rem",
      },
    },
  },

  cardContent: {
    marginTop: fr.spacing("3w"),
  },

  statusSection: {
    marginBottom: fr.spacing("4w"),
    padding: fr.spacing("3w"),
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
    borderRadius: fr.spacing("1w"),
  },

  statusRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: fr.spacing("2w"),

    "& strong": {
      color: fr.colors.decisions.text.title.grey.default,
    },
  },

  testSection: {
    display: "flex",
    justifyContent: "flex-end",
  },

  alert: {
    marginBottom: fr.spacing("3w"),
  },

  form: {
    marginBottom: fr.spacing("4w"),
  },

  inputSection: {
    position: "relative",
    marginBottom: fr.spacing("3w"),
  },

  inputActions: {
    position: "absolute",
    right: fr.spacing("2w"),
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 1,
  },

  formActions: {
    display: "flex",
    justifyContent: "flex-end",
  },

  helpText: {
    padding: fr.spacing("3w"),
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
    borderRadius: fr.spacing("1w"),
    fontSize: "0.875rem",
    color: fr.colors.decisions.text.default.grey.default,

    "& p": {
      margin: `0 0 ${fr.spacing("2w")} 0`,

      "&:last-child": {
        margin: 0,
      },
    },

    "& ol": {
      paddingLeft: fr.spacing("4w"),
      margin: `${fr.spacing("2w")} 0`,

      "& li": {
        marginBottom: fr.spacing("1w"),
      },
    },
  },

  securityNote: {
    display: "flex",
    alignItems: "center",
    gap: fr.spacing("1w"),
    fontStyle: "italic",
    color: fr.colors.decisions.text.mention.grey.default,

    "& i": {
      fontSize: "1rem",
      color: fr.colors.decisions.background.actionHigh.blueFrance.default,

      "&::before": {
        "--icon-size": "1rem",
      },
    },
  },
}));

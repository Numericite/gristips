/* eslint-disable react/no-unescaped-entities */
import React, { useState, useEffect } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";

interface AutomationListItem {
  id: string;
  name: string;
  description?: string;
  type: string;
  status: "active" | "inactive" | "error";
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

interface AutomationListProps {
  automations?: AutomationListItem[];
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => Promise<void>;
  onToggleStatus?: (id: string, status: "active" | "inactive") => Promise<void>;
  onCreateNew?: () => void;
  compact?: boolean;
}

interface GetAutomationsResponse {
  automations: AutomationListItem[];
}

export function AutomationList({
  automations: externalAutomations,
  onEdit,
  onDelete,
  onToggleStatus,
  onCreateNew,
  compact = false,
}: AutomationListProps) {
  const { classes } = useStyles();
  const [internalAutomations, setInternalAutomations] = useState<
    AutomationListItem[]
  >([]);
  const [isLoading, setIsLoading] = useState(!externalAutomations);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [automationToDelete, setAutomationToDelete] = useState<string | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingStatus, setIsTogglingStatus] = useState<string | null>(null);

  // Use external automations if provided, otherwise load internally
  const automations = externalAutomations || internalAutomations;

  useEffect(() => {
    if (!externalAutomations) {
      loadAutomations();
    }
  }, [externalAutomations]);

  const loadAutomations = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/automations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erreur lors du chargement des automations");
      }

      const data: GetAutomationsResponse = await response.json();
      setInternalAutomations(data.automations);
    } catch (err) {
      console.error("Error loading automations:", err);

      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes("429") || err.message.includes("rate limit")) {
          setError("Trop de requêtes. Veuillez patienter avant de réessayer.");
        } else if (err.message.includes("timeout")) {
          setError(
            "Délai d'attente dépassé. Vérifiez votre connexion et réessayez."
          );
        } else if (err.message.includes("network")) {
          setError("Erreur réseau. Vérifiez votre connexion internet.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Erreur lors du chargement des automations");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (automationId: string) => {
    setAutomationToDelete(automationId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!automationToDelete) return;

    setIsDeleting(true);
    setError(null);

    try {
      if (onDelete) {
        // Use external delete handler
        await onDelete(automationToDelete);
      } else {
        // Use internal delete logic
        const response = await fetch(
          `/api/admin/automations/${automationToDelete}`,
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        if (!response.ok) {
          throw new Error("Erreur lors de la suppression de l'automation");
        }

        setInternalAutomations((prev) =>
          prev.filter((a) => a.id !== automationToDelete)
        );
      }

      setSuccess("Automation supprimée avec succès");
    } catch (err) {
      console.error("Error deleting automation:", err);

      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes("429") || err.message.includes("rate limit")) {
          setError("Trop de requêtes. Veuillez patienter avant de réessayer.");
        } else if (err.message.includes("404")) {
          setError(
            "Automation non trouvée. Elle a peut-être déjà été supprimée."
          );
        } else if (err.message.includes("timeout")) {
          setError(
            "Délai d'attente dépassé. Vérifiez votre connexion et réessayez."
          );
        } else if (err.message.includes("network")) {
          setError("Erreur réseau. Vérifiez votre connexion internet.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Erreur lors de la suppression de l'automation");
      }
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setAutomationToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setAutomationToDelete(null);
  };

  const handleToggleStatus = async (
    automationId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "active" ? "inactive" : "active";
    setIsTogglingStatus(automationId);
    setError(null);

    try {
      if (onToggleStatus) {
        // Use external toggle handler
        await onToggleStatus(automationId, newStatus as "active" | "inactive");
      } else {
        // Use internal toggle logic
        const response = await fetch(`/api/admin/automations/${automationId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status: newStatus }),
        });

        if (!response.ok) {
          throw new Error("Erreur lors de la modification du statut");
        }

        const updatedAutomation: AutomationListItem = await response.json();
        setInternalAutomations((prev) =>
          prev.map((a) => (a.id === automationId ? updatedAutomation : a))
        );
      }

      setSuccess(
        `Automation ${
          newStatus === "active" ? "activée" : "désactivée"
        } avec succès`
      );
    } catch (err) {
      console.error("Error toggling automation status:", err);

      // Handle different types of errors
      if (err instanceof Error) {
        if (err.message.includes("429") || err.message.includes("rate limit")) {
          setError("Trop de requêtes. Veuillez patienter avant de réessayer.");
        } else if (err.message.includes("404")) {
          setError("Automation non trouvée. Elle a peut-être été supprimée.");
        } else if (err.message.includes("timeout")) {
          setError(
            "Délai d'attente dépassé. Vérifiez votre connexion et réessayez."
          );
        } else if (err.message.includes("network")) {
          setError("Erreur réseau. Vérifiez votre connexion internet.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Erreur lors de la modification du statut");
      }
    } finally {
      setIsTogglingStatus(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge severity="success" small>
            Active
          </Badge>
        );
      case "inactive":
        return (
          <Badge severity="info" small>
            Inactive
          </Badge>
        );
      case "error":
        return (
          <Badge severity="error" small>
            Erreur
          </Badge>
        );
      default:
        return (
          <Badge severity="info" small>
            {status}
          </Badge>
        );
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getAutomationToDeleteName = () => {
    if (!automationToDelete) return "";
    const automation = automations.find((a) => a.id === automationToDelete);
    return automation?.name || "";
  };

  if (isLoading) {
    return (
      <Card
        background
        border
        title="Gestion des automations"
        desc="Chargement des automations..."
        start={
          <div className={classes.cardIcon}>
            <i className={fr.cx("ri-settings-3-line")} />
          </div>
        }
      />
    );
  }

  if (compact) {
    // Compact mode - just render the list without card wrapper
    return (
      <>
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

        {/* Automations list */}
        {!automations || automations.length === 0 ? (
          <div className={classes.emptyState}>
            <p>Aucune automation configurée</p>
          </div>
        ) : (
          <div className={classes.automationsList}>
            {automations.map((automation) => (
              <div key={automation.id} className={classes.automationCard}>
                <div className={classes.automationHeader}>
                  <div className={classes.automationTitle}>
                    <h4>{automation.name}</h4>
                    {getStatusBadge(automation.status)}
                  </div>
                  <div className={classes.automationActions}>
                    <Button
                      priority="tertiary no outline"
                      size="small"
                      iconId="fr-icon-edit-line"
                      onClick={() => onEdit?.(automation.id)}
                      title="Modifier l'automation"
                    >
                      Modifier
                    </Button>
                    <Button
                      priority="tertiary no outline"
                      size="small"
                      iconId={
                        automation.status === "active"
                          ? "fr-icon-pause-circle-line"
                          : "fr-icon-play-circle-line"
                      }
                      onClick={() =>
                        handleToggleStatus(automation.id, automation.status)
                      }
                      disabled={isTogglingStatus === automation.id}
                      title={
                        automation.status === "active"
                          ? "Désactiver l'automation"
                          : "Activer l'automation"
                      }
                    >
                      {isTogglingStatus === automation.id
                        ? "..."
                        : automation.status === "active"
                        ? "Désactiver"
                        : "Activer"}
                    </Button>
                    <Button
                      priority="tertiary no outline"
                      size="small"
                      iconId="fr-icon-delete-line"
                      onClick={() => handleDeleteClick(automation.id)}
                      title="Supprimer l'automation"
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>

                {automation.description && (
                  <p className={classes.automationDescription}>
                    {automation.description}
                  </p>
                )}

                <div className={classes.automationDetails}>
                  <div className={classes.automationFlow}>
                    <div className={classes.flowItem}>
                      <div className={classes.flowLabel}>Source</div>
                      <div className={classes.flowValue}>
                        <strong>{automation.sourceDocumentName}</strong>
                        <span className={classes.tableName}>
                          → {automation.sourceTableName}
                        </span>
                      </div>
                    </div>
                    <div className={classes.flowArrow}>
                      <i className={fr.cx("ri-arrow-right-line")} />
                    </div>
                    <div className={classes.flowItem}>
                      <div className={classes.flowLabel}>Destination</div>
                      <div className={classes.flowValue}>
                        <strong>{automation.targetDocumentName}</strong>
                        <span className={classes.tableName}>
                          → {automation.targetTableName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={classes.automationMeta}>
                    <div className={classes.metaItem}>
                      <span className={classes.metaLabel}>Colonnes :</span>
                      <span className={classes.metaValue}>
                        {automation.selectedColumns.length} sélectionnée(s)
                      </span>
                    </div>
                    <div className={classes.metaItem}>
                      <span className={classes.metaLabel}>Créée le :</span>
                      <span className={classes.metaValue}>
                        {formatDate(automation.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Delete confirmation dialog */}
        {showDeleteConfirm && (
          <div className={classes.modalOverlay}>
            <div className={classes.modalContent}>
              <div className={classes.modalHeader}>
                <h3>Confirmer la suppression</h3>
                <Button
                  priority="tertiary no outline"
                  size="small"
                  iconId="fr-icon-close-line"
                  onClick={handleDeleteCancel}
                  title="Fermer"
                />
              </div>
              <div className={classes.modalBody}>
                <p>
                  Êtes-vous sûr de vouloir supprimer l&apos;automation{" "}
                  <strong>&quot;{getAutomationToDeleteName()}&quot;</strong> ?
                </p>
                <p>Cette action est irréversible.</p>
              </div>
              <div className={classes.modalFooter}>
                <Button
                  priority="secondary"
                  size="small"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  Annuler
                </Button>
                <Button
                  priority="primary"
                  size="small"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Suppression..." : "Supprimer"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <Card
        background
        border
        title="Gestion des automations"
        desc="Gérez vos automations de synchronisation Grist"
        start={
          <div className={classes.cardIcon}>
            <i className={fr.cx("ri-settings-3-line")} />
          </div>
        }
        footer={
          <div className={classes.cardContent}>
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

            {/* Create new automation button */}
            <div className={classes.headerActions}>
              <Button
                priority="primary"
                size="small"
                iconId="fr-icon-add-line"
                onClick={onCreateNew}
              >
                Créer une nouvelle automation
              </Button>
            </div>

            {/* Automations list */}
            {!automations || automations.length === 0 ? (
              <div className={classes.emptyState}>
                <div className={classes.emptyIcon}>
                  <i className={fr.cx("ri-robot-line")} />
                </div>
                <h3>Aucune automation configurée</h3>
                <p>
                  Créez votre première automation pour synchroniser vos
                  documents Grist automatiquement.
                </p>
                <Button
                  priority="secondary"
                  size="small"
                  iconId="fr-icon-add-line"
                  onClick={onCreateNew}
                >
                  Créer une automation
                </Button>
              </div>
            ) : (
              <div className={classes.automationsList}>
                {automations.map((automation) => (
                  <div key={automation.id} className={classes.automationCard}>
                    <div className={classes.automationHeader}>
                      <div className={classes.automationTitle}>
                        <h4>{automation.name}</h4>
                        {getStatusBadge(automation.status)}
                      </div>
                      <div className={classes.automationActions}>
                        <Button
                          priority="tertiary no outline"
                          size="small"
                          iconId="fr-icon-edit-line"
                          onClick={() => onEdit?.(automation.id)}
                          title="Modifier l'automation"
                        >
                          Modifier
                        </Button>
                        <Button
                          priority="tertiary no outline"
                          size="small"
                          iconId={
                            automation.status === "active"
                              ? "fr-icon-pause-circle-line"
                              : "fr-icon-play-circle-line"
                          }
                          onClick={() =>
                            handleToggleStatus(automation.id, automation.status)
                          }
                          disabled={isTogglingStatus === automation.id}
                          title={
                            automation.status === "active"
                              ? "Désactiver l'automation"
                              : "Activer l'automation"
                          }
                        >
                          {isTogglingStatus === automation.id
                            ? "..."
                            : automation.status === "active"
                            ? "Désactiver"
                            : "Activer"}
                        </Button>
                        <Button
                          priority="tertiary no outline"
                          size="small"
                          iconId="fr-icon-delete-line"
                          onClick={() => handleDeleteClick(automation.id)}
                          title="Supprimer l'automation"
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>

                    {automation.description && (
                      <p className={classes.automationDescription}>
                        {automation.description}
                      </p>
                    )}

                    <div className={classes.automationDetails}>
                      <div className={classes.automationFlow}>
                        <div className={classes.flowItem}>
                          <div className={classes.flowLabel}>Source</div>
                          <div className={classes.flowValue}>
                            <strong>{automation.sourceDocumentName}</strong>
                            <span className={classes.tableName}>
                              → {automation.sourceTableName}
                            </span>
                          </div>
                        </div>
                        <div className={classes.flowArrow}>
                          <i className={fr.cx("ri-arrow-right-line")} />
                        </div>
                        <div className={classes.flowItem}>
                          <div className={classes.flowLabel}>Destination</div>
                          <div className={classes.flowValue}>
                            <strong>{automation.targetDocumentName}</strong>
                            <span className={classes.tableName}>
                              → {automation.targetTableName}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={classes.automationMeta}>
                        <div className={classes.metaItem}>
                          <span className={classes.metaLabel}>Colonnes :</span>
                          <span className={classes.metaValue}>
                            {automation.selectedColumns.length} sélectionnée(s)
                          </span>
                        </div>
                        <div className={classes.metaItem}>
                          <span className={classes.metaLabel}>Créée le :</span>
                          <span className={classes.metaValue}>
                            {formatDate(automation.createdAt)}
                          </span>
                        </div>
                        {automation.lastExecuted && (
                          <div className={classes.metaItem}>
                            <span className={classes.metaLabel}>
                              Dernière exécution :
                            </span>
                            <span className={classes.metaValue}>
                              {formatDate(automation.lastExecuted)}
                              {automation.lastExecutionStatus && (
                                <Badge
                                  severity={
                                    automation.lastExecutionStatus === "success"
                                      ? "success"
                                      : "error"
                                  }
                                  small
                                  className={classes.executionBadge}
                                >
                                  {automation.lastExecutionStatus}
                                </Badge>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
      />

      {/* Delete confirmation dialog */}
      {showDeleteConfirm && (
        <div className={classes.modalOverlay}>
          <div className={classes.modalContent}>
            <div className={classes.modalHeader}>
              <h3>Confirmer la suppression</h3>
              <Button
                priority="tertiary no outline"
                size="small"
                iconId="fr-icon-close-line"
                onClick={handleDeleteCancel}
                title="Fermer"
              />
            </div>
            <div className={classes.modalBody}>
              <p>
                Êtes-vous sûr de vouloir supprimer l&apos;automation{" "}
                <strong>&quot;{getAutomationToDeleteName()}&quot;</strong> ?
              </p>
              <p>Cette action est irréversible.</p>
            </div>
            <div className={classes.modalFooter}>
              <Button
                priority="secondary"
                size="small"
                onClick={handleDeleteCancel}
                disabled={isDeleting}
              >
                Annuler
              </Button>
              <Button
                priority="primary"
                size="small"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
              >
                {isDeleting ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const useStyles = tss.withName("AutomationList").create(() => ({
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

  alert: {
    marginBottom: fr.spacing("3w"),
  },

  headerActions: {
    display: "flex",
    justifyContent: "flex-end",
    marginBottom: fr.spacing("4w"),
  },

  emptyState: {
    textAlign: "center",
    padding: fr.spacing("6w"),
    color: fr.colors.decisions.text.mention.grey.default,

    "& h3": {
      margin: `${fr.spacing("3w")} 0 ${fr.spacing("2w")} 0`,
      color: fr.colors.decisions.text.title.grey.default,
    },

    "& p": {
      margin: `0 0 ${fr.spacing("4w")} 0`,
      maxWidth: "400px",
      marginLeft: "auto",
      marginRight: "auto",
    },
  },

  emptyIcon: {
    fontSize: "4rem",
    color: fr.colors.decisions.background.actionHigh.blueFrance.default,
    marginBottom: fr.spacing("2w"),

    "& i::before": {
      "--icon-size": "4rem",
    },
  },

  automationsList: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("3w"),
  },

  automationCard: {
    padding: fr.spacing("4w"),
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    borderRadius: fr.spacing("1w"),
  },

  automationHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: fr.spacing("3w"),
    gap: fr.spacing("3w"),

    [`@media (max-width: 48em)`]: {
      flexDirection: "column",
      alignItems: "stretch",
      gap: fr.spacing("2w"),
    },
  },

  automationTitle: {
    display: "flex",
    alignItems: "center",
    gap: fr.spacing("2w"),
    flex: 1,

    "& h4": {
      margin: 0,
      color: fr.colors.decisions.text.title.grey.default,
      fontSize: "1.125rem",
      fontWeight: 600,
    },
  },

  automationActions: {
    display: "flex",
    gap: fr.spacing("1w"),
    flexShrink: 0,

    [`@media (max-width: 48em)`]: {
      justifyContent: "flex-end",
    },
  },

  automationDescription: {
    margin: `0 0 ${fr.spacing("3w")} 0`,
    color: fr.colors.decisions.text.default.grey.default,
    fontStyle: "italic",
  },

  automationDetails: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("3w"),
  },

  automationFlow: {
    display: "flex",
    alignItems: "center",
    gap: fr.spacing("3w"),
    padding: fr.spacing("3w"),
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
    borderRadius: fr.spacing("1w"),

    [`@media (max-width: 48em)`]: {
      flexDirection: "column",
      gap: fr.spacing("2w"),
    },
  },

  flowItem: {
    flex: 1,
    minWidth: 0,
  },

  flowLabel: {
    fontSize: "0.875rem",
    color: fr.colors.decisions.text.mention.grey.default,
    marginBottom: fr.spacing("1w"),
    fontWeight: 500,
  },

  flowValue: {
    display: "flex",
    flexDirection: "column",
    gap: fr.spacing("1w"),

    "& strong": {
      color: fr.colors.decisions.text.title.grey.default,
      fontSize: "1rem",
    },
  },

  tableName: {
    fontSize: "0.875rem",
    color: fr.colors.decisions.text.default.grey.default,
  },

  flowArrow: {
    fontSize: "1.5rem",
    color: fr.colors.decisions.background.actionHigh.blueFrance.default,
    flexShrink: 0,

    "& i::before": {
      "--icon-size": "1.5rem",
    },

    [`@media (max-width: 48em)`]: {
      transform: "rotate(90deg)",
    },
  },

  automationMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: fr.spacing("3w"),
    fontSize: "0.875rem",

    [`@media (max-width: 48em)`]: {
      flexDirection: "column",
      gap: fr.spacing("1w"),
    },
  },

  metaItem: {
    display: "flex",
    alignItems: "center",
    gap: fr.spacing("1w"),
  },

  metaLabel: {
    color: fr.colors.decisions.text.mention.grey.default,
    fontWeight: 500,
  },

  metaValue: {
    color: fr.colors.decisions.text.default.grey.default,
    display: "flex",
    alignItems: "center",
    gap: fr.spacing("1w"),
  },

  executionBadge: {
    fontSize: "0.75rem",
  },

  // Modal styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },

  modalContent: {
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    borderRadius: fr.spacing("1w"),
    maxWidth: "500px",
    width: "90%",
    maxHeight: "90vh",
    overflow: "auto",
    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
  },

  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: fr.spacing("4w"),
    borderBottom: `1px solid ${fr.colors.decisions.border.default.grey.default}`,

    "& h3": {
      margin: 0,
      color: fr.colors.decisions.text.title.grey.default,
    },
  },

  modalBody: {
    padding: fr.spacing("4w"),

    "& p": {
      margin: `0 0 ${fr.spacing("2w")} 0`,
      color: fr.colors.decisions.text.default.grey.default,

      "&:last-child": {
        margin: 0,
      },
    },
  },

  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: fr.spacing("2w"),
    padding: fr.spacing("4w"),
    borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
  },
}));

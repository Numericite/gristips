import React, { useState, useEffect } from "react";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Card } from "@codegouvfr/react-dsfr/Card";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Select } from "@codegouvfr/react-dsfr/Select";
import { Alert } from "@codegouvfr/react-dsfr/Alert";
import { Badge } from "@codegouvfr/react-dsfr/Badge";
import { Checkbox } from "@codegouvfr/react-dsfr/Checkbox";
import { fr } from "@codegouvfr/react-dsfr";
import { tss } from "tss-react/dsfr";
import { GristDocument, GristTable, GristColumn } from "../../lib/grist/types";
import { checkColumnTypeCompatibility } from "../../lib/validation/automation";

interface AutomationFormData {
  name: string;
  description?: string;
  sourceDocumentId: string;
  sourceTableId: string;
  targetDocumentId: string;
  targetTableId: string;
  selectedColumns: string[];
}

interface AutomationCreationFormProps {
  onSubmit: (data: AutomationFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface FormStep {
  id: number;
  title: string;
  description: string;
}

const FORM_STEPS: FormStep[] = [
  {
    id: 1,
    title: "Informations générales",
    description: "Nom et description de l'automation",
  },
  {
    id: 2,
    title: "Document source",
    description: "Sélectionnez le document et la table source",
  },
  {
    id: 3,
    title: "Document cible",
    description: "Sélectionnez le document et la table cible",
  },
  {
    id: 4,
    title: "Colonnes à copier",
    description: "Choisissez les colonnes à synchroniser",
  },
];

export function AutomationCreationForm({
  onSubmit,
  onCancel,
  isSubmitting = false,
}: AutomationCreationFormProps) {
  const { classes } = useStyles();

  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AutomationFormData>({
    name: "",
    description: "",
    sourceDocumentId: "",
    sourceTableId: "",
    targetDocumentId: "",
    targetTableId: "",
    selectedColumns: [],
  });

  // Data loading state
  const [documents, setDocuments] = useState<GristDocument[]>([]);
  const [sourceTables, setSourceTables] = useState<GristTable[]>([]);
  const [targetTables, setTargetTables] = useState<GristTable[]>([]);
  const [sourceColumns, setSourceColumns] = useState<GristColumn[]>([]);
  const [targetColumns, setTargetColumns] = useState<GristColumn[]>([]);
  const [columnCompatibilityWarnings, setColumnCompatibilityWarnings] =
    useState<string[]>([]);

  // Loading states
  const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
  const [isLoadingSourceTables, setIsLoadingSourceTables] = useState(false);
  const [isLoadingTargetTables, setIsLoadingTargetTables] = useState(false);

  // Error state
  const [error, setError] = useState<string | null>(null);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, []);

  // Load source tables when source document changes
  useEffect(() => {
    if (formData.sourceDocumentId) {
      loadSourceTables(formData.sourceDocumentId);
      // Reset source table selection when document changes
      setFormData((prev) => ({
        ...prev,
        sourceTableId: "",
        selectedColumns: [],
      }));
    }
  }, [formData.sourceDocumentId]);

  // Load target tables when target document changes
  useEffect(() => {
    if (formData.targetDocumentId) {
      loadTargetTables(formData.targetDocumentId);
      // Reset target table selection when document changes
      setFormData((prev) => ({
        ...prev,
        targetTableId: "",
      }));
    }
  }, [formData.targetDocumentId]);

  // Load source columns when source table changes
  useEffect(() => {
    if (formData.sourceTableId) {
      const sourceTable = sourceTables.find(
        (table) => table.id === formData.sourceTableId
      );
      if (sourceTable) {
        setSourceColumns(sourceTable.columns);
        // Select all columns by default
        setFormData((prev) => ({
          ...prev,
          selectedColumns: sourceTable.columns.map((col) => col.id),
        }));
      }
    }
  }, [formData.sourceTableId, sourceTables]);

  // Load target columns when target table changes
  useEffect(() => {
    if (formData.targetTableId) {
      const targetTable = targetTables.find(
        (table) => table.id === formData.targetTableId
      );
      if (targetTable) {
        setTargetColumns(targetTable.columns);
      }
    }
  }, [formData.targetTableId, targetTables]);

  // Check column compatibility when both source and target are selected
  useEffect(() => {
    if (sourceColumns.length > 0 && targetColumns.length > 0) {
      const warnings: string[] = [];

      sourceColumns.forEach((sourceCol) => {
        const targetCol = targetColumns.find(
          (tc) => tc.colId === sourceCol.colId
        );
        if (targetCol) {
          const compatibility = checkColumnTypeCompatibility(
            sourceCol.type,
            targetCol.type
          );
          if (compatibility.warning) {
            warnings.push(
              `${sourceCol.label || sourceCol.colId}: ${compatibility.warning}`
            );
          }
        } else {
          warnings.push(
            `${
              sourceCol.label || sourceCol.colId
            }: Colonne non trouvée dans la table cible`
          );
        }
      });

      setColumnCompatibilityWarnings(warnings);
    } else {
      setColumnCompatibilityWarnings([]);
    }
  }, [sourceColumns, targetColumns]);

  const loadDocuments = async () => {
    setIsLoadingDocuments(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/grist/documents");
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des documents");
      }

      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (err) {
      console.error("Error loading documents:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des documents"
      );
    } finally {
      setIsLoadingDocuments(false);
    }
  };

  const loadSourceTables = async (documentId: string) => {
    setIsLoadingSourceTables(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/grist/tables?documentId=${encodeURIComponent(documentId)}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des tables source");
      }

      const data = await response.json();
      setSourceTables(data.tables || []);
    } catch (err) {
      console.error("Error loading source tables:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des tables source"
      );
    } finally {
      setIsLoadingSourceTables(false);
    }
  };

  const loadTargetTables = async (documentId: string) => {
    setIsLoadingTargetTables(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/grist/tables?documentId=${encodeURIComponent(documentId)}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des tables cible");
      }

      const data = await response.json();
      setTargetTables(data.tables || []);
    } catch (err) {
      console.error("Error loading target tables:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors du chargement des tables cible"
      );
    } finally {
      setIsLoadingTargetTables(false);
    }
  };

  const updateFormData = (updates: Partial<AutomationFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const validateCurrentStep = (): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    switch (currentStep) {
      case 1:
        if (!formData.name.trim()) {
          errors.push("Le nom de l'automation est requis");
        } else if (formData.name.trim().length < 3) {
          errors.push("Le nom doit contenir au moins 3 caractères");
        } else if (formData.name.length > 255) {
          errors.push("Le nom ne peut pas dépasser 255 caractères");
        }

        if (formData.description && formData.description.length > 1000) {
          errors.push("La description ne peut pas dépasser 1000 caractères");
        }
        break;

      case 2:
        if (!formData.sourceDocumentId) {
          errors.push("Le document source est requis");
        }
        if (!formData.sourceTableId) {
          errors.push("La table source est requise");
        }
        break;

      case 3:
        if (!formData.targetDocumentId) {
          errors.push("Le document cible est requis");
        }
        if (!formData.targetTableId) {
          errors.push("La table cible est requise");
        }
        if (
          formData.sourceDocumentId === formData.targetDocumentId &&
          formData.sourceTableId === formData.targetTableId
        ) {
          errors.push(
            "La table source et la table cible ne peuvent pas être identiques"
          );
        }
        break;

      case 4:
        if (formData.selectedColumns.length === 0) {
          errors.push("Au moins une colonne doit être sélectionnée");
        }
        break;

      default:
        errors.push("Étape invalide");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const handleNext = () => {
    const validation = validateCurrentStep();
    if (validation.isValid && currentStep < FORM_STEPS.length) {
      setCurrentStep(currentStep + 1);
      setError(null);
    } else if (!validation.isValid) {
      setError(validation.errors.join(". "));
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handleSubmit = async () => {
    const validation = validateCurrentStep();
    if (!validation.isValid) {
      setError(validation.errors.join(". "));
      return;
    }

    try {
      // Get document and table names for submission
      const sourceDocument = documents.find(
        (doc) => doc.id === formData.sourceDocumentId
      );
      const targetDocument = documents.find(
        (doc) => doc.id === formData.targetDocumentId
      );
      const sourceTable = sourceTables.find(
        (table) => table.id === formData.sourceTableId
      );
      const targetTable = targetTables.find(
        (table) => table.id === formData.targetTableId
      );

      if (!sourceDocument || !targetDocument || !sourceTable || !targetTable) {
        throw new Error("Données manquantes pour la création de l'automation");
      }

      const submissionData = {
        name: formData.name.trim(),
        type: "table_copy" as const,
        sourceDocumentId: formData.sourceDocumentId,
        sourceDocumentName: sourceDocument.name,
        sourceTableId: formData.sourceTableId,
        sourceTableName: sourceTable.tableId,
        targetDocumentId: formData.targetDocumentId,
        targetDocumentName: targetDocument.name,
        targetTableId: formData.targetTableId,
        targetTableName: targetTable.tableId,
        selectedColumns: formData.selectedColumns,
        description: formData.description?.trim() || undefined,
      };

      await onSubmit(submissionData);
    } catch (err) {
      console.error("Error submitting form:", err);

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
        } else if (err.message.includes("validation")) {
          setError(`Erreur de validation: ${err.message}`);
        } else {
          setError(err.message);
        }
      } else {
        setError("Erreur lors de la création de l'automation");
      }
    }
  };

  const handleColumnToggle = (columnId: string, checked: boolean) => {
    if (checked) {
      updateFormData({
        selectedColumns: [...formData.selectedColumns, columnId],
      });
    } else {
      updateFormData({
        selectedColumns: formData.selectedColumns.filter(
          (id) => id !== columnId
        ),
      });
    }
  };

  const handleSelectAllColumns = () => {
    updateFormData({
      selectedColumns: sourceColumns.map((col) => col.id),
    });
  };

  const handleDeselectAllColumns = () => {
    updateFormData({
      selectedColumns: [],
    });
  };

  const renderStepIndicator = () => (
    <div className={classes.stepIndicator}>
      {FORM_STEPS.map((step, index) => (
        <div
          key={step.id}
          className={`${classes.stepItem} ${
            step.id === currentStep ? classes.stepActive : ""
          } ${step.id < currentStep ? classes.stepCompleted : ""}`}
        >
          <div className={classes.stepNumber}>
            {step.id < currentStep ? (
              <i className="fr-icon-check-line" />
            ) : (
              step.id
            )}
          </div>
          <div className={classes.stepContent}>
            <div className={classes.stepTitle}>{step.title}</div>
            <div className={classes.stepDescription}>{step.description}</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className={classes.stepContent}>
      <Input
        label="Nom de l'automation"
        hintText="Donnez un nom descriptif à votre automation"
        nativeInputProps={{
          value: formData.name,
          onChange: (e) => updateFormData({ name: e.target.value }),
          placeholder: "Ex: Synchronisation données clients",
          maxLength: 255,
        }}
        state={formData.name.trim().length === 0 ? "error" : "default"}
        stateRelatedMessage={
          formData.name.trim().length === 0 ? "Le nom est requis" : undefined
        }
      />

      <Input
        label="Description (optionnel)"
        hintText="Décrivez brièvement le but de cette automation"
        textArea
        nativeTextAreaProps={{
          value: formData.description || "",
          onChange: (e) => updateFormData({ description: e.target.value }),
          placeholder:
            "Ex: Copie automatique des nouvelles données clients vers le document de reporting",
          maxLength: 1000,
          rows: 3,
        }}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className={classes.stepContent}>
      <Select
        label="Document source"
        hint="Sélectionnez le document contenant les données à copier"
        nativeSelectProps={{
          value: formData.sourceDocumentId,
          onChange: (e) => updateFormData({ sourceDocumentId: e.target.value }),
        }}
        state={formData.sourceDocumentId === "" ? "error" : "default"}
        stateRelatedMessage={
          formData.sourceDocumentId === ""
            ? "Veuillez sélectionner un document source"
            : undefined
        }
      >
        <option value="">Choisir un document...</option>
        {isLoadingDocuments ? (
          <option disabled>Chargement des documents...</option>
        ) : (
          documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))
        )}
      </Select>

      {formData.sourceDocumentId && (
        <Select
          label="Table source"
          hint="Sélectionnez la table contenant les données à copier"
          nativeSelectProps={{
            value: formData.sourceTableId,
            onChange: (e) => updateFormData({ sourceTableId: e.target.value }),
          }}
          state={formData.sourceTableId === "" ? "error" : "default"}
          stateRelatedMessage={
            formData.sourceTableId === ""
              ? "Veuillez sélectionner une table source"
              : undefined
          }
        >
          <option value="">Choisir une table...</option>
          {isLoadingSourceTables ? (
            <option disabled>Chargement des tables...</option>
          ) : (
            sourceTables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.tableId}
              </option>
            ))
          )}
        </Select>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className={classes.stepContent}>
      <Select
        label="Document cible"
        hint="Sélectionnez le document où copier les données"
        nativeSelectProps={{
          value: formData.targetDocumentId,
          onChange: (e) => updateFormData({ targetDocumentId: e.target.value }),
        }}
        state={formData.targetDocumentId === "" ? "error" : "default"}
        stateRelatedMessage={
          formData.targetDocumentId === ""
            ? "Veuillez sélectionner un document cible"
            : undefined
        }
      >
        <option value="">Choisir un document...</option>
        {isLoadingDocuments ? (
          <option disabled>Chargement des documents...</option>
        ) : (
          documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name}
            </option>
          ))
        )}
      </Select>

      {formData.targetDocumentId && (
        <Select
          label="Table cible"
          hint="Sélectionnez la table où copier les données"
          nativeSelectProps={{
            value: formData.targetTableId,
            onChange: (e) => updateFormData({ targetTableId: e.target.value }),
          }}
          state={formData.targetTableId === "" ? "error" : "default"}
          stateRelatedMessage={
            formData.targetTableId === ""
              ? "Veuillez sélectionner une table cible"
              : undefined
          }
        >
          <option value="">Choisir une table...</option>
          {isLoadingTargetTables ? (
            <option disabled>Chargement des tables...</option>
          ) : (
            targetTables.map((table) => (
              <option key={table.id} value={table.id}>
                {table.tableId}
              </option>
            ))
          )}
        </Select>
      )}
    </div>
  );

  const renderStep4 = () => (
    <div className={classes.stepContent}>
      <div className={classes.columnSelectionHeader}>
        <h4>Colonnes à copier</h4>
        <p>
          Sélectionnez les colonnes de la table source que vous souhaitez copier
          vers la table cible.
        </p>
        <div className={classes.columnActions}>
          <Button
            priority="tertiary no outline"
            size="small"
            onClick={handleSelectAllColumns}
          >
            Tout sélectionner
          </Button>
          <Button
            priority="tertiary no outline"
            size="small"
            onClick={handleDeselectAllColumns}
          >
            Tout désélectionner
          </Button>
        </div>
      </div>

      {sourceColumns.length > 0 ? (
        <div className={classes.columnList}>
          {sourceColumns.map((column) => (
            <div key={column.id} className={classes.columnItem}>
              <Checkbox
                options={[
                  {
                    label: (
                      <div className={classes.columnLabel}>
                        <span className={classes.columnName}>
                          {column.label || column.colId}
                        </span>
                        <div className={classes.columnMeta}>
                          <Badge severity="info" small>
                            {column.type}
                          </Badge>
                          {column.isFormula && (
                            <Badge severity="warning" small>
                              Formule
                            </Badge>
                          )}
                        </div>
                      </div>
                    ),
                    nativeInputProps: {
                      checked: formData.selectedColumns.includes(column.id),
                      onChange: (e) =>
                        handleColumnToggle(column.id, e.target.checked),
                    },
                  },
                ]}
              />
            </div>
          ))}
        </div>
      ) : (
        <Alert
          severity="info"
          title="Aucune colonne disponible"
          description="Sélectionnez d'abord un document et une table source pour voir les colonnes disponibles."
        />
      )}

      {formData.selectedColumns.length === 0 && sourceColumns.length > 0 && (
        <Alert
          severity="error"
          title="Sélection requise"
          description="Vous devez sélectionner au moins une colonne à copier."
        />
      )}

      {columnCompatibilityWarnings.length > 0 && (
        <Alert
          severity="warning"
          title="Avertissements de compatibilité"
          description={
            <div>
              <p>Des problèmes de compatibilité ont été détectés :</p>
              <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem" }}>
                {columnCompatibilityWarnings.map((warning, index) => (
                  <li key={index} style={{ marginBottom: "0.25rem" }}>
                    {warning}
                  </li>
                ))}
              </ul>
            </div>
          }
        />
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <Card
      background
      border
      title="Créer une nouvelle automation"
      desc="Configurez une automation de copie de table entre vos documents Grist"
      start={
        <div className={classes.cardIcon}>
          <i className="fr-icon-settings-5-line" />
        </div>
      }
      footer={
        <div className={classes.cardContent}>
          {renderStepIndicator()}

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

          {renderCurrentStep()}

          <div className={classes.formActions}>
            <div className={classes.leftActions}>
              <Button
                priority="tertiary"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
            </div>

            <div className={classes.rightActions}>
              {currentStep > 1 && (
                <Button
                  priority="secondary"
                  iconId="fr-icon-arrow-left-line"
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  Précédent
                </Button>
              )}

              {currentStep < FORM_STEPS.length ? (
                <Button
                  priority="primary"
                  iconId="fr-icon-arrow-right-line"
                  iconPosition="right"
                  onClick={handleNext}
                  disabled={!validateCurrentStep().isValid || isSubmitting}
                >
                  Suivant
                </Button>
              ) : (
                <Button
                  priority="primary"
                  iconId="fr-icon-save-line"
                  onClick={handleSubmit}
                  disabled={!validateCurrentStep().isValid || isSubmitting}
                >
                  {isSubmitting ? "Création en cours..." : "Créer l'automation"}
                </Button>
              )}
            </div>
          </div>
        </div>
      }
    />
  );
}

const useStyles = tss.withName("AutomationCreationForm").create(() => ({
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

  stepIndicator: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: fr.spacing("6w"),
    padding: fr.spacing("3w"),
    backgroundColor: fr.colors.decisions.background.alt.grey.default,
    borderRadius: fr.spacing("1w"),

    [`@media (max-width: ${fr.breakpoints.md})`]: {
      flexDirection: "column",
      gap: fr.spacing("3w"),
    },
  },

  stepItem: {
    display: "flex",
    alignItems: "center",
    gap: fr.spacing("2w"),
    flex: 1,
    opacity: 0.6,

    [`@media (max-width: ${fr.breakpoints.md})`]: {
      flex: "none",
    },
  },

  stepActive: {
    opacity: 1,
  },

  stepCompleted: {
    opacity: 1,
  },

  stepNumber: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2rem",
    height: "2rem",
    borderRadius: "50%",
    backgroundColor: fr.colors.decisions.background.default.grey.default,
    color: fr.colors.decisions.text.default.grey.default,
    fontSize: "0.875rem",
    fontWeight: "bold",
    flexShrink: 0,

    "& i": {
      fontSize: "1rem",
      color: fr.colors.decisions.background.actionHigh.success.default,

      "&::before": {
        "--icon-size": "1rem",
      },
    },

    ".stepActive &": {
      backgroundColor:
        fr.colors.decisions.background.actionHigh.blueFrance.default,
      color: fr.colors.decisions.text.inverted.grey.default,
    },

    ".stepCompleted &": {
      backgroundColor:
        fr.colors.decisions.background.actionHigh.success.default,
      color: fr.colors.decisions.text.inverted.grey.default,
    },
  },

  stepContent: {
    [`@media (max-width: ${fr.breakpoints.md})`]: {
      display: "none",

      ".stepActive &": {
        display: "block",
      },
    },
  },

  stepTitle: {
    fontSize: "0.875rem",
    fontWeight: "bold",
    color: fr.colors.decisions.text.title.grey.default,
    marginBottom: fr.spacing("1w"),
  },

  stepDescription: {
    fontSize: "0.75rem",
    color: fr.colors.decisions.text.mention.grey.default,
  },

  alert: {
    marginBottom: fr.spacing("4w"),
  },

  columnSelectionHeader: {
    marginBottom: fr.spacing("4w"),

    "& h4": {
      margin: `0 0 ${fr.spacing("1w")} 0`,
      color: fr.colors.decisions.text.title.grey.default,
    },

    "& p": {
      margin: `0 0 ${fr.spacing("3w")} 0`,
      color: fr.colors.decisions.text.default.grey.default,
    },
  },

  columnActions: {
    display: "flex",
    gap: fr.spacing("2w"),
  },

  columnList: {
    display: "grid",
    gap: fr.spacing("2w"),
    marginBottom: fr.spacing("4w"),
  },

  columnItem: {
    padding: fr.spacing("2w"),
    border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
    borderRadius: fr.spacing("1w"),
    backgroundColor: fr.colors.decisions.background.default.grey.default,
  },

  columnLabel: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
  },

  columnName: {
    fontWeight: "500",
    color: fr.colors.decisions.text.title.grey.default,
  },

  columnMeta: {
    display: "flex",
    gap: fr.spacing("1w"),
    alignItems: "center",
  },

  formActions: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: fr.spacing("6w"),
    paddingTop: fr.spacing("4w"),
    borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
  },

  leftActions: {
    display: "flex",
    gap: fr.spacing("2w"),
  },

  rightActions: {
    display: "flex",
    gap: fr.spacing("2w"),
  },
}));

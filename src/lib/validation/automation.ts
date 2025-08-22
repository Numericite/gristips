/**
 * Validation utilities for automation management
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface AutomationFormData {
  name: string;
  description?: string;
  sourceDocumentId: string;
  sourceTableId: string;
  targetDocumentId: string;
  targetTableId: string;
  selectedColumns: string[];
}

export interface ColumnTypeCompatibility {
  sourceType: string;
  targetType: string;
  isCompatible: boolean;
  warning?: string;
}

/**
 * Validate automation form data
 */
export function validateAutomationForm(
  data: AutomationFormData
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate name
  if (
    !data.name ||
    typeof data.name !== "string" ||
    data.name.trim().length === 0
  ) {
    errors.push("Le nom de l'automation ne peut pas être vide");
  } else {
    const trimmedName = data.name.trim();
    if (trimmedName.length === 0) {
      errors.push("Le nom de l'automation ne peut pas être vide");
    } else if (trimmedName.length > 255) {
      errors.push("Le nom de l'automation ne peut pas dépasser 255 caractères");
    } else if (trimmedName.length < 3) {
      warnings.push(
        "Le nom de l'automation est très court (moins de 3 caractères)"
      );
    }
  }

  // Validate description
  if (data.description && typeof data.description === "string") {
    if (data.description.length > 1000) {
      errors.push("La description ne peut pas dépasser 1000 caractères");
    }
  }

  // Validate source document
  if (!data.sourceDocumentId || typeof data.sourceDocumentId !== "string") {
    errors.push("Le document source est requis");
  } else if (data.sourceDocumentId.trim().length === 0) {
    errors.push("Le document source ne peut pas être vide");
  }

  // Validate source table
  if (!data.sourceTableId || typeof data.sourceTableId !== "string") {
    errors.push("La table source est requise");
  } else if (data.sourceTableId.trim().length === 0) {
    errors.push("La table source ne peut pas être vide");
  }

  // Validate target document
  if (!data.targetDocumentId || typeof data.targetDocumentId !== "string") {
    errors.push("Le document cible est requis");
  } else if (data.targetDocumentId.trim().length === 0) {
    errors.push("Le document cible ne peut pas être vide");
  }

  // Validate target table
  if (!data.targetTableId || typeof data.targetTableId !== "string") {
    errors.push("La table cible est requise");
  } else if (data.targetTableId.trim().length === 0) {
    errors.push("La table cible ne peut pas être vide");
  }

  // Validate selected columns
  if (!data.selectedColumns || !Array.isArray(data.selectedColumns)) {
    errors.push("Les colonnes sélectionnées sont requises");
  } else if (data.selectedColumns.length === 0) {
    errors.push("Au moins une colonne doit être sélectionnée");
  } else {
    // Check for duplicate columns
    const uniqueColumns = new Set(data.selectedColumns);
    if (uniqueColumns.size !== data.selectedColumns.length) {
      warnings.push("Des colonnes en double ont été détectées");
    }

    // Check for empty column IDs
    const emptyColumns = data.selectedColumns.filter(
      (col) => !col || col.trim().length === 0
    );
    if (emptyColumns.length > 0) {
      errors.push("Certaines colonnes sélectionnées sont invalides");
    }
  }

  // Cross-validation warnings
  if (
    data.sourceDocumentId === data.targetDocumentId &&
    data.sourceTableId === data.targetTableId
  ) {
    warnings.push(
      "La table source et la table cible sont identiques. Cela peut créer des conflits."
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate API key format and basic requirements
 */
export function validateApiKey(apiKey: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!apiKey || typeof apiKey !== "string") {
    errors.push("La clé API est requise");
    return { isValid: false, errors, warnings };
  }

  const trimmedKey = apiKey.trim();

  if (trimmedKey.length === 0) {
    errors.push("La clé API ne peut pas être vide");
  } else if (trimmedKey.length < 10) {
    errors.push("La clé API semble trop courte (moins de 10 caractères)");
  } else if (trimmedKey.length > 500) {
    errors.push("La clé API semble trop longue (plus de 500 caractères)");
  }

  // Check for common patterns that might indicate invalid keys
  if (trimmedKey.includes(" ")) {
    warnings.push("La clé API contient des espaces, ce qui est inhabituel");
  }

  // Grist API keys are typically 32-character hexadecimal strings
  if (/^[a-f0-9]{32}$/i.test(trimmedKey)) {
    // Valid Grist API key format (32 hex characters)
    return { isValid: true, errors, warnings };
  }

  // Allow other formats but with warnings for flexibility
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmedKey)) {
    warnings.push("La clé API contient des caractères inhabituels");
  }

  // Warn if it doesn't match the expected Grist format
  if (trimmedKey.length !== 32 || !/^[a-f0-9]+$/i.test(trimmedKey)) {
    warnings.push(
      "La clé API ne correspond pas au format Grist habituel (32 caractères hexadécimaux)"
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check column type compatibility between source and target
 */
export function checkColumnTypeCompatibility(
  sourceType: string,
  targetType: string
): ColumnTypeCompatibility {
  const compatibility: ColumnTypeCompatibility = {
    sourceType,
    targetType,
    isCompatible: true,
  };

  // Exact match is always compatible
  if (sourceType === targetType) {
    return compatibility;
  }

  // Define compatibility rules
  const compatibilityRules: Record<string, string[]> = {
    Text: ["Text", "Choice"], // Text can go to Choice
    Numeric: ["Numeric", "Int", "Text"], // Numeric can go to Int or Text
    Int: ["Int", "Numeric", "Text"], // Int can go to Numeric or Text
    Bool: ["Bool", "Text"], // Bool can go to Text
    Date: ["Date", "DateTime", "Text"], // Date can go to DateTime or Text
    DateTime: ["DateTime", "Date", "Text"], // DateTime can go to Date or Text (with potential data loss)
    Choice: ["Choice", "Text"], // Choice can go to Text
    Ref: ["Ref", "Text"], // Ref can go to Text (will show ID)
  };

  const compatibleTypes = compatibilityRules[sourceType] || [];

  if (!compatibleTypes.includes(targetType)) {
    compatibility.isCompatible = false;
    compatibility.warning = `Type incompatible: ${sourceType} → ${targetType}. Les données pourraient être perdues ou corrompues.`;
  } else if (sourceType !== targetType) {
    // Compatible but different - add warning
    if (sourceType === "DateTime" && targetType === "Date") {
      compatibility.warning =
        "Conversion DateTime → Date : les informations d'heure seront perdues";
    } else if (sourceType === "Numeric" && targetType === "Int") {
      compatibility.warning =
        "Conversion Numeric → Int : les décimales seront tronquées";
    } else if (sourceType === "Ref" && targetType === "Text") {
      compatibility.warning =
        "Conversion Ref → Text : seuls les IDs seront copiés, pas les valeurs référencées";
    } else {
      compatibility.warning = `Conversion de type ${sourceType} → ${targetType} : vérifiez que les données sont compatibles`;
    }
  }

  return compatibility;
}

/**
 * Validate automation update data
 */
export function validateAutomationUpdate(
  data: Partial<AutomationFormData>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Only validate fields that are present
  if (data.name !== undefined) {
    if (typeof data.name !== "string") {
      errors.push("Le nom doit être une chaîne de caractères");
    } else {
      const trimmedName = data.name.trim();
      if (trimmedName.length === 0) {
        errors.push("Le nom ne peut pas être vide");
      } else if (trimmedName.length > 255) {
        errors.push("Le nom ne peut pas dépasser 255 caractères");
      }
    }
  }

  if (data.description !== undefined) {
    if (data.description !== null && typeof data.description !== "string") {
      errors.push("La description doit être une chaîne de caractères ou null");
    } else if (data.description && data.description.length > 1000) {
      errors.push("La description ne peut pas dépasser 1000 caractères");
    }
  }

  if (data.selectedColumns !== undefined) {
    if (!Array.isArray(data.selectedColumns)) {
      errors.push("Les colonnes sélectionnées doivent être un tableau");
    } else if (data.selectedColumns.length === 0) {
      errors.push("Au moins une colonne doit être sélectionnée");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validate document and table IDs format
 */
export function validateGristIds(
  documentId?: string,
  tableId?: string
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (documentId !== undefined) {
    if (!documentId || typeof documentId !== "string") {
      errors.push("L'ID du document est requis");
    } else if (documentId.trim().length === 0) {
      errors.push("L'ID du document ne peut pas être vide");
    } else if (!/^[a-zA-Z0-9_-]+$/.test(documentId)) {
      warnings.push("L'ID du document contient des caractères inhabituels");
    }
  }

  if (tableId !== undefined) {
    if (!tableId || typeof tableId !== "string") {
      errors.push("L'ID de la table est requis");
    } else if (tableId.trim().length === 0) {
      errors.push("L'ID de la table ne peut pas être vide");
    } else if (!/^[a-zA-Z0-9_-]+$/.test(tableId)) {
      warnings.push("L'ID de la table contient des caractères inhabituels");
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

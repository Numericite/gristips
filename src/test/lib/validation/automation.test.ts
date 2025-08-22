import { describe, it, expect } from "vitest";
import {
  validateAutomationForm,
  validateApiKey,
  validateAutomationUpdate,
  validateGristIds,
  checkColumnTypeCompatibility,
  AutomationFormData,
} from "../../../lib/validation/automation";

describe("Automation Validation", () => {
  describe("validateAutomationForm", () => {
    it("should validate a complete automation form", () => {
      const formData: AutomationFormData = {
        name: "Test Automation",
        description: "Test description",
        sourceDocumentId: "doc1",
        sourceTableId: "table1",
        targetDocumentId: "doc2",
        targetTableId: "table2",
        selectedColumns: ["col1", "col2"],
      };

      const result = validateAutomationForm(formData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty name", () => {
      const formData: AutomationFormData = {
        name: "",
        sourceDocumentId: "doc1",
        sourceTableId: "table1",
        targetDocumentId: "doc2",
        targetTableId: "table2",
        selectedColumns: ["col1"],
      };

      const result = validateAutomationForm(formData);
      expect(result.isValid).toBe(false);
      console.log("Actual errors:", result.errors);
      expect(result.errors).toContain(
        "Le nom de l'automation ne peut pas être vide"
      );
    });

    it("should reject name that is too long", () => {
      const formData: AutomationFormData = {
        name: "a".repeat(256),
        sourceDocumentId: "doc1",
        sourceTableId: "table1",
        targetDocumentId: "doc2",
        targetTableId: "table2",
        selectedColumns: ["col1"],
      };

      const result = validateAutomationForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Le nom de l'automation ne peut pas dépasser 255 caractères"
      );
    });

    it("should reject empty selected columns", () => {
      const formData: AutomationFormData = {
        name: "Test",
        sourceDocumentId: "doc1",
        sourceTableId: "table1",
        targetDocumentId: "doc2",
        targetTableId: "table2",
        selectedColumns: [],
      };

      const result = validateAutomationForm(formData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Au moins une colonne doit être sélectionnée"
      );
    });

    it("should warn about short names", () => {
      const formData: AutomationFormData = {
        name: "AB",
        sourceDocumentId: "doc1",
        sourceTableId: "table1",
        targetDocumentId: "doc2",
        targetTableId: "table2",
        selectedColumns: ["col1"],
      };

      const result = validateAutomationForm(formData);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "Le nom de l'automation est très court (moins de 3 caractères)"
      );
    });

    it("should warn about same source and target", () => {
      const formData: AutomationFormData = {
        name: "Test",
        sourceDocumentId: "doc1",
        sourceTableId: "table1",
        targetDocumentId: "doc1",
        targetTableId: "table1",
        selectedColumns: ["col1"],
      };

      const result = validateAutomationForm(formData);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "La table source et la table cible sont identiques. Cela peut créer des conflits."
      );
    });
  });

  describe("validateApiKey", () => {
    it("should validate a proper API key", () => {
      const result = validateApiKey("valid-api-key-123");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty API key", () => {
      const result = validateApiKey("");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("La clé API est requise");
    });

    it("should reject very short API key", () => {
      const result = validateApiKey("short");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "La clé API semble trop courte (moins de 10 caractères)"
      );
    });

    it("should reject very long API key", () => {
      const result = validateApiKey("a".repeat(501));
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "La clé API semble trop longue (plus de 500 caractères)"
      );
    });

    it("should warn about spaces in API key", () => {
      const result = validateApiKey("api key with spaces");
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "La clé API contient des espaces, ce qui est inhabituel"
      );
    });

    it("should warn about unusual characters", () => {
      const result = validateApiKey("api-key-with-@-symbol");
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        "La clé API contient des caractères inhabituels"
      );
    });
  });

  describe("validateGristIds", () => {
    it("should validate proper IDs", () => {
      const result = validateGristIds("doc-123", "table-456");
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty document ID", () => {
      const result = validateGristIds("", "table-456");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("L'ID du document est requis");
    });

    it("should reject empty table ID", () => {
      const result = validateGristIds("doc-123", "");
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("L'ID de la table est requis");
    });
  });

  describe("checkColumnTypeCompatibility", () => {
    it("should mark exact matches as compatible", () => {
      const result = checkColumnTypeCompatibility("Text", "Text");
      expect(result.isCompatible).toBe(true);
      expect(result.warning).toBeUndefined();
    });

    it("should mark compatible types with warning", () => {
      const result = checkColumnTypeCompatibility("DateTime", "Date");
      expect(result.isCompatible).toBe(true);
      expect(result.warning).toContain(
        "les informations d'heure seront perdues"
      );
    });

    it("should mark incompatible types", () => {
      const result = checkColumnTypeCompatibility("Text", "Numeric");
      expect(result.isCompatible).toBe(false);
      expect(result.warning).toContain("Type incompatible");
    });

    it("should handle Numeric to Int conversion", () => {
      const result = checkColumnTypeCompatibility("Numeric", "Int");
      expect(result.isCompatible).toBe(true);
      expect(result.warning).toContain("les décimales seront tronquées");
    });

    it("should handle Ref to Text conversion", () => {
      const result = checkColumnTypeCompatibility("Ref", "Text");
      expect(result.isCompatible).toBe(true);
      expect(result.warning).toContain("seuls les IDs seront copiés");
    });
  });

  describe("validateAutomationUpdate", () => {
    it("should validate partial updates", () => {
      const result = validateAutomationUpdate({ name: "Updated Name" });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject invalid name in update", () => {
      const result = validateAutomationUpdate({ name: "" });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Le nom ne peut pas être vide");
    });

    it("should validate description updates", () => {
      const result = validateAutomationUpdate({
        description: "New description",
      });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should allow null description", () => {
      const result = validateAutomationUpdate({ description: null });
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject empty selectedColumns array", () => {
      const result = validateAutomationUpdate({ selectedColumns: [] });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Au moins une colonne doit être sélectionnée"
      );
    });
  });
});

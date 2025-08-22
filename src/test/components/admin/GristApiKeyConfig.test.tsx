import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { GristApiKeyConfig } from "../../../components/admin/GristApiKeyConfig";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console.error to avoid noise in tests
const mockConsoleError = vi
  .spyOn(console, "error")
  .mockImplementation(() => {});

describe("GristApiKeyConfig", () => {
  beforeEach(() => {
    mockFetch.mockClear();
    mockConsoleError.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Loading", () => {
    it("should show loading state initially", () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<GristApiKeyConfig />);

      expect(screen.getByText("Chargement...")).toBeInTheDocument();
    });

    it("should load API key status on mount", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: false }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/grist-api-key", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });
      });
    });

    it("should handle loading error gracefully", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });
  });

  describe("API Key Status Display", () => {
    it("should show 'Non configurée' badge when no API key exists", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: false }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Non configurée")).toBeInTheDocument();
      });
    });

    it("should show 'Valide' badge when API key is valid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: true }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Valide")).toBeInTheDocument();
      });
    });

    it("should show 'Invalide' badge when API key is invalid", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: false }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Invalide")).toBeInTheDocument();
      });
    });

    it("should show test button when API key exists", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: true }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Tester la clé API")).toBeInTheDocument();
      });
    });

    it("should not show test button when no API key exists", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: false }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.queryByText("Tester la clé API")).not.toBeInTheDocument();
      });
    });
  });

  describe("API Key Form", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: false }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Non configurée")).toBeInTheDocument();
      });
    });

    it("should render API key input form", () => {
      expect(
        screen.getByPlaceholderText("Votre clé API Grist...")
      ).toBeInTheDocument();
      expect(screen.getByText("Sauvegarder la clé API")).toBeInTheDocument();
    });

    it("should toggle password visibility", () => {
      const input = screen.getByPlaceholderText(
        "Votre clé API Grist..."
      ) as HTMLInputElement;
      const toggleButton = screen.getByText("Afficher");

      expect(input.type).toBe("password");

      fireEvent.click(toggleButton);
      expect(input.type).toBe("text");
      expect(screen.getByText("Masquer")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Masquer"));
      expect(input.type).toBe("password");
      expect(screen.getByText("Afficher")).toBeInTheDocument();
    });

    it("should disable submit button when input is empty", () => {
      const submitButton = screen.getByText("Sauvegarder la clé API");
      expect(submitButton).toBeDisabled();
    });

    it("should enable submit button when input has value", () => {
      const input = screen.getByPlaceholderText("Votre clé API Grist...");
      const submitButton = screen.getByText("Sauvegarder la clé API");

      fireEvent.change(input, { target: { value: "test-api-key" } });
      expect(submitButton).not.toBeDisabled();
    });

    it("should prevent submission when input is empty", async () => {
      const input = screen.getByPlaceholderText("Votre clé API Grist...");
      const submitButton = screen.getByText("Sauvegarder la clé API");

      // Button should be disabled when input is empty
      expect(submitButton).toBeDisabled();

      // Add some text to enable the button
      fireEvent.change(input, { target: { value: "test" } });
      expect(submitButton).not.toBeDisabled();

      // Clear it and button should be disabled again
      fireEvent.change(input, { target: { value: "" } });
      expect(submitButton).toBeDisabled();
    });
  });

  describe("API Key Submission", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: false }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Non configurée")).toBeInTheDocument();
      });
    });

    it("should submit API key successfully", async () => {
      const input = screen.getByPlaceholderText("Votre clé API Grist...");
      const submitButton = screen.getByText("Sauvegarder la clé API");

      fireEvent.change(input, { target: { value: "valid-api-key" } });

      // Mock successful submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          isValid: true,
          message: "Clé API sauvegardée avec succès",
        }),
      });

      // Mock status reload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: true }),
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Validation en cours...")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/admin/grist-api-key", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ apiKey: "valid-api-key" }),
        });
      });

      await waitFor(() => {
        expect(
          screen.getByText("Clé API sauvegardée avec succès")
        ).toBeInTheDocument();
      });
    });

    it("should handle API key validation failure", async () => {
      const input = screen.getByPlaceholderText("Votre clé API Grist...");
      const submitButton = screen.getByText("Sauvegarder la clé API");

      fireEvent.change(input, { target: { value: "invalid-api-key" } });

      // Mock validation failure
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          success: false,
          isValid: false,
          message: "Clé API invalide. Veuillez vérifier votre clé API Grist.",
        }),
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getAllByText(
            "Clé API invalide. Veuillez vérifier votre clé API Grist."
          )[0]
        ).toBeInTheDocument();
      });
    });

    it("should handle network errors during submission", async () => {
      const input = screen.getByPlaceholderText("Votre clé API Grist...");
      const submitButton = screen.getByText("Sauvegarder la clé API");

      fireEvent.change(input, { target: { value: "test-api-key" } });

      // Mock network error
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getAllByText("Network error")[0]).toBeInTheDocument();
      });
    });

    it("should clear input after successful submission", async () => {
      const input = screen.getByPlaceholderText(
        "Votre clé API Grist..."
      ) as HTMLInputElement;
      const submitButton = screen.getByText("Sauvegarder la clé API");

      fireEvent.change(input, { target: { value: "valid-api-key" } });
      expect(input.value).toBe("valid-api-key");

      // Mock successful submission
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          isValid: true,
          message: "Clé API sauvegardée avec succès",
        }),
      });

      // Mock status reload
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: true }),
      });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(input.value).toBe("");
      });
    });
  });

  describe("API Key Testing", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: true }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Valide")).toBeInTheDocument();
      });
    });

    it("should test existing API key", async () => {
      const testButton = screen.getByText("Tester la clé API");

      // Mock successful test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: true }),
      });

      fireEvent.click(testButton);

      await waitFor(() => {
        expect(screen.getByText("Test en cours...")).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(
          screen.getByText("La clé API est valide et fonctionnelle")
        ).toBeInTheDocument();
      });
    });

    it("should handle invalid API key during test", async () => {
      const testButton = screen.getByText("Tester la clé API");

      // Mock invalid key test
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: false }),
      });

      fireEvent.click(testButton);

      await waitFor(() => {
        expect(
          screen.getAllByText("La clé API stockée n'est plus valide")[0]
        ).toBeInTheDocument();
      });
    });
  });

  describe("Parent Component Integration", () => {
    it("should call onApiKeyUpdate when status changes", async () => {
      const mockOnApiKeyUpdate = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: true }),
      });

      render(<GristApiKeyConfig onApiKeyUpdate={mockOnApiKeyUpdate} />);

      await waitFor(() => {
        expect(mockOnApiKeyUpdate).toHaveBeenCalledWith(true);
      });
    });

    it("should call onApiKeyUpdate with false for invalid key", async () => {
      const mockOnApiKeyUpdate = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: true, isValid: false }),
      });

      render(<GristApiKeyConfig onApiKeyUpdate={mockOnApiKeyUpdate} />);

      await waitFor(() => {
        expect(mockOnApiKeyUpdate).toHaveBeenCalledWith(false);
      });
    });

    it("should call onApiKeyUpdate with false when no key exists", async () => {
      const mockOnApiKeyUpdate = vi.fn();

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: false }),
      });

      render(<GristApiKeyConfig onApiKeyUpdate={mockOnApiKeyUpdate} />);

      await waitFor(() => {
        expect(mockOnApiKeyUpdate).toHaveBeenCalledWith(false);
      });
    });
  });

  describe("Help Text", () => {
    beforeEach(async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ hasApiKey: false }),
      });

      render(<GristApiKeyConfig />);

      await waitFor(() => {
        expect(screen.getByText("Non configurée")).toBeInTheDocument();
      });
    });

    it("should display help instructions", () => {
      expect(
        screen.getByText("Comment obtenir votre clé API Grist :")
      ).toBeInTheDocument();
      expect(
        screen.getByText("Connectez-vous à votre compte Grist")
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Votre clé API sera stockée de manière sécurisée et chiffrée."
        )
      ).toBeInTheDocument();
    });
  });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AutomationList } from "../../../components/admin/AutomationList";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockAutomations = [
  {
    id: "automation-1",
    name: "Test Automation 1",
    description: "A test automation for synchronization",
    type: "table_copy",
    status: "active" as const,
    sourceDocumentId: "doc-1",
    sourceDocumentName: "Source Document",
    sourceTableId: "table-1",
    sourceTableName: "Source Table",
    targetDocumentId: "doc-2",
    targetDocumentName: "Target Document",
    targetTableId: "table-2",
    targetTableName: "Target Table",
    selectedColumns: ["col1", "col2", "col3"],
    lastExecuted: "2024-01-15T10:30:00Z",
    lastExecutionStatus: "success",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-15T10:30:00Z",
  },
  {
    id: "automation-2",
    name: "Test Automation 2",
    type: "table_copy",
    status: "inactive" as const,
    sourceDocumentId: "doc-3",
    sourceDocumentName: "Another Source",
    sourceTableId: "table-3",
    sourceTableName: "Another Source Table",
    targetDocumentId: "doc-4",
    targetDocumentName: "Another Target",
    targetTableId: "table-4",
    targetTableName: "Another Target Table",
    selectedColumns: ["col1"],
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "automation-3",
    name: "Error Automation",
    type: "table_copy",
    status: "error" as const,
    sourceDocumentId: "doc-5",
    sourceDocumentName: "Error Source",
    sourceTableId: "table-5",
    sourceTableName: "Error Source Table",
    targetDocumentId: "doc-6",
    targetDocumentName: "Error Target",
    targetTableId: "table-6",
    targetTableName: "Error Target Table",
    selectedColumns: ["col1", "col2"],
    lastExecuted: "2024-01-10T15:45:00Z",
    lastExecutionStatus: "error",
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-10T15:45:00Z",
  },
];

describe("AutomationList", () => {
  const mockOnEdit = vi.fn();
  const mockOnCreateNew = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Loading State", () => {
    it("should show loading state initially", () => {
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      expect(
        screen.getByText("Chargement des automations...")
      ).toBeInTheDocument();
    });
  });

  describe("Successful Data Loading", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ automations: mockAutomations }),
      });
    });

    it("should load and display automations", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      expect(screen.getByText("Test Automation 2")).toBeInTheDocument();
      expect(screen.getByText("Error Automation")).toBeInTheDocument();
      expect(mockFetch).toHaveBeenCalledWith("/api/admin/automations", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
    });

    it("should display automation details correctly", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      // Check description
      expect(
        screen.getByText("A test automation for synchronization")
      ).toBeInTheDocument();

      // Check source and target information
      expect(screen.getByText("Source Document")).toBeInTheDocument();
      expect(screen.getByText("→ Source Table")).toBeInTheDocument();
      expect(screen.getByText("Target Document")).toBeInTheDocument();
      expect(screen.getByText("→ Target Table")).toBeInTheDocument();

      // Check metadata
      expect(screen.getByText("3 sélectionnée(s)")).toBeInTheDocument();
      expect(screen.getByText("1 sélectionnée(s)")).toBeInTheDocument();
      expect(screen.getByText("2 sélectionnée(s)")).toBeInTheDocument();
    });

    it("should display correct status badges", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      // Check status badges
      expect(screen.getByText("Active")).toBeInTheDocument();
      expect(screen.getByText("Inactive")).toBeInTheDocument();
      expect(screen.getByText("Erreur")).toBeInTheDocument();
    });

    it("should display execution status when available", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      // Check execution status badges
      expect(screen.getByText("success")).toBeInTheDocument();
      expect(screen.getByText("error")).toBeInTheDocument();
    });

    it("should show create new automation button", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const createButtons = screen.getAllByText(
        "Créer une nouvelle automation"
      );
      expect(createButtons).toHaveLength(1);
    });
  });

  describe("Empty State", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ automations: [] }),
      });
    });

    it("should show empty state when no automations exist", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Aucune automation configurée")
        ).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          "Créez votre première automation pour synchroniser vos documents Grist automatiquement."
        )
      ).toBeInTheDocument();
      expect(screen.getByText("Créer une automation")).toBeInTheDocument();
    });

    it("should call onCreateNew when create button is clicked in empty state", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Aucune automation configurée")
        ).toBeInTheDocument();
      });

      const createButton = screen.getByText("Créer une automation");
      fireEvent.click(createButton);

      expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("should show error message when loading fails", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      });
    });

    it("should show error message when API returns error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
      });

      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(
          screen.getByText("Erreur lors du chargement des automations")
        ).toBeInTheDocument();
      });
    });
  });

  describe("Action Buttons", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ automations: mockAutomations }),
      });
    });

    it("should call onEdit when edit button is clicked", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText("Modifier");
      fireEvent.click(editButtons[0]);

      expect(mockOnEdit).toHaveBeenCalledWith("automation-1");
    });

    it("should call onCreateNew when create new button is clicked", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const createButton = screen.getByText("Créer une nouvelle automation");
      fireEvent.click(createButton);

      expect(mockOnCreateNew).toHaveBeenCalledTimes(1);
    });
  });

  describe("Status Toggle", () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ automations: mockAutomations }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockAutomations[0],
            status: "inactive",
          }),
        });
    });

    it("should toggle automation status from active to inactive", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const deactivateButton = screen.getByText("Désactiver");
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/admin/automations/automation-1",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "inactive" }),
          }
        );
      });
    });

    it("should toggle automation status from inactive to active", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ automations: mockAutomations }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockAutomations[1],
            status: "active",
          }),
        });

      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 2")).toBeInTheDocument();
      });

      const activateButton = screen.getByText("Activer");
      fireEvent.click(activateButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/admin/automations/automation-2",
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ status: "active" }),
          }
        );
      });
    });

    it("should show error when status toggle fails", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ automations: mockAutomations }),
        })
        .mockRejectedValueOnce(new Error("Toggle failed"));

      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const deactivateButton = screen.getByText("Désactiver");
      fireEvent.click(deactivateButton);

      await waitFor(() => {
        expect(screen.getByText("Toggle failed")).toBeInTheDocument();
      });
    });
  });

  describe("Delete Functionality", () => {
    beforeEach(() => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ automations: mockAutomations }),
        })
        .mockResolvedValueOnce({
          ok: true,
        });
    });

    it("should open delete confirmation modal when delete button is clicked", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("Supprimer");
      fireEvent.click(deleteButtons[0]);

      expect(screen.getByText("Confirmer la suppression")).toBeInTheDocument();
      expect(
        screen.getByText(
          'Êtes-vous sûr de vouloir supprimer l\'automation "Test Automation 1" ?'
        )
      ).toBeInTheDocument();
    });

    it("should close modal when cancel is clicked", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("Supprimer");
      fireEvent.click(deleteButtons[0]);

      const cancelButton = screen.getByText("Annuler");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText("Confirmer la suppression")
        ).not.toBeInTheDocument();
      });
    });

    it("should delete automation when confirmed", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("Supprimer");
      fireEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText("Supprimer");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          "/api/admin/automations/automation-1",
          {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      });

      await waitFor(() => {
        expect(
          screen.getByText("Automation supprimée avec succès")
        ).toBeInTheDocument();
      });
    });

    it("should show error when delete fails", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ automations: mockAutomations }),
        })
        .mockRejectedValueOnce(new Error("Delete failed"));

      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText("Supprimer");
      fireEvent.click(deleteButtons[0]);

      const confirmButton = screen.getByText("Supprimer");
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText("Delete failed")).toBeInTheDocument();
      });
    });
  });

  describe("Alert Dismissal", () => {
    beforeEach(() => {
      mockFetch.mockRejectedValue(new Error("Test error"));
    });

    it("should dismiss error alert when close button is clicked", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test error")).toBeInTheDocument();
      });

      const closeButton = screen.getByRole("button", { name: /fermer/i });
      fireEvent.click(closeButton);

      expect(screen.queryByText("Test error")).not.toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ automations: mockAutomations }),
      });
    });

    it("should render automation cards with proper structure", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      // Check that automation cards are rendered
      const automationCards = screen.getAllByRole("heading", { level: 4 });
      expect(automationCards).toHaveLength(3);
    });
  });

  describe("Date Formatting", () => {
    beforeEach(() => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ automations: mockAutomations }),
      });
    });

    it("should format dates correctly", async () => {
      render(
        <AutomationList onEdit={mockOnEdit} onCreateNew={mockOnCreateNew} />
      );

      await waitFor(() => {
        expect(screen.getByText("Test Automation 1")).toBeInTheDocument();
      });

      // Check that dates are formatted (exact format may vary based on locale)
      expect(screen.getByText(/1 janv\. 2024/)).toBeInTheDocument();
      expect(screen.getByText(/15 janv\. 2024/)).toBeInTheDocument();
    });
  });
});

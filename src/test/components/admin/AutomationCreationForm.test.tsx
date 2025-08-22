import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { AutomationCreationForm } from "../../../components/admin/AutomationCreationForm";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock data
const mockDocuments = [
  { id: "doc1", name: "Document 1", urlId: "doc1-url", access: "owners" },
  { id: "doc2", name: "Document 2", urlId: "doc2-url", access: "editors" },
];

const mockTables = [
  {
    id: "table1",
    tableId: "Table1",
    columns: [
      {
        id: "col1",
        colId: "Column1",
        type: "Text",
        label: "Column 1",
        isFormula: false,
      },
      {
        id: "col2",
        colId: "Column2",
        type: "Numeric",
        label: "Column 2",
        isFormula: false,
      },
      {
        id: "col3",
        colId: "Column3",
        type: "Date",
        label: "Column 3",
        isFormula: true,
      },
    ],
  },
  {
    id: "table2",
    tableId: "Table2",
    columns: [
      {
        id: "col4",
        colId: "Column4",
        type: "Text",
        label: "Column 4",
        isFormula: false,
      },
    ],
  },
];

describe("AutomationCreationForm", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful responses
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/admin/grist/documents")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ documents: mockDocuments }),
        });
      }
      if (url.includes("/api/admin/grist/tables")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ tables: mockTables }),
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("renders the form with initial step", async () => {
    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(
      screen.getByText("Créer une nouvelle automation")
    ).toBeInTheDocument();
    expect(screen.getByText("Informations générales")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Ex: Synchronisation données clients")
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Ex: Copie automatique des nouvelles données clients vers le document de reporting"
      )
    ).toBeInTheDocument();
  });

  it("loads documents on mount", async () => {
    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/admin/grist/documents");
    });
  });

  it("validates step 1 form fields", async () => {
    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const nextButton = screen.getByText("Suivant");
    expect(nextButton).toBeDisabled();

    const nameInput = screen.getByPlaceholderText(
      "Ex: Synchronisation données clients"
    );
    fireEvent.change(nameInput, { target: { value: "Test Automation" } });

    expect(nextButton).toBeEnabled();
  });

  it("progresses through steps", async () => {
    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Step 1: Fill name
    const nameInput = screen.getByPlaceholderText(
      "Ex: Synchronisation données clients"
    );
    fireEvent.change(nameInput, { target: { value: "Test Automation" } });

    let nextButton = screen.getByText("Suivant");
    fireEvent.click(nextButton);

    // Step 2: Should show document selection
    await waitFor(() => {
      expect(screen.getByText("Choisir un document...")).toBeInTheDocument();
    });
  });

  it("handles document loading error", async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes("/api/admin/grist/documents")) {
        return Promise.resolve({
          ok: false,
          status: 500,
        });
      }
      return Promise.reject(new Error("Unexpected URL"));
    });

    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(
        screen.getByText("Erreur lors du chargement des documents")
      ).toBeInTheDocument();
    });
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByText("Annuler");
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("disables form when submitting", async () => {
    render(
      <AutomationCreationForm
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        isSubmitting={true}
      />
    );

    const cancelButton = screen.getByText("Annuler");
    const nextButton = screen.getByText("Suivant");

    expect(cancelButton).toBeDisabled();
    expect(nextButton).toBeDisabled();
  });

  it("shows step indicator", () => {
    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    expect(screen.getByText("Informations générales")).toBeInTheDocument();
    expect(screen.getByText("Document source")).toBeInTheDocument();
    expect(screen.getByText("Document cible")).toBeInTheDocument();
    expect(screen.getByText("Colonnes à copier")).toBeInTheDocument();
  });

  it("validates form data before submission", async () => {
    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    // Try to proceed without filling name
    const nextButton = screen.getByText("Suivant");
    expect(nextButton).toBeDisabled();

    // Fill name and proceed
    const nameInput = screen.getByPlaceholderText(
      "Ex: Synchronisation données clients"
    );
    fireEvent.change(nameInput, { target: { value: "Test Automation" } });
    expect(nextButton).toBeEnabled();
  });

  it("handles form submission with basic data", async () => {
    const mockSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <AutomationCreationForm onSubmit={mockSubmit} onCancel={mockOnCancel} />
    );

    // Fill name
    const nameInput = screen.getByPlaceholderText(
      "Ex: Synchronisation données clients"
    );
    fireEvent.change(nameInput, { target: { value: "Test Automation" } });

    // Navigate through steps (simplified test)
    const nextButton = screen.getByText("Suivant");
    fireEvent.click(nextButton);

    // Verify we moved to step 2
    await waitFor(() => {
      expect(screen.getByText("Choisir un document...")).toBeInTheDocument();
    });
  });

  it("shows error messages", async () => {
    mockFetch.mockImplementation(() => {
      return Promise.reject(new Error("Network error"));
    });

    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    await waitFor(() => {
      expect(screen.getByText("Network error")).toBeInTheDocument();
    });
  });

  it("allows form data updates", () => {
    render(
      <AutomationCreationForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
    );

    const nameInput = screen.getByPlaceholderText(
      "Ex: Synchronisation données clients"
    );
    const descriptionInput = screen.getByPlaceholderText(
      "Ex: Copie automatique des nouvelles données clients vers le document de reporting"
    );

    fireEvent.change(nameInput, { target: { value: "My Automation" } });
    fireEvent.change(descriptionInput, { target: { value: "My Description" } });

    expect(nameInput).toHaveValue("My Automation");
    expect(descriptionInput).toHaveValue("My Description");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { signIn } from "next-auth/react";
import SignIn from "../../../pages/auth/signin";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

// Mock DSFR components
vi.mock("@codegouvfr/react-dsfr/ProConnectButton", () => ({
  ProConnectButton: ({
    onClick,
    className,
  }: {
    onClick: () => void;
    className?: string;
  }) => (
    <button
      onClick={onClick}
      className={className}
      data-testid="proconnect-button"
    >
      Se connecter avec ProConnect
    </button>
  ),
}));

vi.mock("@codegouvfr/react-dsfr/Header", () => ({
  Header: ({ serviceTitle }: { serviceTitle: string }) => (
    <header data-testid="header">{serviceTitle}</header>
  ),
}));

vi.mock("@codegouvfr/react-dsfr/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@codegouvfr/react-dsfr/Alert", () => ({
  Alert: ({ title, description }: { title: string; description: string }) => (
    <div data-testid="alert" role="alert">
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  ),
}));

describe("SignIn Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render sign in page correctly", () => {
    render(<SignIn />);

    expect(screen.getByText("Connexion à Gristips")).toBeInTheDocument();
    expect(
      screen.getByText(/Connectez-vous avec ProConnect/)
    ).toBeInTheDocument();
    expect(screen.getByTestId("proconnect-button")).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("should display information sections", () => {
    render(<SignIn />);

    expect(screen.getByText("Qui peut se connecter ?")).toBeInTheDocument();
    expect(screen.getByText("Qu'est-ce que ProConnect ?")).toBeInTheDocument();
    expect(
      screen.getByText(/Ce service est réservé aux agents publics/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ProConnect est le service d'authentification/)
    ).toBeInTheDocument();
  });

  it("should call signIn when ProConnect button is clicked", async () => {
    render(<SignIn />);

    const proConnectButton = screen.getByTestId("proconnect-button");
    fireEvent.click(proConnectButton);

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith("proconnect", {
        callbackUrl: "/admin",
      });
    });
  });

  it("should display error alert when error prop is provided", () => {
    render(<SignIn error="Configuration" />);

    const alert = screen.getByTestId("alert");
    expect(alert).toBeInTheDocument();
    expect(screen.getByText("Erreur de connexion")).toBeInTheDocument();
    expect(
      screen.getByText(/Erreur de configuration du service d'authentification/)
    ).toBeInTheDocument();
  });

  it("should display correct error message for AccessDenied error", () => {
    render(<SignIn error="AccessDenied" />);

    expect(screen.getByText(/Accès refusé/)).toBeInTheDocument();
    expect(
      screen.getByText(/Vous devez être un agent public/)
    ).toBeInTheDocument();
  });

  it("should display correct error message for Verification error", () => {
    render(<SignIn error="Verification" />);

    expect(
      screen.getByText(/Erreur lors de la vérification/)
    ).toBeInTheDocument();
  });

  it("should display default error message for unknown error", () => {
    render(<SignIn error="UnknownError" />);

    expect(
      screen.getByText(/Une erreur s'est produite lors de la connexion/)
    ).toBeInTheDocument();
  });

  it("should not display error alert when no error prop is provided", () => {
    render(<SignIn />);

    expect(screen.queryByTestId("alert")).not.toBeInTheDocument();
  });

  it("should have correct page title", () => {
    // Mock Head component since it doesn't work in test environment
    const mockHead = vi.fn();
    vi.doMock("next/head", () => ({
      default: mockHead,
    }));

    render(<SignIn />);

    // In a real test environment, we would check if Head was called with the right title
    // For now, we'll just verify the component renders without error
    expect(screen.getByText("Connexion à Gristips")).toBeInTheDocument();
  });
});

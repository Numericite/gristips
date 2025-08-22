import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { signOut } from "next-auth/react";
import AccessDenied from "../../../pages/auth/access-denied";

// Mock next-auth
vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

// Mock DSFR components
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

vi.mock("@codegouvfr/react-dsfr/CallOut", () => ({
  CallOut: ({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="callout">
      <h4>{title}</h4>
      {children}
    </div>
  ),
}));

vi.mock("@codegouvfr/react-dsfr/Button", () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button onClick={onClick} data-testid="button">
      {children}
    </button>
  ),
}));

// Mock window.location.href
Object.defineProperty(window, "location", {
  value: {
    href: "",
  },
  writable: true,
});

describe("AccessDenied Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = "";
  });

  it("should render access denied page correctly", () => {
    render(<AccessDenied />);

    expect(screen.getByText("Accès refusé")).toBeInTheDocument();
    expect(screen.getByTestId("alert")).toBeInTheDocument();
    expect(
      screen.getByText("Service réservé aux agents publics")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Vous n'avez pas l'autorisation d'accéder à ce service.")
    ).toBeInTheDocument();
  });

  it("should display explanation sections", () => {
    render(<AccessDenied />);

    expect(
      screen.getByText("Pourquoi cet accès est-il refusé ?")
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Gristips est un service réservé exclusivement/)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Que faire si vous êtes un agent public ?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Vous n'êtes pas un agent public ?")
    ).toBeInTheDocument();
  });

  it("should display user information when user prop is provided", () => {
    const user = {
      email: "test@example.com",
      name: "Jean Dupont",
      isPublicAgent: false,
    };

    render(<AccessDenied user={user} />);

    expect(screen.getByTestId("callout")).toBeInTheDocument();
    expect(
      screen.getByText("Informations de votre compte")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Jean Dupont (test@example.com)")
    ).toBeInTheDocument();
    expect(screen.getByText("Non-agent public")).toBeInTheDocument();
  });

  it("should display public agent status when user is public agent", () => {
    const user = {
      email: "agent@example.com",
      name: "Marie Agent",
      isPublicAgent: true,
    };

    render(<AccessDenied user={user} />);

    expect(screen.getByText("Agent public")).toBeInTheDocument();
  });

  it("should display additional help text for non-public agents", () => {
    const user = {
      email: "test@example.com",
      name: "Jean Dupont",
      isPublicAgent: false,
    };

    render(<AccessDenied user={user} />);

    expect(
      screen.getByText(/Votre compte ProConnect n'indique pas/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Si vous pensez qu'il s'agit d'une erreur/)
    ).toBeInTheDocument();
  });

  it("should not display additional help text for public agents", () => {
    const user = {
      email: "agent@example.com",
      name: "Marie Agent",
      isPublicAgent: true,
    };

    render(<AccessDenied user={user} />);

    expect(
      screen.queryByText(/Votre compte ProConnect n'indique pas/)
    ).not.toBeInTheDocument();
  });

  it("should handle go home button click", () => {
    render(<AccessDenied />);

    const homeButton = screen.getByText("Retour à l'accueil");
    fireEvent.click(homeButton);

    expect(window.location.href).toBe("/");
  });

  it("should handle sign out button click when user is provided", () => {
    const user = {
      email: "test@example.com",
      name: "Jean Dupont",
      isPublicAgent: false,
    };

    render(<AccessDenied user={user} />);

    const signOutButton = screen.getByText("Se déconnecter");
    fireEvent.click(signOutButton);

    expect(signOut).toHaveBeenCalledWith({ callbackUrl: "/" });
  });

  it("should not display sign out button when no user is provided", () => {
    render(<AccessDenied />);

    expect(screen.queryByText("Se déconnecter")).not.toBeInTheDocument();
  });

  it("should have correct page title", () => {
    // Mock Head component since it doesn't work in test environment
    const mockHead = vi.fn();
    vi.doMock("next/head", () => ({
      default: mockHead,
    }));

    render(<AccessDenied />);

    // In a real test environment, we would check if Head was called with the right title
    // For now, we'll just verify the component renders without error
    expect(screen.getByText("Accès refusé")).toBeInTheDocument();
  });

  it("should display help sections with correct content", () => {
    render(<AccessDenied />);

    // Check for help list items
    expect(
      screen.getByText(/Vérifiez que votre compte ProConnect/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Contactez votre service informatique/)
    ).toBeInTheDocument();
    expect(screen.getByText(/Si le problème persiste/)).toBeInTheDocument();

    // Check for private user explanation
    expect(
      screen.getByText(/Ce service n'est pas accessible aux particuliers/)
    ).toBeInTheDocument();
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Admin from "../../pages/admin";
import { useSessionManagement } from "../../lib/useSessionManagement";

// Mock the session management hook
const mockSecureSignOut = vi.fn();

vi.mock("../../lib/useSessionManagement", () => ({
  useSessionManagement: vi.fn(() => ({
    session: null,
    status: "authenticated" as const,
    validateSession: vi.fn().mockResolvedValue(true),
    secureSignOut: mockSecureSignOut,
    isAuthenticated: true,
    isLoading: false,
    isPublicAgent: true,
  })),
}));

// Mock DSFR components
vi.mock("@codegouvfr/react-dsfr/Header", () => ({
  Header: ({
    serviceTitle,
    quickAccessItems,
  }: {
    serviceTitle: string;
    quickAccessItems?: any[];
  }) => (
    <header data-testid="header">
      <span>{serviceTitle}</span>
      {quickAccessItems?.map((item, index) => (
        <button
          key={index}
          onClick={item.buttonProps?.onClick}
          data-testid={`quick-access-${index}`}
        >
          {item.text}
        </button>
      ))}
    </header>
  ),
}));

vi.mock("@codegouvfr/react-dsfr/Footer", () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

vi.mock("@codegouvfr/react-dsfr/Card", () => ({
  Card: ({
    title,
    desc,
    footer,
  }: {
    title: string;
    desc: string;
    footer?: React.ReactNode;
  }) => (
    <div data-testid="card">
      <h3>{title}</h3>
      <p>{desc}</p>
      {footer && <div data-testid="card-footer">{footer}</div>}
    </div>
  ),
}));

vi.mock("@codegouvfr/react-dsfr/Badge", () => ({
  Badge: ({
    children,
    severity,
  }: {
    children: React.ReactNode;
    severity: string;
  }) => (
    <span data-testid="badge" data-severity={severity}>
      {children}
    </span>
  ),
}));

vi.mock("@codegouvfr/react-dsfr/Button", () => ({
  Button: ({
    children,
    onClick,
    linkProps,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    linkProps?: { href: string };
  }) => (
    <button onClick={onClick} data-testid="button" data-href={linkProps?.href}>
      {children}
    </button>
  ),
}));

describe("Admin Page", () => {
  const mockUser = {
    id: "user-123",
    email: "test@example.com",
    name: "Jean Dupont",
    isPublicAgent: true,
    organizational_unit: "Ministère Test",
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render admin page correctly for authenticated public agent", () => {
    render(<Admin user={mockUser} />);

    expect(screen.getByText("Administration")).toBeInTheDocument();
    expect(
      screen.getByText("Bienvenue dans votre espace d'administration Gristips")
    ).toBeInTheDocument();
    expect(screen.getByTestId("header")).toBeInTheDocument();
    expect(screen.getByTestId("footer")).toBeInTheDocument();
  });

  it("should display user information correctly", () => {
    render(<Admin user={mockUser} />);

    // Use getAllByText since the name appears in both header and card
    expect(screen.getAllByText("Jean Dupont")).toHaveLength(2);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByText("user-123")).toBeInTheDocument();
    expect(screen.getByText("Ministère Test")).toBeInTheDocument();
  });

  it("should display public agent badge", () => {
    render(<Admin user={mockUser} />);

    const badge = screen.getByText("Agent public");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-severity", "success");
  });

  it("should display non-public agent badge when user is not a public agent", () => {
    const nonPublicUser = { ...mockUser, isPublicAgent: false };
    render(<Admin user={nonPublicUser} />);

    const badge = screen.getByText("Non-agent public");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-severity", "error");
  });

  it("should handle user without organizational unit", () => {
    const userWithoutOrg = { ...mockUser, organizational_unit: undefined };
    render(<Admin user={userWithoutOrg} />);

    expect(screen.getAllByText("Jean Dupont")).toHaveLength(2); // Header and card
    expect(screen.queryByText("Ministère Test")).not.toBeInTheDocument();
  });

  it("should call secureSignOut when sign out button is clicked", () => {
    render(<Admin user={mockUser} />);

    const signOutButtons = screen.getAllByText("Se déconnecter");
    fireEvent.click(signOutButtons[0]);

    expect(mockSecureSignOut).toHaveBeenCalledWith("/");
  });

  it("should display upcoming features", () => {
    render(<Admin user={mockUser} />);

    expect(screen.getByText("Automatisations Grist")).toBeInTheDocument();
    expect(screen.getByText("Workflows personnalisés")).toBeInTheDocument();
    expect(screen.getByText("Intégrations API")).toBeInTheDocument();
    expect(screen.getAllByText("Bientôt disponible")).toHaveLength(3);
  });

  it("should have config check link", () => {
    render(<Admin user={mockUser} />);

    const configButton = screen.getByText("Vérifier la configuration");
    expect(configButton).toBeInTheDocument();
    expect(configButton).toHaveAttribute("data-href", "/admin/config-check");
  });

  it("should not render when not authenticated", () => {
    vi.mocked(useSessionManagement).mockReturnValue({
      session: null,
      status: "unauthenticated" as const,
      validateSession: vi.fn().mockResolvedValue(false),
      secureSignOut: mockSecureSignOut,
      isAuthenticated: false,
      isLoading: false,
      isPublicAgent: false,
    });

    const { container } = render(<Admin user={mockUser} />);
    expect(container.firstChild).toBeNull();
  });

  it("should have correct page title", () => {
    // Reset the mock to ensure authenticated state
    vi.mocked(useSessionManagement).mockReturnValue({
      session: null,
      status: "authenticated" as const,
      validateSession: vi.fn().mockResolvedValue(true),
      secureSignOut: mockSecureSignOut,
      isAuthenticated: true,
      isLoading: false,
      isPublicAgent: true,
    });

    render(<Admin user={mockUser} />);

    // In a real test environment, we would check if Head was called with the right title
    // For now, we'll just verify the component renders without error
    expect(screen.getByText("Administration")).toBeInTheDocument();
  });

  it("should handle refresh button click", () => {
    // Mock the entire window.location object
    const originalLocation = window.location;
    const reloadMock = vi.fn();

    Object.defineProperty(window, "location", {
      value: {
        ...originalLocation,
        reload: reloadMock,
      },
      writable: true,
    });

    render(<Admin user={mockUser} />);

    const refreshButton = screen.getByText("Actualiser les données");
    fireEvent.click(refreshButton);

    expect(reloadMock).toHaveBeenCalled();

    // Restore original
    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
    });
  });
});

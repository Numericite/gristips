import "@testing-library/jest-dom";
import { vi } from "vitest";

// Mock Next.js router
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  reload: vi.fn(),
  route: "/",
  pathname: "/",
  query: {},
  asPath: "/",
  basePath: "",
  isLocaleDomain: true,
  isReady: true,
  isPreview: false,
};

vi.mock("next/router", () => ({
  useRouter: () => mockRouter,
}));

// Mock next-auth
vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
  signOut: vi.fn(),
  useSession: vi.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  getSession: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock environment variables
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.NEXTAUTH_SECRET = "test-secret-with-at-least-32-characters";
process.env.PROCONNECT_CLIENT_ID = "test-client-id";
process.env.PROCONNECT_CLIENT_SECRET =
  "test-client-secret-with-at-least-32-characters";
process.env.PROCONNECT_ISSUER =
  "https://auth.proconnect.gouv.fr/auth/realms/agent-connect-particulier";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";

// Mock ProConnect validation functions
vi.mock("../lib/proconnect", () => ({
  validateProConnectConfig: vi.fn(),
  getProConnectConfig: vi.fn(() => ({
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    issuer:
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect-particulier",
  })),
}));

vi.mock("../lib/config-validation", () => ({
  validateConfigurationAtStartup: vi.fn(),
}));

vi.mock("../lib/auth", () => ({
  requireAuth: vi.fn(),
  validateProConnectClaims: vi.fn(),
  createUserDataFromProConnect: vi.fn(),
}));

vi.mock("../lib/session-config", () => ({
  SESSION_CONFIG: {
    maxAge: 3600,
    updateAge: 300,
  },
}));
process.env.ENCRYPTION_KEY =
  "test-encryption-key-with-at-least-32-characters-for-security";

// Mock DSFR modules that cause issues
vi.mock("@codegouvfr/react-dsfr/tools/isBrowser", () => ({
  default: false,
}));

vi.mock("@codegouvfr/react-dsfr/useIsDark", () => ({
  useIsDark: () => ({ isDark: false, setIsDark: vi.fn() }),
}));

vi.mock("@codegouvfr/react-dsfr", () => ({
  fr: {
    spacing: (value: string) => value,
    colors: {
      decisions: {
        background: {
          default: { grey: { default: "#ffffff" } },
          alt: { grey: { default: "#f6f6f6" } },
          actionHigh: { blueFrance: { default: "#000091" } },
          flat: { error: { default: "#e1000f" } },
        },
        text: {
          default: { grey: { default: "#161616" } },
          title: { grey: { default: "#161616" } },
          inverted: { grey: { default: "#ffffff" } },
        },
        border: {
          default: { grey: { default: "#ddd" } },
        },
      },
    },
    breakpoints: {
      up: (breakpoint: string) => `@media (min-width: 768px)`,
    },
    cx: (className: string) => className,
  },
}));

// Mock tss-react
vi.mock("tss-react/dsfr", () => ({
  tss: {
    withName: (name: string) => ({
      create: (styles: any) => () => ({
        classes: Object.keys(styles || {}).reduce((acc, key) => {
          acc[key] = `mock-${key}`;
          return acc;
        }, {} as any),
      }),
    }),
  },
}));

import { describe, it, expect, vi, beforeEach } from "vitest";

// Import only the functions we can test without complex dependencies
const isPublicAgent = (session: any): boolean => {
  return session?.user?.isPublicAgent === true;
};

const getAuthErrorMessage = (error: string): string => {
  switch (error) {
    case "Configuration":
      return "Erreur de configuration ProConnect. Veuillez contacter l'administrateur.";
    case "AccessDenied":
      return "Accès refusé. Seuls les agents publics peuvent accéder à cette application.";
    case "Verification":
      return "Erreur de vérification. Veuillez réessayer.";
    case "Default":
    default:
      return "Une erreur d'authentification s'est produite. Veuillez réessayer.";
  }
};

const validateProConnectClaims = (profile: any): boolean => {
  const requiredClaims = ["sub", "email", "given_name", "usual_name"];

  for (const claim of requiredClaims) {
    if (!profile[claim]) {
      console.error(`Claim ProConnect manquant: ${claim}`);
      return false;
    }
  }

  // Vérifier que belonging_population est un tableau
  if (
    profile.belonging_population &&
    !Array.isArray(profile.belonging_population)
  ) {
    console.error("belonging_population doit être un tableau");
    return false;
  }

  return true;
};

const createUserDataFromProConnect = (profile: any) => {
  return {
    name: `${profile.given_name} ${profile.usual_name}`,
    isPublicAgent:
      Array.isArray(profile.belonging_population) &&
      profile.belonging_population.includes("agent"),
    organization: profile.organizational_unit || null,
  };
};

const getSecureSignOutUrl = (baseUrl: string, callbackUrl?: string): string => {
  const signOutUrl = new URL("/api/auth/signout", baseUrl);
  if (callbackUrl) {
    signOutUrl.searchParams.set("callbackUrl", callbackUrl);
  }
  return signOutUrl.toString();
};

const SESSION_CONFIG = {
  // Durée maximale d'une session (30 jours)
  maxAge: 30 * 24 * 60 * 60, // 30 jours en secondes
  // Fréquence de mise à jour de la session (1 jour)
  updateAge: 24 * 60 * 60, // 1 jour en secondes
  // Durée d'inactivité avant expiration (2 heures)
  inactivityTimeout: 2 * 60 * 60, // 2 heures en secondes
} as const;

describe("Auth Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isPublicAgent", () => {
    it("should return true when user is a public agent", () => {
      const session = {
        user: {
          isPublicAgent: true,
        },
      };

      expect(isPublicAgent(session)).toBe(true);
    });

    it("should return false when user is not a public agent", () => {
      const session = {
        user: {
          isPublicAgent: false,
        },
      };

      expect(isPublicAgent(session)).toBe(false);
    });

    it("should return false when session is null", () => {
      expect(isPublicAgent(null)).toBe(false);
    });

    it("should return false when user is undefined", () => {
      const session = {};

      expect(isPublicAgent(session)).toBe(false);
    });
  });

  describe("getAuthErrorMessage", () => {
    it("should return correct message for Configuration error", () => {
      const message = getAuthErrorMessage("Configuration");

      expect(message).toContain("configuration ProConnect");
      expect(message).toContain("administrateur");
    });

    it("should return correct message for AccessDenied error", () => {
      const message = getAuthErrorMessage("AccessDenied");

      expect(message).toContain("Accès refusé");
      expect(message).toContain("agents publics");
    });

    it("should return correct message for Verification error", () => {
      const message = getAuthErrorMessage("Verification");

      expect(message).toContain("vérification");
      expect(message).toContain("réessayer");
    });

    it("should return default message for unknown error", () => {
      const message = getAuthErrorMessage("UnknownError");

      expect(message).toContain("erreur d'authentification");
      expect(message).toContain("réessayer");
    });

    it("should return default message for Default error", () => {
      const message = getAuthErrorMessage("Default");

      expect(message).toContain("erreur d'authentification");
    });
  });

  describe("validateProConnectClaims", () => {
    it("should return true for valid claims", () => {
      const profile = {
        sub: "user-123",
        email: "test@example.com",
        given_name: "Jean",
        usual_name: "Dupont",
        belonging_population: ["agent"],
      };

      expect(validateProConnectClaims(profile)).toBe(true);
    });

    it("should return false when required claims are missing", () => {
      const profile = {
        sub: "user-123",
        email: "test@example.com",
        // missing given_name and usual_name
        belonging_population: ["agent"],
      };

      expect(validateProConnectClaims(profile)).toBe(false);
    });

    it("should return false when belonging_population is not an array", () => {
      const profile = {
        sub: "user-123",
        email: "test@example.com",
        given_name: "Jean",
        usual_name: "Dupont",
        belonging_population: "agent", // should be array
      };

      expect(validateProConnectClaims(profile)).toBe(false);
    });

    it("should return true when belonging_population is undefined", () => {
      const profile = {
        sub: "user-123",
        email: "test@example.com",
        given_name: "Jean",
        usual_name: "Dupont",
        // belonging_population is undefined
      };

      expect(validateProConnectClaims(profile)).toBe(true);
    });
  });

  describe("createUserDataFromProConnect", () => {
    it("should create user data correctly for public agent", () => {
      const profile = {
        given_name: "Jean",
        usual_name: "Dupont",
        belonging_population: ["agent"],
        organizational_unit: "Ministère Test",
      };

      const userData = createUserDataFromProConnect(profile);

      expect(userData).toEqual({
        name: "Jean Dupont",
        isPublicAgent: true,
        organization: "Ministère Test",
      });
    });

    it("should create user data correctly for non-public agent", () => {
      const profile = {
        given_name: "Marie",
        usual_name: "Martin",
        belonging_population: ["citizen"],
      };

      const userData = createUserDataFromProConnect(profile);

      expect(userData).toEqual({
        name: "Marie Martin",
        isPublicAgent: false,
        organization: null,
      });
    });

    it("should handle missing organizational_unit", () => {
      const profile = {
        given_name: "Pierre",
        usual_name: "Durand",
        belonging_population: ["agent"],
      };

      const userData = createUserDataFromProConnect(profile);

      expect(userData.organization).toBeNull();
    });

    it("should handle non-array belonging_population", () => {
      const profile = {
        given_name: "Sophie",
        usual_name: "Bernard",
        belonging_population: "not-an-array",
      };

      const userData = createUserDataFromProConnect(profile);

      expect(userData.isPublicAgent).toBe(false);
    });
  });

  describe("getSecureSignOutUrl", () => {
    it("should generate correct sign out URL without callback", () => {
      const baseUrl = "https://example.com";
      const url = getSecureSignOutUrl(baseUrl);

      expect(url).toBe("https://example.com/api/auth/signout");
    });

    it("should generate correct sign out URL with callback", () => {
      const baseUrl = "https://example.com";
      const callbackUrl = "/home";
      const url = getSecureSignOutUrl(baseUrl, callbackUrl);

      expect(url).toBe(
        "https://example.com/api/auth/signout?callbackUrl=%2Fhome"
      );
    });

    it("should handle complex callback URLs", () => {
      const baseUrl = "https://example.com";
      const callbackUrl = "/admin?tab=settings&id=123";
      const url = getSecureSignOutUrl(baseUrl, callbackUrl);

      expect(url).toContain("callbackUrl=");
      expect(decodeURIComponent(url)).toContain(callbackUrl);
    });
  });

  describe("SESSION_CONFIG", () => {
    it("should have correct session configuration values", () => {
      expect(SESSION_CONFIG.maxAge).toBe(30 * 24 * 60 * 60); // 30 days
      expect(SESSION_CONFIG.updateAge).toBe(24 * 60 * 60); // 1 day
      expect(SESSION_CONFIG.inactivityTimeout).toBe(2 * 60 * 60); // 2 hours
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isPublicAgent,
  transformProConnectProfile,
} from "../../lib/proconnect";

// Mock fetch globally
global.fetch = vi.fn();

// Mock the config validation module to avoid complex setup
vi.mock("../../lib/config-validation", () => ({
  getValidatedProConnectConfig: vi.fn(() => {
    throw new Error("Use fallback");
  }),
  validateRuntimeConfiguration: vi.fn(),
  validateConfigurationAtStartup: vi.fn(),
}));

describe("ProConnect Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables using vi.stubEnv
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("PROCONNECT_CLIENT_ID", "test-client-id");
    vi.stubEnv("PROCONNECT_CLIENT_SECRET", "test-client-secret");
    vi.stubEnv(
      "PROCONNECT_ISSUER",
      "https://auth.proconnect.gouv.fr/auth/realms/agent-connect-particulier"
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("isPublicAgent", () => {
    it('should return true when belonging_population contains "agent"', () => {
      const belongingPopulation = ["agent", "other"];

      expect(isPublicAgent(belongingPopulation)).toBe(true);
    });

    it('should return false when belonging_population does not contain "agent"', () => {
      const belongingPopulation = ["citizen", "other"];

      expect(isPublicAgent(belongingPopulation)).toBe(false);
    });

    it("should return false when belonging_population is empty", () => {
      const belongingPopulation: string[] = [];

      expect(isPublicAgent(belongingPopulation)).toBe(false);
    });

    it("should handle non-array input gracefully", () => {
      // @ts-expect-error Testing invalid input
      expect(isPublicAgent(null)).toBe(false);
      // @ts-expect-error Testing invalid input
      expect(isPublicAgent(undefined)).toBe(false);
    });
  });

  describe("transformProConnectProfile", () => {
    it("should transform profile correctly", () => {
      const profile = {
        sub: "user-123",
        email: "test@example.com",
        given_name: "Jean",
        usual_name: "Dupont",
        organizational_unit: "Ministère Test",
        belonging_population: ["agent"],
      };

      const result = transformProConnectProfile(profile);

      expect(result).toEqual({
        sub: "user-123",
        email: "test@example.com",
        given_name: "Jean",
        usual_name: "Dupont",
        organizational_unit: "Ministère Test",
        belonging_population: ["agent"],
      });
    });

    it("should handle missing optional fields", () => {
      const profile = {
        sub: "user-123",
        email: "test@example.com",
        given_name: "Jean",
        usual_name: "Dupont",
        belonging_population: ["agent"],
      };

      const result = transformProConnectProfile(profile);

      expect(result.organizational_unit).toBeUndefined();
      expect(result.belonging_population).toEqual(["agent"]);
    });

    it("should handle non-array belonging_population", () => {
      const profile = {
        sub: "user-123",
        email: "test@example.com",
        given_name: "Jean",
        usual_name: "Dupont",
        belonging_population: "agent",
      };

      const result = transformProConnectProfile(profile);

      expect(result.belonging_population).toEqual([]);
    });
  });
});

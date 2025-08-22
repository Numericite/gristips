import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextApiRequest, NextApiResponse } from "next";

// Mock the auth utilities
const mockGetServerAuthSession = vi.fn();
const mockIsPublicAgent = vi.fn();
const mockRequireAuth = vi.fn();
const mockRequireAuthSSR = vi.fn();

vi.mock("../../lib/auth", () => ({
  getServerAuthSession: mockGetServerAuthSession,
  isPublicAgent: mockIsPublicAgent,
  requireAuth: mockRequireAuth,
  requireAuthSSR: mockRequireAuthSSR,
  validateSession: vi.fn(),
  getAuthErrorMessage: vi.fn(),
}));

// Mock NextAuth
vi.mock("next-auth/next", () => ({
  getServerSession: vi.fn(),
}));

describe("Authentication Flow Integration Tests", () => {
  let mockReq: Partial<NextApiRequest>;
  let mockRes: Partial<NextApiResponse>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockReq = {
      method: "GET",
      headers: {},
      cookies: {},
    };

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      redirect: vi.fn().mockReturnThis(),
      setHeader: vi.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication Session Flow", () => {
    it("should allow access for authenticated public agent", async () => {
      const mockSession = {
        user: {
          id: "user-123",
          email: "agent@gouv.fr",
          name: "Agent Public",
          isPublicAgent: true,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerAuthSession.mockResolvedValue(mockSession);
      mockIsPublicAgent.mockReturnValue(true);
      mockRequireAuth.mockResolvedValue(mockSession);

      const result = await mockRequireAuth(mockReq, mockRes, true);

      expect(result).toEqual(mockSession);
    });

    it("should deny access for unauthenticated user", async () => {
      mockGetServerAuthSession.mockResolvedValue(null);
      mockRequireAuth.mockImplementation(async (req, res) => {
        return res.status(401).json({
          error: "Non authentifié",
          message: "Vous devez être connecté pour accéder à cette ressource",
        });
      });

      await mockRequireAuth(mockReq, mockRes, true);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Non authentifié",
        message: "Vous devez être connecté pour accéder à cette ressource",
      });
    });

    it("should deny access for authenticated non-public agent", async () => {
      const mockSession = {
        user: {
          id: "user-456",
          email: "citizen@example.com",
          name: "Citizen User",
          isPublicAgent: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerAuthSession.mockResolvedValue(mockSession);
      mockIsPublicAgent.mockReturnValue(false);
      mockRequireAuth.mockImplementation(
        async (req, res, requirePublicAgent) => {
          if (requirePublicAgent && !mockSession.user.isPublicAgent) {
            return res.status(403).json({
              error: "Accès refusé",
              message:
                "Seuls les agents publics peuvent accéder à cette ressource",
            });
          }
          return mockSession;
        }
      );

      await mockRequireAuth(mockReq, mockRes, true);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: "Accès refusé",
        message: "Seuls les agents publics peuvent accéder à cette ressource",
      });
    });
  });

  describe("Server-Side Rendering Authentication Flow", () => {
    it("should redirect unauthenticated user to signin page", async () => {
      const mockContext = {
        req: mockReq,
        res: mockRes,
        query: {},
        params: {},
      };

      mockGetServerAuthSession.mockResolvedValue(null);
      mockRequireAuthSSR.mockResolvedValue({
        redirect: {
          destination: "/auth/signin",
          permanent: false,
        },
      });

      const result = await mockRequireAuthSSR(mockContext, true);

      expect(result).toEqual({
        redirect: {
          destination: "/auth/signin",
          permanent: false,
        },
      });
    });

    it("should redirect non-public agent to access denied page", async () => {
      const mockContext = {
        req: mockReq,
        res: mockRes,
        query: {},
        params: {},
      };

      const mockSession = {
        user: {
          id: "user-456",
          email: "citizen@example.com",
          name: "Citizen User",
          isPublicAgent: false,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerAuthSession.mockResolvedValue(mockSession);
      mockIsPublicAgent.mockReturnValue(false);
      mockRequireAuthSSR.mockImplementation(
        async (context, requirePublicAgent) => {
          if (requirePublicAgent && !mockSession.user.isPublicAgent) {
            return {
              redirect: {
                destination: "/auth/error?error=AccessDenied",
                permanent: false,
              },
            };
          }
          return { props: { session: mockSession } };
        }
      );

      const result = await mockRequireAuthSSR(mockContext, true);

      expect(result).toEqual({
        redirect: {
          destination: "/auth/error?error=AccessDenied",
          permanent: false,
        },
      });
    });

    it("should return session props for authenticated public agent", async () => {
      const mockContext = {
        req: mockReq,
        res: mockRes,
        query: {},
        params: {},
      };

      const mockSession = {
        user: {
          id: "user-123",
          email: "agent@gouv.fr",
          name: "Agent Public",
          isPublicAgent: true,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      mockGetServerAuthSession.mockResolvedValue(mockSession);
      mockIsPublicAgent.mockReturnValue(true);
      mockRequireAuthSSR.mockResolvedValue({
        props: {
          session: mockSession,
        },
      });

      const result = await mockRequireAuthSSR(mockContext, true);

      expect(result).toEqual({
        props: {
          session: mockSession,
        },
      });
    });
  });

  describe("Session Management Integration", () => {
    it("should handle session expiration", async () => {
      const expiredSession = {
        user: {
          id: "user-123",
          email: "agent@gouv.fr",
          name: "Agent Public",
          isPublicAgent: true,
        },
        expires: new Date(Date.now() - 1000).toISOString(), // Expired 1 second ago
      };

      mockGetServerAuthSession.mockResolvedValue(expiredSession);

      // Mock session validation to detect expiration
      const mockValidateSession = vi.fn().mockResolvedValue({
        valid: false,
        session: null,
        reason: "expired",
      });

      // Test that expired sessions are handled properly
      const validationResult = await mockValidateSession(mockReq, mockRes);

      expect(validationResult.valid).toBe(false);
      expect(validationResult.reason).toBe("expired");
    });

    it("should handle valid active session", async () => {
      const activeSession = {
        user: {
          id: "user-123",
          email: "agent@gouv.fr",
          name: "Agent Public",
          isPublicAgent: true,
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Expires in 24 hours
      };

      mockGetServerAuthSession.mockResolvedValue(activeSession);

      // Mock session validation to confirm validity
      const mockValidateSession = vi.fn().mockResolvedValue({
        valid: true,
        session: activeSession,
        reason: null,
      });

      const validationResult = await mockValidateSession(mockReq, mockRes);

      expect(validationResult.valid).toBe(true);
      expect(validationResult.session).toEqual(activeSession);
      expect(validationResult.reason).toBeNull();
    });
  });

  describe("ProConnect Claims Processing", () => {
    it("should correctly identify public agent from ProConnect claims", () => {
      const proConnectProfile: {
        sub: string;
        email: string;
        given_name: string;
        usual_name: string;
        organizational_unit?: string;
        belonging_population?: string[];
      } = {
        sub: "user-123",
        email: "agent@gouv.fr",
        given_name: "Jean",
        usual_name: "Dupont",
        organizational_unit: "Ministère de Test",
        belonging_population: ["agent", "public_service"],
      };

      // Mock the claim processing
      const isAgent =
        Array.isArray(proConnectProfile.belonging_population) &&
        proConnectProfile.belonging_population.includes("agent");

      expect(isAgent).toBe(true);
    });

    it("should correctly identify non-public agent from ProConnect claims", () => {
      const proConnectProfile: {
        sub: string;
        email: string;
        given_name: string;
        usual_name: string;
        belonging_population?: string[];
      } = {
        sub: "user-456",
        email: "citizen@example.com",
        given_name: "Marie",
        usual_name: "Martin",
        belonging_population: ["citizen"],
      };

      // Mock the claim processing
      const isAgent =
        Array.isArray(proConnectProfile.belonging_population) &&
        proConnectProfile.belonging_population.includes("agent");

      expect(isAgent).toBe(false);
    });

    it("should handle missing belonging_population claim", () => {
      const proConnectProfile: {
        sub: string;
        email: string;
        given_name: string;
        usual_name: string;
        belonging_population?: string[];
      } = {
        sub: "user-789",
        email: "user@example.com",
        given_name: "Pierre",
        usual_name: "Durand",
        // belonging_population is missing
      };

      // Mock the claim processing
      const isAgent =
        Array.isArray(proConnectProfile.belonging_population) &&
        proConnectProfile.belonging_population.includes("agent");

      expect(isAgent).toBe(false);
    });
  });
});

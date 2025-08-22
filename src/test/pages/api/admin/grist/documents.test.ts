import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMocks } from "node-mocks-http";
import { NextApiRequest, NextApiResponse } from "next";

// Mock dependencies
vi.mock("../../../../../lib/auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("../../../../../lib/session-config", () => ({
  SESSION_CONFIG: {
    maxAge: 3600,
    updateAge: 300,
  },
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  })),
}));

vi.mock("../../../../../lib/encryption", () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  hashApiKey: vi.fn(),
  verifyApiKeyHash: vi.fn(),
}));

vi.mock("../../../../../lib/grist/client", () => ({
  gristApiClient: {
    getDocuments: vi.fn(),
    getTables: vi.fn(),
    validateApiKey: vi.fn(),
  },
}));

vi.mock("../../../../../pages/api/auth/[...nextauth]", () => ({
  authOptions: {},
}));

vi.mock("../../../../../lib/error-handling", () => ({
  withErrorHandling: vi.fn((handler) => handler),
  validateHttpMethod: vi.fn(() => true),
  AppErrorClass: class AppErrorClass extends Error {
    constructor(
      public type: string,
      message: string,
      public userMessage: string
    ) {
      super(message);
    }
  },
  ErrorType: {
    NOT_FOUND: "NOT_FOUND",
    VALIDATION_ERROR: "VALIDATION_ERROR",
    EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
    SERVER_ERROR: "SERVER_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
  },
}));

// Import after mocking
import handler from "../../../../../pages/api/admin/grist/documents";
import { requireAuth } from "../../../../../lib/auth";
import { PrismaClient } from "@prisma/client";
import { decrypt } from "../../../../../lib/encryption";
import { gristApiClient } from "../../../../../lib/grist/client";
import { GristDocument } from "../../../../../lib/grist/types";

describe("/api/admin/grist/documents", () => {
  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a new mock instance for each test
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
      },
      $disconnect: vi.fn(),
    };

    // Mock the PrismaClient constructor to return our mock
    vi.mocked(PrismaClient).mockImplementation(() => mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET", () => {
    it("should return documents for authenticated user with valid API key", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      const mockSession = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          isPublicAgent: true,
        },
        expires: "2024-12-31T23:59:59.999Z",
      };

      const mockUser = {
        gristApiKey: "encrypted_api_key",
        gristApiKeyHash: "api_key_hash",
      };

      const mockDocuments: GristDocument[] = [
        {
          id: "doc1",
          name: "Document 1",
          urlId: "doc1_url",
          access: "owners" as const,
        },
        {
          id: "doc2",
          name: "Document 2",
          urlId: "doc2_url",
          access: "editors" as const,
        },
      ];

      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(decrypt).mockReturnValue("decrypted_api_key");
      vi.mocked(gristApiClient.getDocuments).mockResolvedValue(mockDocuments);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      expect(JSON.parse(res._getData())).toEqual({
        documents: mockDocuments,
      });

      expect(vi.mocked(requireAuth)).toHaveBeenCalledWith(req, res, true);
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "user123" },
        select: {
          gristApiKey: true,
          gristApiKeyHash: true,
        },
      });
      expect(vi.mocked(decrypt)).toHaveBeenCalledWith("encrypted_api_key");
      expect(vi.mocked(gristApiClient.getDocuments)).toHaveBeenCalledWith(
        "decrypted_api_key"
      );
      expect(mockPrisma.$disconnect).toHaveBeenCalled();
    });

    it("should return 401 for unauthenticated user", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      vi.mocked(requireAuth).mockResolvedValue(undefined);

      await handler(req, res);

      expect(vi.mocked(requireAuth)).toHaveBeenCalledWith(req, res, true);
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
    });

    it("should return 404 when user not found in database", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      const mockSession = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          isPublicAgent: true,
        },
        expires: "2024-12-31T23:59:59.999Z",
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(404);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "User not found",
      });
    });

    it("should return 400 when user has no API key configured", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      const mockSession = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          isPublicAgent: true,
        },
        expires: "2024-12-31T23:59:59.999Z",
      };

      const mockUser = {
        gristApiKey: null,
        gristApiKeyHash: null,
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(400);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Grist API key not configured",
      });
    });

    it("should handle decryption errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      const mockSession = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          isPublicAgent: true,
        },
        expires: "2024-12-31T23:59:59.999Z",
      };

      const mockUser = {
        gristApiKey: "encrypted_api_key",
        gristApiKeyHash: "api_key_hash",
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(decrypt).mockImplementation(() => {
        throw new Error("Decryption failed");
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(500);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Failed to decrypt API key",
      });
    });

    it("should handle Grist API timeout errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      const mockSession = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          isPublicAgent: true,
        },
        expires: "2024-12-31T23:59:59.999Z",
      };

      const mockUser = {
        gristApiKey: "encrypted_api_key",
        gristApiKeyHash: "api_key_hash",
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(decrypt).mockReturnValue("decrypted_api_key");
      vi.mocked(gristApiClient.getDocuments).mockRejectedValue(
        new Error("Request timeout after 10000ms")
      );

      await handler(req, res);

      expect(res._getStatusCode()).toBe(502);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Grist API timeout",
      });
    });

    it("should handle Grist API authentication errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      const mockSession = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          isPublicAgent: true,
        },
        expires: "2024-12-31T23:59:59.999Z",
      };

      const mockUser = {
        gristApiKey: "encrypted_api_key",
        gristApiKeyHash: "api_key_hash",
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(decrypt).mockReturnValue("decrypted_api_key");
      vi.mocked(gristApiClient.getDocuments).mockRejectedValue(
        new Error("Failed to fetch documents: 401 Unauthorized")
      );

      await handler(req, res);

      expect(res._getStatusCode()).toBe(401);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Invalid or expired API key",
      });
    });

    it("should handle Grist API network errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      const mockSession = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          isPublicAgent: true,
        },
        expires: "2024-12-31T23:59:59.999Z",
      };

      const mockUser = {
        gristApiKey: "encrypted_api_key",
        gristApiKeyHash: "api_key_hash",
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(decrypt).mockReturnValue("decrypted_api_key");
      vi.mocked(gristApiClient.getDocuments).mockRejectedValue(
        new Error("Network error: fetch failed")
      );

      await handler(req, res);

      expect(res._getStatusCode()).toBe(502);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Network error",
      });
    });

    it("should handle generic Grist API errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      const mockSession = {
        user: {
          id: "user123",
          email: "test@example.com",
          name: "Test User",
          isPublicAgent: true,
        },
        expires: "2024-12-31T23:59:59.999Z",
      };

      const mockUser = {
        gristApiKey: "encrypted_api_key",
        gristApiKeyHash: "api_key_hash",
      };

      vi.mocked(requireAuth).mockResolvedValue(mockSession);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      vi.mocked(decrypt).mockReturnValue("decrypted_api_key");
      vi.mocked(gristApiClient.getDocuments).mockRejectedValue(
        new Error("Unknown Grist API error")
      );

      await handler(req, res);

      expect(res._getStatusCode()).toBe(502);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Failed to fetch documents from Grist",
      });
    });
  });

  describe("POST", () => {
    it("should return 405 for POST method", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Method not allowed",
      });
    });
  });

  describe("PUT", () => {
    it("should return 405 for PUT method", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "PUT",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Method not allowed",
      });
    });
  });

  describe("DELETE", () => {
    it("should return 405 for DELETE method", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      expect(JSON.parse(res._getData())).toMatchObject({
        error: "Method not allowed",
      });
    });
  });
});

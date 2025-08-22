import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createMocks } from "node-mocks-http";
import { NextApiRequest, NextApiResponse } from "next";

// Mock dependencies before importing the handler
vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn(() => ({
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    $disconnect: vi.fn(),
  })),
}));

vi.mock("../../../../lib/auth", () => ({
  requireAuth: vi.fn(),
}));

vi.mock("../../../../lib/encryption", () => ({
  encrypt: vi.fn(),
  decrypt: vi.fn(),
  hashApiKey: vi.fn(),
  verifyApiKeyHash: vi.fn(),
}));

vi.mock("../../../../lib/grist/client", () => ({
  gristApiClient: {
    validateApiKey: vi.fn(),
  },
}));

vi.mock("../../../../lib/error-handling", () => ({
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
  },
}));

// Import after mocking
import handler from "../../../../pages/api/admin/grist-api-key";
import { PrismaClient } from "@prisma/client";
import * as auth from "../../../../lib/auth";
import * as encryption from "../../../../lib/encryption";
import { gristApiClient } from "../../../../lib/grist/client";

describe("/api/admin/grist-api-key", () => {
  const mockSession = {
    user: {
      id: "user-123",
      email: "test@example.com",
      name: "Test User",
      isPublicAgent: true,
    },
    expires: "2024-12-31T23:59:59.999Z",
  };

  let mockPrisma: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create a new mock instance for each test
    mockPrisma = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      $disconnect: vi.fn(),
    };

    // Mock the PrismaClient constructor to return our mock
    vi.mocked(PrismaClient).mockImplementation(() => mockPrisma);

    // Set up default mocks
    vi.mocked(auth.requireAuth).mockResolvedValue(mockSession);
    vi.mocked(encryption.encrypt).mockReturnValue("encrypted-api-key");
    vi.mocked(encryption.decrypt).mockReturnValue("decrypted-api-key");
    vi.mocked(encryption.hashApiKey).mockReturnValue("hashed-api-key");
    vi.mocked(gristApiClient.validateApiKey).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("GET /api/admin/grist-api-key", () => {
    it("should return hasApiKey: false when user has no API key", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        gristApiKey: null,
        gristApiKeyHash: null,
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual({
        hasApiKey: false,
        isValid: undefined,
      });
    });

    it("should return hasApiKey: true and isValid: true when user has valid API key", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        gristApiKey: "encrypted-key",
        gristApiKeyHash: "key-hash",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual({
        hasApiKey: true,
        isValid: true,
      });

      expect(encryption.decrypt).toHaveBeenCalledWith("encrypted-key");
      expect(gristApiClient.validateApiKey).toHaveBeenCalledWith(
        "decrypted-api-key"
      );
    });

    it("should return hasApiKey: true and isValid: false when API key validation fails", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        gristApiKey: "encrypted-key",
        gristApiKeyHash: "key-hash",
      });

      vi.mocked(gristApiClient.validateApiKey).mockResolvedValue(false);

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual({
        hasApiKey: true,
        isValid: false,
      });
    });

    it("should return hasApiKey: true and isValid: false when decryption fails", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      mockPrisma.user.findUnique.mockResolvedValue({
        gristApiKey: "encrypted-key",
        gristApiKeyHash: "key-hash",
      });

      vi.mocked(encryption.decrypt).mockImplementation(() => {
        throw new Error("Decryption failed");
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual({
        hasApiKey: true,
        isValid: false,
      });
    });

    it("should return 401 when user is not authenticated", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "GET",
      });

      vi.mocked(auth.requireAuth).mockResolvedValue(undefined);

      await handler(req, res);

      expect(auth.requireAuth).toHaveBeenCalledWith(req, res, true);
    });

    it("should return 405 for unsupported HTTP methods", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "DELETE",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(405);
      const data = JSON.parse(res._getData());
      expect(data.error).toBe("Method not allowed");
    });
  });

  describe("POST /api/admin/grist-api-key", () => {
    it("should save valid API key successfully", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: "valid-grist-api-key",
        },
      });

      mockPrisma.user.update.mockResolvedValue({
        id: "user-123",
        gristApiKey: "encrypted-api-key",
        gristApiKeyHash: "hashed-api-key",
      });

      await handler(req, res);

      expect(res._getStatusCode()).toBe(200);
      const data = JSON.parse(res._getData());
      expect(data).toEqual({
        success: true,
        isValid: true,
        message: "Clé API sauvegardée avec succès",
      });

      expect(gristApiClient.validateApiKey).toHaveBeenCalledWith(
        "valid-grist-api-key"
      );
      expect(encryption.encrypt).toHaveBeenCalledWith("valid-grist-api-key");
      expect(encryption.hashApiKey).toHaveBeenCalledWith("valid-grist-api-key");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-123" },
        data: {
          gristApiKey: "encrypted-api-key",
          gristApiKeyHash: "hashed-api-key",
          updatedAt: expect.any(Date),
        },
      });
    });

    it("should reject invalid API key", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: "invalid-grist-api-key",
        },
      });

      vi.mocked(gristApiClient.validateApiKey).mockResolvedValue(false);

      await expect(handler(req, res)).rejects.toThrow();

      expect(gristApiClient.validateApiKey).toHaveBeenCalledWith(
        "invalid-grist-api-key"
      );
      expect(encryption.encrypt).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject empty API key", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: "",
        },
      });

      await expect(handler(req, res)).rejects.toThrow();

      expect(gristApiClient.validateApiKey).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject missing API key", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {},
      });

      await expect(handler(req, res)).rejects.toThrow();

      expect(gristApiClient.validateApiKey).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject non-string API key", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: 123,
        },
      });

      await expect(handler(req, res)).rejects.toThrow();

      expect(gristApiClient.validateApiKey).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should reject whitespace-only API key", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: "   ",
        },
      });

      await expect(handler(req, res)).rejects.toThrow();

      expect(gristApiClient.validateApiKey).not.toHaveBeenCalled();
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should return 401 when user is not authenticated", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: "valid-grist-api-key",
        },
      });

      vi.mocked(auth.requireAuth).mockResolvedValue(undefined);

      await handler(req, res);

      expect(auth.requireAuth).toHaveBeenCalledWith(req, res, true);
      expect(gristApiClient.validateApiKey).not.toHaveBeenCalled();
    });

    it("should handle Grist API timeout errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: "valid-grist-api-key",
        },
      });

      vi.mocked(gristApiClient.validateApiKey).mockRejectedValue(
        new Error("Request timeout after 10000ms")
      );

      await expect(handler(req, res)).rejects.toThrow();

      expect(gristApiClient.validateApiKey).toHaveBeenCalledWith(
        "valid-grist-api-key"
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle Grist API network errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: "valid-grist-api-key",
        },
      });

      vi.mocked(gristApiClient.validateApiKey).mockRejectedValue(
        new Error("Network error: fetch failed")
      );

      await expect(handler(req, res)).rejects.toThrow();

      expect(gristApiClient.validateApiKey).toHaveBeenCalledWith(
        "valid-grist-api-key"
      );
      expect(mockPrisma.user.update).not.toHaveBeenCalled();
    });

    it("should handle database errors", async () => {
      const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
        method: "POST",
        body: {
          apiKey: "valid-grist-api-key",
        },
      });

      mockPrisma.user.update.mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(handler(req, res)).rejects.toThrow();

      expect(gristApiClient.validateApiKey).toHaveBeenCalledWith(
        "valid-grist-api-key"
      );
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });
  });
});

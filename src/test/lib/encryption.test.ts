import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  encrypt,
  decrypt,
  hashApiKey,
  verifyApiKeyHash,
} from "../../lib/encryption";

describe("Encryption utilities", () => {
  const originalEnv = process.env.ENCRYPTION_KEY;
  const testEncryptionKey = "test-encryption-key-32-characters-long-minimum";

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = testEncryptionKey;
  });

  afterEach(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  describe("encrypt and decrypt", () => {
    it("should encrypt and decrypt text correctly", () => {
      const originalText = "test-api-key-12345";

      const encrypted = encrypt(originalText);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(originalText);
      expect(encrypted.length).toBeGreaterThan(0);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(originalText);
    });

    it("should produce different encrypted values for the same input", () => {
      const originalText = "test-api-key-12345";

      const encrypted1 = encrypt(originalText);
      const encrypted2 = encrypt(originalText);

      expect(encrypted1).not.toBe(encrypted2);

      // But both should decrypt to the same value
      expect(decrypt(encrypted1)).toBe(originalText);
      expect(decrypt(encrypted2)).toBe(originalText);
    });

    it("should handle empty strings", () => {
      const originalText = "";

      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it("should handle special characters and unicode", () => {
      const originalText = "test-key-with-special-chars-éàü-🔑-123";

      const encrypted = encrypt(originalText);
      const decrypted = decrypt(encrypted);

      expect(decrypted).toBe(originalText);
    });

    it("should throw error when ENCRYPTION_KEY is missing", () => {
      delete process.env.ENCRYPTION_KEY;

      expect(() => encrypt("test")).toThrow(
        "ENCRYPTION_KEY environment variable is required"
      );
    });

    it("should throw error when ENCRYPTION_KEY is too short", () => {
      process.env.ENCRYPTION_KEY = "short";

      expect(() => encrypt("test")).toThrow(
        "ENCRYPTION_KEY must be at least 32 characters long"
      );
    });

    it("should throw error when decrypting invalid data", () => {
      expect(() => decrypt("invalid-base64-data")).toThrow("Decryption failed");
    });

    it("should throw error when decrypting corrupted data", () => {
      const originalText = "test-api-key";
      const encrypted = encrypt(originalText);

      // Corrupt the encrypted data
      const corruptedData = encrypted.slice(0, -5) + "xxxxx";

      expect(() => decrypt(corruptedData)).toThrow("Decryption failed");
    });
  });

  describe("hashApiKey and verifyApiKeyHash", () => {
    it("should create consistent hashes for the same input", () => {
      const apiKey = "test-api-key-12345";

      const hash1 = hashApiKey(apiKey);
      const hash2 = hashApiKey(apiKey);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 produces 64 character hex string
    });

    it("should create different hashes for different inputs", () => {
      const apiKey1 = "test-api-key-1";
      const apiKey2 = "test-api-key-2";

      const hash1 = hashApiKey(apiKey1);
      const hash2 = hashApiKey(apiKey2);

      expect(hash1).not.toBe(hash2);
    });

    it("should verify API key against correct hash", () => {
      const apiKey = "test-api-key-12345";
      const hash = hashApiKey(apiKey);

      expect(verifyApiKeyHash(apiKey, hash)).toBe(true);
    });

    it("should reject API key against incorrect hash", () => {
      const apiKey1 = "test-api-key-1";
      const apiKey2 = "test-api-key-2";
      const hash1 = hashApiKey(apiKey1);

      expect(verifyApiKeyHash(apiKey2, hash1)).toBe(false);
    });

    it("should handle empty strings", () => {
      const emptyHash = hashApiKey("");

      expect(verifyApiKeyHash("", emptyHash)).toBe(true);
      expect(verifyApiKeyHash("not-empty", emptyHash)).toBe(false);
    });

    it("should be case sensitive", () => {
      const apiKey = "Test-API-Key";
      const hash = hashApiKey(apiKey);

      expect(verifyApiKeyHash(apiKey, hash)).toBe(true);
      expect(verifyApiKeyHash(apiKey.toLowerCase(), hash)).toBe(false);
    });
  });
});

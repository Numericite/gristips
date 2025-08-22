import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { GristApiClient } from "../../lib/grist/client";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("GristApiClient", () => {
  let client: GristApiClient;
  const mockApiKey = "test-api-key";

  beforeEach(() => {
    client = new GristApiClient("https://test.getgrist.com", 5000);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("validateApiKey", () => {
    it("should return true for valid API key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      const result = await client.validateApiKey(mockApiKey);

      expect(result).toBe(true);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.getgrist.com/api/orgs",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should return false for invalid API key", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await client.validateApiKey(mockApiKey);

      expect(result).toBe(false);
    });

    it("should return false when request fails", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const result = await client.validateApiKey(mockApiKey);

      expect(result).toBe(false);
    });
  });

  describe("getDocuments", () => {
    it("should fetch and return documents", async () => {
      const mockDocuments = [
        {
          id: "doc1",
          name: "Document 1",
          urlId: "doc1-url",
          access: "owners" as const,
        },
        {
          id: "doc2",
          name: "Document 2",
          urlId: "doc2-url",
          access: "editors" as const,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ docs: mockDocuments }),
      });

      const result = await client.getDocuments(mockApiKey);

      expect(result).toEqual(mockDocuments);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.getgrist.com/api/docs",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it("should throw error when request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        statusText: "Forbidden",
      });

      await expect(client.getDocuments(mockApiKey)).rejects.toThrow(
        "Failed to fetch documents: 403 Forbidden"
      );
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      await expect(client.getDocuments(mockApiKey)).rejects.toThrow(
        "Failed to fetch documents: Network error"
      );
    });
  });

  describe("getTables", () => {
    it("should fetch and return tables for a document", async () => {
      const mockTables = [
        {
          id: "table1",
          tableId: "Table1",
          columns: [
            {
              id: "col1",
              colId: "A",
              type: "Text" as const,
              label: "Column A",
              isFormula: false,
            },
          ],
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ tables: mockTables }),
      });

      const result = await client.getTables(mockApiKey, "doc1");

      expect(result).toEqual(mockTables);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.getgrist.com/api/docs/doc1/tables",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it("should throw error when request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(client.getTables(mockApiKey, "doc1")).rejects.toThrow(
        "Failed to fetch tables: 404 Not Found"
      );
    });
  });

  describe("getTableSchema", () => {
    it("should fetch and return columns for a table", async () => {
      const mockColumns = [
        {
          id: "col1",
          colId: "A",
          type: "Text" as const,
          label: "Column A",
          isFormula: false,
        },
        {
          id: "col2",
          colId: "B",
          type: "Numeric" as const,
          label: "Column B",
          isFormula: false,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ columns: mockColumns }),
      });

      const result = await client.getTableSchema(mockApiKey, "doc1", "table1");

      expect(result).toEqual(mockColumns);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.getgrist.com/api/docs/doc1/tables/table1/columns",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockApiKey}`,
          }),
        })
      );
    });

    it("should throw error when request fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      });

      await expect(
        client.getTableSchema(mockApiKey, "doc1", "table1")
      ).rejects.toThrow("Failed to fetch table schema: 404 Not Found");
    });
  });

  describe("timeout handling", () => {
    it("should timeout requests after specified duration", async () => {
      const slowClient = new GristApiClient("https://test.getgrist.com", 100);

      // Mock fetch to throw AbortError after timeout
      mockFetch.mockImplementationOnce(() => {
        return new Promise((_, reject) => {
          setTimeout(() => {
            const error = new Error("The operation was aborted");
            error.name = "AbortError";
            reject(error);
          }, 150);
        });
      });

      await expect(slowClient.getDocuments(mockApiKey)).rejects.toThrow(
        "Request timeout after 100ms"
      );
    });
  });

  describe("URL handling", () => {
    it("should handle base URL with trailing slash", () => {
      const clientWithSlash = new GristApiClient("https://test.getgrist.com/");

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
      });

      clientWithSlash.validateApiKey(mockApiKey);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://test.getgrist.com/api/orgs",
        expect.any(Object)
      );
    });
  });
});

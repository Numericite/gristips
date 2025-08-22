import { describe, it, expect, beforeEach, vi } from "vitest";
import { ExponentialBackoff } from "../../../lib/api/rate-limiting";

describe("ExponentialBackoff", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should execute function successfully on first try", async () => {
    const backoff = new ExponentialBackoff(3, 100, 1000);
    const mockFn = vi.fn().mockResolvedValue("success");

    const result = await backoff.execute(mockFn);

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should retry on retryable errors", async () => {
    const backoff = new ExponentialBackoff(3, 10, 100); // Short delays for testing
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue("success");

    const result = await backoff.execute(mockFn);

    expect(result).toBe("success");
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should not retry on non-retryable errors", async () => {
    const backoff = new ExponentialBackoff(3, 10, 100);
    const mockFn = vi.fn().mockRejectedValue(new Error("401 Unauthorized"));

    await expect(backoff.execute(mockFn)).rejects.toThrow("401 Unauthorized");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should throw after max attempts", async () => {
    const backoff = new ExponentialBackoff(2, 10, 100);
    const mockFn = vi.fn().mockRejectedValue(new Error("500 Server Error"));

    await expect(backoff.execute(mockFn)).rejects.toThrow("500 Server Error");
    expect(mockFn).toHaveBeenCalledTimes(2);
  });

  it("should identify retryable errors correctly", async () => {
    const backoff = new ExponentialBackoff(2, 10, 100);

    // Test timeout error
    const timeoutFn = vi.fn().mockRejectedValue(new Error("Request timeout"));
    await expect(backoff.execute(timeoutFn)).rejects.toThrow();
    expect(timeoutFn).toHaveBeenCalledTimes(2);

    // Reset for next test
    backoff.reset();

    // Test network error
    const networkFn = vi.fn().mockRejectedValue(new Error("network error"));
    await expect(backoff.execute(networkFn)).rejects.toThrow();
    expect(networkFn).toHaveBeenCalledTimes(2);

    // Reset for next test
    backoff.reset();

    // Test 500 error
    const serverFn = vi
      .fn()
      .mockRejectedValue(new Error("500 Internal Server Error"));
    await expect(backoff.execute(serverFn)).rejects.toThrow();
    expect(serverFn).toHaveBeenCalledTimes(2);

    // Reset for next test
    backoff.reset();

    // Test rate limit error
    const rateLimitFn = vi
      .fn()
      .mockRejectedValue(new Error("429 Too Many Requests"));
    await expect(backoff.execute(rateLimitFn)).rejects.toThrow();
    expect(rateLimitFn).toHaveBeenCalledTimes(2);
  });

  it("should reset attempt counter", async () => {
    const backoff = new ExponentialBackoff(3, 10, 100);
    const mockFn = vi
      .fn()
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue("success");

    await backoff.execute(mockFn);
    expect(backoff.getCurrentAttempt()).toBe(0); // Should be reset after success

    // Try again
    mockFn.mockClear();
    mockFn.mockResolvedValue("success again");

    const result = await backoff.execute(mockFn);
    expect(result).toBe("success again");
    expect(mockFn).toHaveBeenCalledTimes(1);
  });

  it("should track current attempt number", () => {
    const backoff = new ExponentialBackoff(3, 10, 100);

    expect(backoff.getCurrentAttempt()).toBe(0);
    expect(backoff.isMaxAttemptsReached()).toBe(false);
  });
});

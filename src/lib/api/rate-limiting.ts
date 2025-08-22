/**
 * Rate limiting utilities for Grist API calls
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  retryAfterMs?: number;
}

class RateLimiter {
  private requests = new Map<string, RateLimitEntry>();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  /**
   * Check if request is allowed for the given key
   */
  isAllowed(key: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const entry = this.requests.get(key);

    // Clean up expired entries
    this.cleanup();

    if (!entry) {
      // First request for this key
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return { allowed: true };
    }

    if (now >= entry.resetTime) {
      // Window has expired, reset
      this.requests.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      return { allowed: true };
    }

    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      return {
        allowed: false,
        retryAfter: this.config.retryAfterMs
          ? Math.ceil(this.config.retryAfterMs / 1000)
          : retryAfter,
      };
    }

    // Increment count
    entry.count++;
    return { allowed: true };
  }

  /**
   * Clean up expired entries
   */
  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now >= entry.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  reset(key: string) {
    this.requests.delete(key);
  }

  /**
   * Get current status for a key
   */
  getStatus(key: string): {
    count: number;
    remaining: number;
    resetTime: number;
  } {
    const entry = this.requests.get(key);
    const now = Date.now();

    if (!entry || now >= entry.resetTime) {
      return {
        count: 0,
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }

    return {
      count: entry.count,
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }
}

// Rate limiters for different types of operations
export const gristApiRateLimiter = new RateLimiter({
  maxRequests: 60, // 60 requests per minute per user
  windowMs: 60 * 1000, // 1 minute
  retryAfterMs: 5 * 1000, // Suggest retry after 5 seconds
});

export const gristValidationRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 API key validations per minute per user
  windowMs: 60 * 1000, // 1 minute
  retryAfterMs: 10 * 1000, // Suggest retry after 10 seconds
});

/**
 * Rate limiting middleware for API routes
 */
export function withRateLimit(
  rateLimiter: RateLimiter,
  keyGenerator: (userId: string, action?: string) => string = (userId) => userId
) {
  return function rateLimitMiddleware(
    userId: string,
    action?: string
  ): {
    allowed: boolean;
    retryAfter?: number;
    status?: { count: number; remaining: number; resetTime: number };
  } {
    const key = keyGenerator(userId, action);
    const result = rateLimiter.isAllowed(key);

    return {
      ...result,
      status: rateLimiter.getStatus(key),
    };
  };
}

/**
 * Exponential backoff utility for retrying failed requests
 */
export class ExponentialBackoff {
  private attempt = 0;
  private readonly maxAttempts: number;
  private readonly baseDelayMs: number;
  private readonly maxDelayMs: number;

  constructor(
    maxAttempts: number = 3,
    baseDelayMs: number = 1000,
    maxDelayMs: number = 30000
  ) {
    this.maxAttempts = maxAttempts;
    this.baseDelayMs = baseDelayMs;
    this.maxDelayMs = maxDelayMs;
  }

  /**
   * Execute function with exponential backoff retry
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    while (this.attempt < this.maxAttempts) {
      try {
        const result = await fn();
        this.reset();
        return result;
      } catch (error) {
        this.attempt++;

        if (this.attempt >= this.maxAttempts) {
          throw error;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }

        const delay = this.calculateDelay();
        await this.sleep(delay);
      }
    }

    throw new Error("Max retry attempts exceeded");
  }

  /**
   * Calculate delay for current attempt
   */
  private calculateDelay(): number {
    const delay = this.baseDelayMs * Math.pow(2, this.attempt - 1);
    const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
    return Math.min(delay + jitter, this.maxDelayMs);
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Network errors are retryable
      if (
        error.message.includes("timeout") ||
        error.message.includes("network") ||
        error.message.includes("ECONNRESET") ||
        error.message.includes("ENOTFOUND")
      ) {
        return true;
      }

      // HTTP 5xx errors are retryable
      if (
        error.message.includes("500") ||
        error.message.includes("502") ||
        error.message.includes("503") ||
        error.message.includes("504")
      ) {
        return true;
      }

      // Rate limit errors are retryable
      if (
        error.message.includes("429") ||
        error.message.includes("rate limit")
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Reset attempt counter
   */
  reset() {
    this.attempt = 0;
  }

  /**
   * Get current attempt number
   */
  getCurrentAttempt(): number {
    return this.attempt;
  }

  /**
   * Check if max attempts reached
   */
  isMaxAttemptsReached(): boolean {
    return this.attempt >= this.maxAttempts;
  }
}

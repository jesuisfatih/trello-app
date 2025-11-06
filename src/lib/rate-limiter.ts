interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(key: string): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const entry = this.limits.get(key);

    if (!entry || now >= entry.resetAt) {
      this.limits.set(key, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return { allowed: true };
    }

    if (entry.count >= this.config.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return { allowed: false, retryAfter };
    }

    entry.count++;
    return { allowed: true };
  }

  reset(key: string): void {
    this.limits.delete(key);
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (now >= entry.resetAt) {
        this.limits.delete(key);
      }
    }
  }
}

// Trello rate limits: 300/10s per key, 100/10s per token
export const trelloKeyLimiter = new RateLimiter({
  maxRequests: 300,
  windowMs: 10000,
});

export const trelloTokenLimiter = new RateLimiter({
  maxRequests: 100,
  windowMs: 10000,
});

// Cleanup every minute
setInterval(() => {
  trelloKeyLimiter.cleanup();
  trelloTokenLimiter.cleanup();
}, 60000);

export async function checkTrelloRateLimit(token: string): Promise<void> {
  const apiKey = process.env.TRELLO_API_KEY || '';
  
  const keyCheck = await trelloKeyLimiter.checkLimit(apiKey);
  if (!keyCheck.allowed) {
    throw new Error(`Rate limit exceeded for API key. Retry after ${keyCheck.retryAfter}s`);
  }

  const tokenCheck = await trelloTokenLimiter.checkLimit(token);
  if (!tokenCheck.allowed) {
    throw new Error(`Rate limit exceeded for token. Retry after ${tokenCheck.retryAfter}s`);
  }
}

export async function exponentialBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (error.message?.includes('Rate limit') && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}


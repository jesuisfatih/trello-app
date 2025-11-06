/**
 * Redis mock for future implementation
 * Replace with actual Redis client when ready
 */

class RedisMock {
  private data: Map<string, { value: string; expiresAt?: number }> = new Map();

  async get(key: string): Promise<string | null> {
    const entry = this.data.get(key);
    if (!entry) return null;

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.data.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: string, expiresInSeconds?: number): Promise<void> {
    const expiresAt = expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined;
    this.data.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.data.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.data.has(key);
  }
}

export const redis = new RedisMock();


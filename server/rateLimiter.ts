export interface RateLimitOptions {
  windowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

// In-memory store for fallback and local development
interface MemoryRecord {
  timestamps: number[];
}

const memoryStore = new Map<string, MemoryRecord>();

// Clean up stale memory store records periodically
let lastCleanup = Date.now();
function cleanupMemoryStore(now: number, maxWindowMs: number) {
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  for (const [key, record] of memoryStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < maxWindowMs);
    if (record.timestamps.length === 0) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Check rate limit using Upstash Redis REST API if available.
 */
async function checkRedisRateLimit(
  key: string,
  options: RateLimitOptions,
  url: string,
  token: string
): Promise<RateLimitResult | null> {
  try {
    // Upstash pipeline: INCR then EXPIRE if new key
    // Using simple Upstash REST endpoint
    const response = await fetch(`${url}/pipeline`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify([
        ['INCR', key],
        ['EXPIRE', key, options.windowSeconds, 'NX'],
        ['TTL', key],
      ]),
    });

    if (!response.ok) {
      return null;
    }

    const results = (await response.json()) as Array<{ result?: number }>;
    const count = typeof results[0]?.result === 'number' ? results[0].result : 1;
    const ttl = typeof results[2]?.result === 'number' && results[2].result > 0
      ? results[2].result
      : options.windowSeconds;

    const remaining = Math.max(0, options.maxRequests - count);
    const allowed = count <= options.maxRequests;

    return {
      allowed,
      limit: options.maxRequests,
      remaining,
      resetSeconds: ttl,
    };
  } catch (err) {
    console.error('Redis rate limit error, falling back to memory store');
    return null;
  }
}

/**
 * Check rate limit using in-memory sliding window.
 */
function checkMemoryRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  cleanupMemoryStore(now, windowMs);

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= options.maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      resetSeconds,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, options.maxRequests - record.timestamps.length);
  const resetSeconds = options.windowSeconds;

  return {
    allowed: true,
    limit: options.maxRequests,
    remaining,
    resetSeconds,
  };
}

/**
 * Rate limit a request by user ID or IP address.
 */
export async function checkRateLimit(
  identifier: string,
  prefix: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const key = `ratelimit:${prefix}:${identifier}`;

  const redisUrl = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

  if (redisUrl && redisToken) {
    const redisResult = await checkRedisRateLimit(key, options, redisUrl, redisToken);
    if (redisResult) {
      return redisResult;
    }
  }

  return checkMemoryRateLimit(key, options);
}

/**
 * Helper to extract client IP address from standard proxy headers.
 */
export function getClientIp(headers: Record<string, string | string[] | undefined>): string {
  const forwarded = headers['x-forwarded-for'];
  if (forwarded) {
    const ipList = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const firstIp = ipList.split(',')[0].trim();
    if (firstIp) return firstIp;
  }

  const realIp = headers['x-real-ip'];
  if (realIp) {
    return Array.isArray(realIp) ? realIp[0].trim() : realIp.trim();
  }

  return 'unknown-ip';
}

/**
 * Clear in-memory rate limit records (for testing).
 */
export function _resetMemoryRateLimits(): void {
  memoryStore.clear();
}

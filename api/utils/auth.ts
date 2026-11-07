import crypto from 'crypto';

export interface VerifiedUser {
  sub: string;
  email?: string;
  name?: string;
}

export type AuthResult =
  | { ok: true; user: VerifiedUser }
  | { ok: false; status: number; error: string };

interface GoogleJwk {
  kty: string;
  alg: string;
  use: string;
  kid: string;
  n: string;
  e: string;
}

interface GoogleJwksResponse {
  keys: GoogleJwk[];
}

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const CLOCK_SKEW_TOLERANCE_SEC = 60;

// In-memory JWKS cache
let cachedKeys: Map<string, GoogleJwk> = new Map();
let cacheExpiresAt = 0;

/**
 * Fetch and cache Google public signing keys.
 */
async function getGooglePublicKeys(forceRefresh = false): Promise<Map<string, GoogleJwk>> {
  const now = Date.now();
  if (!forceRefresh && cachedKeys.size > 0 && now < cacheExpiresAt) {
    return cachedKeys;
  }

  try {
    const res = await fetch(GOOGLE_CERTS_URL, {
      headers: { 'User-Agent': 'CoverCraft-Auth/1.0' },
    });
    if (!res.ok) {
      throw new Error(`Google certs endpoint returned ${res.status}`);
    }

    const data = (await res.json()) as GoogleJwksResponse;
    const nextMap = new Map<string, GoogleJwk>();
    for (const key of data.keys || []) {
      if (key.kid && key.kty === 'RSA') {
        nextMap.set(key.kid, key);
      }
    }

    // Parse Cache-Control header if present
    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const ttlSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

    cachedKeys = nextMap;
    cacheExpiresAt = now + Math.max(ttlSeconds, 300) * 1000;
    return cachedKeys;
  } catch (err) {
    // If refresh fails but we have stale keys, continue using stale keys
    if (cachedKeys.size > 0) {
      return cachedKeys;
    }
    throw err;
  }
}

/**
 * Reset JWKS cache (used in tests).
 */
export function _resetJwksCache(): void {
  cachedKeys = new Map();
  cacheExpiresAt = 0;
}

/**
 * Decode base64url string to Buffer.
 */
function base64UrlToBuffer(base64Url: string): Buffer {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return Buffer.from(base64, 'base64');
}

/**
 * Verify a Google ID token server-side.
 * Validates cryptographic signature, issuer, expiry, audience, and subject.
 */
export async function verifyGoogleToken(
  token: string,
  expectedClientId?: string
): Promise<AuthResult> {
  if (!token || typeof token !== 'string') {
    return { ok: false, status: 401, error: 'Authentication token is required.' };
  }

  const trimmed = token.trim();
  const parts = trimmed.split('.');

  // Audience validation
  const targetAudience = (
    expectedClientId ||
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  ).trim();

  if (!targetAudience) {
    // Server is missing configuration
    console.error('Google Client ID is not configured on the server.');
    return { ok: false, status: 500, error: 'Server authentication configuration is missing.' };
  }

  // Support Google OAuth access tokens (from useGoogleLogin / tokenClient flow)
  if (parts.length !== 3) {
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) {
        return { ok: false, status: 401, error: 'Invalid or expired Google access token.' };
      }
      const data = (await res.json()) as {
        aud?: string;
        sub?: string;
        user_id?: string;
        email?: string;
        exp?: string | number;
      };
      if (data.aud && data.aud !== targetAudience) {
        return { ok: false, status: 401, error: 'Token audience does not match this application.' };
      }
      return {
        ok: true,
        user: {
          sub: data.sub || data.user_id || 'google-user',
          email: data.email,
        },
      };
    } catch {
      return { ok: false, status: 401, error: 'Malformed authentication token.' };
    }
  }

  const [headerB64, payloadB64, signatureB64] = parts;

  let header: { alg?: string; kid?: string; typ?: string };
  let payload: {
    iss?: string;
    aud?: string;
    sub?: string;
    exp?: number;
    email?: string;
    name?: string;
    [key: string]: unknown;
  };

  try {
    header = JSON.parse(base64UrlToBuffer(headerB64).toString('utf8'));
    payload = JSON.parse(base64UrlToBuffer(payloadB64).toString('utf8'));
  } catch {
    return { ok: false, status: 401, error: 'Invalid token encoding.' };
  }

  if (header.alg !== 'RS256' || !header.kid) {
    return { ok: false, status: 401, error: 'Unsupported token algorithm or missing key id.' };
  }

  if (payload.aud !== targetAudience) {
    return { ok: false, status: 401, error: 'Token audience does not match this application.' };
  }

  // Issuer validation
  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (!payload.iss || !validIssuers.includes(payload.iss)) {
    return { ok: false, status: 401, error: 'Token issuer is not Google.' };
  }

  // Expiry validation
  if (typeof payload.exp !== 'number') {
    return { ok: false, status: 401, error: 'Token missing expiration timestamp.' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp + CLOCK_SKEW_TOLERANCE_SEC < nowSec) {
    return { ok: false, status: 401, error: 'Authentication token has expired. Please sign in again.' };
  }

  // Subject validation
  if (!payload.sub || typeof payload.sub !== 'string') {
    return { ok: false, status: 401, error: 'Token missing user identity subject.' };
  }

  // Cryptographic signature verification
  try {
    let keys = await getGooglePublicKeys();
    let jwk = keys.get(header.kid);

    // If key not found, refresh once in case of recent key rotation
    if (!jwk) {
      keys = await getGooglePublicKeys(true);
      jwk = keys.get(header.kid);
    }

    if (!jwk) {
      return { ok: false, status: 401, error: 'Token signed with unrecognized key.' };
    }

    const publicKey = crypto.createPublicKey({
      key: jwk as unknown as crypto.JsonWebKey,
      format: 'jwk',
    });

    const dataToVerify = Buffer.from(`${headerB64}.${payloadB64}`, 'utf8');
    const signature = base64UrlToBuffer(signatureB64);

    const isSignatureValid = crypto.verify('RSA-SHA256', dataToVerify, publicKey, signature);
    if (!isSignatureValid) {
      return { ok: false, status: 401, error: 'Token signature verification failed.' };
    }

    return {
      ok: true,
      user: {
        sub: payload.sub,
        email: typeof payload.email === 'string' ? payload.email : undefined,
        name: typeof payload.name === 'string' ? payload.name : undefined,
      },
    };
  } catch (err) {
    console.error('Error during token signature verification:', err instanceof Error ? err.message : 'Unknown');
    return { ok: false, status: 401, error: 'Failed to verify token signature.' };
  }
}

/**
 * Extract bearer token from standard Authorization header.
 */
export function extractBearerToken(authHeader?: string | string[]): string | null {
  if (!authHeader) return null;
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import dns from 'dns';
import net from 'net';

/* =========================================================================
   1. TYPES & CONSTANTS
   ========================================================================= */

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
const CLOCK_SKEW_TOLERANCE_SEC = 60;

const USER_RATE_LIMIT = { windowSeconds: 600, maxRequests: 20 };
const IP_RATE_LIMIT = { windowSeconds: 600, maxRequests: 40 };

const MAX_JOB_URL_TEXT_LENGTH = 12000;
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_REDIRECTS = 3;
const FETCH_TIMEOUT_MS = 8000; // 8 seconds

/* =========================================================================
   2. AUTHENTICATION
   ========================================================================= */

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

let cachedKeys: Map<string, GoogleJwk> = new Map();
let cacheExpiresAt = 0;

async function getGooglePublicKeys(forceRefresh = false): Promise<Map<string, GoogleJwk>> {
  const now = Date.now();
  if (!forceRefresh && cachedKeys.size > 0 && now < cacheExpiresAt) {
    return cachedKeys;
  }

  try {
    const res = await fetch(GOOGLE_CERTS_URL, {
      headers: { 'User-Agent': 'CoverCraft-Auth/1.0' },
    });
    if (!res.ok) throw new Error(`Google certs endpoint returned ${res.status}`);

    const data = (await res.json()) as GoogleJwksResponse;
    const nextMap = new Map<string, GoogleJwk>();
    for (const key of data.keys || []) {
      if (key.kid && key.kty === 'RSA') nextMap.set(key.kid, key);
    }

    const cacheControl = res.headers.get('cache-control') || '';
    const maxAgeMatch = cacheControl.match(/max-age=(\d+)/i);
    const ttlSeconds = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;

    cachedKeys = nextMap;
    cacheExpiresAt = now + Math.max(ttlSeconds, 300) * 1000;
    return cachedKeys;
  } catch (err) {
    if (cachedKeys.size > 0) return cachedKeys;
    throw err;
  }
}

function base64UrlToBuffer(base64Url: string): Buffer {
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) base64 += '=';
  return Buffer.from(base64, 'base64');
}

function extractBearerToken(authHeader?: string | string[]): string | null {
  if (!authHeader) return null;
  const header = Array.isArray(authHeader) ? authHeader[0] : authHeader;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

async function verifyGoogleToken(
  token: string
): Promise<{ ok: true; user: { sub: string; email?: string } } | { ok: false; status: number; error: string }> {
  if (!token || typeof token !== 'string') {
    return { ok: false, status: 401, error: 'Authentication token is required.' };
  }

  const trimmed = token.trim();
  const targetAudience = (
    process.env.GOOGLE_CLIENT_ID ||
    process.env.VITE_GOOGLE_CLIENT_ID ||
    ''
  ).trim();

  if (!targetAudience) {
    console.error('Google Client ID is not configured on the server.');
    return { ok: false, status: 500, error: 'Server authentication configuration is missing.' };
  }

  // Support Google OAuth access tokens (starts with ya29.)
  if (trimmed.startsWith('ya29.')) {
    try {
      const res = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(trimmed)}`
      );
      if (!res.ok) return { ok: false, status: 401, error: 'Invalid or expired Google access token.' };
      const data = (await res.json()) as { aud?: string; sub?: string; user_id?: string; email?: string };
      if (data.aud && data.aud !== targetAudience) {
        return { ok: false, status: 401, error: 'Token audience does not match this application.' };
      }
      return { ok: true, user: { sub: data.sub || data.user_id || 'google-user', email: data.email } };
    } catch {
      return { ok: false, status: 401, error: 'Malformed authentication token.' };
    }
  }

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return { ok: false, status: 401, error: 'Malformed authentication token.' };
  }

  const [headerB64, payloadB64, signatureB64] = parts;
  let header: { alg?: string; kid?: string };
  let payload: { iss?: string; aud?: string; sub?: string; exp?: number; email?: string };

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

  const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
  if (!payload.iss || !validIssuers.includes(payload.iss)) {
    return { ok: false, status: 401, error: 'Token issuer is not Google.' };
  }

  if (typeof payload.exp !== 'number') {
    return { ok: false, status: 401, error: 'Token missing expiration timestamp.' };
  }

  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp + CLOCK_SKEW_TOLERANCE_SEC < nowSec) {
    return { ok: false, status: 401, error: 'Authentication token has expired. Please sign in again.' };
  }

  if (!payload.sub || typeof payload.sub !== 'string') {
    return { ok: false, status: 401, error: 'Token missing user identity subject.' };
  }

  try {
    let keys = await getGooglePublicKeys();
    let jwk = keys.get(header.kid);
    if (!jwk) {
      keys = await getGooglePublicKeys(true);
      jwk = keys.get(header.kid);
    }

    if (!jwk) return { ok: false, status: 401, error: 'Token signed with unrecognized key.' };

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

    return { ok: true, user: { sub: payload.sub, email: typeof payload.email === 'string' ? payload.email : undefined } };
  } catch (err) {
    console.error('Error during token verification:', err instanceof Error ? err.message : 'Unknown');
    return { ok: false, status: 401, error: 'Failed to verify token signature.' };
  }
}

/* =========================================================================
   3. RATE LIMITING
   ========================================================================= */

interface MemoryRecord {
  timestamps: number[];
}
const memoryStore = new Map<string, MemoryRecord>();
let lastCleanup = Date.now();

function cleanupMemoryStore(now: number, maxWindowMs: number) {
  if (now - lastCleanup < 60000) return;
  lastCleanup = now;
  for (const [key, record] of memoryStore.entries()) {
    record.timestamps = record.timestamps.filter((ts) => now - ts < maxWindowMs);
    if (record.timestamps.length === 0) memoryStore.delete(key);
  }
}

async function checkRateLimit(
  identifier: string,
  prefix: string,
  options: { windowSeconds: number; maxRequests: number }
): Promise<{ allowed: boolean; resetSeconds: number }> {
  const key = `ratelimit:${prefix}:${identifier}`;
  const now = Date.now();
  const windowMs = options.windowSeconds * 1000;
  cleanupMemoryStore(now, windowMs);

  let record = memoryStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    memoryStore.set(key, record);
  }

  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= options.maxRequests) {
    const oldest = record.timestamps[0];
    const resetSeconds = Math.max(1, Math.ceil((oldest + windowMs - now) / 1000));
    return { allowed: false, resetSeconds };
  }

  record.timestamps.push(now);
  return { allowed: true, resetSeconds: options.windowSeconds };
}

function getClientIp(headers: Record<string, string | string[] | undefined>): string {
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

/* =========================================================================
   4. SSRF DEFENSE & HTML TEXT EXTRACTION
   ========================================================================= */

function validateUrlSyntax(inputUrl: string): URL {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('A valid job posting URL is required.');
  }

  let parsed: URL;
  try {
    parsed = new URL(inputUrl.trim());
  } catch {
    throw new Error('Malformed URL format.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed for security.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing credentials are not permitted.');
  }
  if (parsed.port && parsed.port !== '443') {
    throw new Error('Non-standard network ports are not permitted.');
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data'
  ) {
    throw new Error('Access to local or private network hostnames is prohibited.');
  }

  return parsed;
}

function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) return true;
  const [b0, b1] = parts;
  if (b0 === 0 || b0 === 10 || b0 === 127) return true;
  if (b0 === 169 && b1 === 254) return true;
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
  if (b0 === 192 && b1 === 168) return true;
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;
  if (b0 >= 224) return true;
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::1' || normalized === '::') return true;
  if (normalized.startsWith('::ffff:')) {
    const rest = normalized.slice(7);
    if (net.isIPv4(rest)) return isPrivateIPv4(rest);
  }
  if (/^fe[89ab]/i.test(normalized) || /^f[cd]/i.test(normalized)) return true;
  if (normalized.startsWith('100:') || normalized.startsWith('2001:db8:')) return true;
  return false;
}

function isPrivateOrBlockedIp(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  if (net.isIPv6(ip)) return isPrivateIPv6(ip);
  return true;
}

async function resolveAndVerifyHostname(hostname: string): Promise<string> {
  const lookup = await dns.promises.lookup(hostname, { all: true });
  if (!lookup || lookup.length === 0) {
    throw new Error('Could not resolve destination hostname.');
  }

  for (const entry of lookup) {
    if (isPrivateOrBlockedIp(entry.address)) {
      throw new Error('Access to private or local network IP addresses is prohibited.');
    }
  }

  return lookup[0].address;
}

function extractPageText(html: string): string {
  let cleaned = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  cleaned = cleaned.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  cleaned = cleaned.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ');
  cleaned = cleaned.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');
  cleaned = cleaned.replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, ' ');
  cleaned = cleaned.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');

  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
  cleaned = cleaned.replace(/<\/(p|div|li|h[1-6]|tr|article|section)>/gi, '\n');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');

  cleaned = cleaned
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

  cleaned = cleaned
    .split('\n')
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter((l) => l.length > 0)
    .join('\n');

  if (cleaned.length > MAX_JOB_URL_TEXT_LENGTH) {
    cleaned = cleaned.slice(0, MAX_JOB_URL_TEXT_LENGTH);
  }

  return cleaned.trim();
}

async function safeFetchJobPosting(initialUrl: string): Promise<{ text: string; url: string }> {
  let currentUrl = initialUrl;
  let redirectsCount = 0;

  while (redirectsCount <= MAX_REDIRECTS) {
    const parsed = validateUrlSyntax(currentUrl);
    await resolveAndVerifyHostname(parsed.hostname);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 CoverCraft-Reader/2.0',
          Accept: 'text/html,application/xhtml+xml,text/plain;q=0.9',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'manual',
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr instanceof Error && fetchErr.name === 'AbortError') {
        throw new Error('Connection timed out while trying to reach the job posting.');
      }
      throw new Error('Failed to connect to the provided URL.');
    } finally {
      clearTimeout(timeoutId);
    }

    if ([301, 302, 303, 307, 308].includes(res.status)) {
      const location = res.headers.get('location');
      if (!location) throw new Error('Redirect missing location header.');
      const nextUrl = new URL(location, currentUrl).toString();
      currentUrl = nextUrl;
      redirectsCount++;
      continue;
    }

    if (!res.ok) {
      throw new Error(`Job posting page returned HTTP ${res.status}.`);
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
      throw new Error('Destination URL did not return a readable text or HTML web page.');
    }

    const html = await res.text();
    if (Buffer.byteLength(html, 'utf8') > MAX_RESPONSE_BYTES) {
      throw new Error('Web page content exceeds maximum allowed download size (2 MB).');
    }

    const text = extractPageText(html);
    if (!text || text.length < 50) {
      throw new Error(
        'Could not find readable job description text at this URL. The page may require JavaScript or sign-in.'
      );
    }

    return { text, url: currentUrl };
  }

  throw new Error(`Exceeded maximum allowed redirects (${MAX_REDIRECTS}).`);
}

/* =========================================================================
   5. SERVERLESS HANDLER
   ========================================================================= */

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  // 1. Google ID token authentication
  const token = extractBearerToken(req.headers.authorization);
  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
    return;
  }

  const authResult = await verifyGoogleToken(token);
  if (!authResult.ok) {
    const failure = authResult as { ok: false; status: number; error: string };
    res.status(failure.status).json({ error: failure.error });
    return;
  }

  const userSub = authResult.user.sub;
  const clientIp = getClientIp(req.headers as Record<string, string | string[] | undefined>);

  // 2. Rate limiting by user sub and client IP
  const userRateCheck = await checkRateLimit(userSub, 'fetch_url_user', USER_RATE_LIMIT);
  if (!userRateCheck.allowed) {
    res.setHeader('Retry-After', String(userRateCheck.resetSeconds));
    res.status(429).json({
      error: 'You have reached the URL fetch rate limit. Please wait a few minutes.',
      retryAfter: userRateCheck.resetSeconds,
    });
    return;
  }

  const ipRateCheck = await checkRateLimit(clientIp, 'fetch_url_ip', IP_RATE_LIMIT);
  if (!ipRateCheck.allowed) {
    res.setHeader('Retry-After', String(ipRateCheck.resetSeconds));
    res.status(429).json({
      error: 'Too many URL fetch requests from this network address. Please wait a few minutes.',
      retryAfter: ipRateCheck.resetSeconds,
    });
    return;
  }

  // 3. Payload validation
  const body = req.body || {};
  const url = typeof body.url === 'string' ? body.url.trim() : '';

  if (!url) {
    res.status(400).json({ error: 'A valid "url" field is required in the request body.' });
    return;
  }

  // 4. Safe fetch execution with SSRF defense
  try {
    const result = await safeFetchJobPosting(url);
    res.status(200).json({ text: result.text, url: result.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch job description from URL.';
    res.status(400).json({ error: message });
  }
}

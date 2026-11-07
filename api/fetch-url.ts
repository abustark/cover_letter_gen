import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractBearerToken, verifyGoogleToken } from './utils/auth';
import { checkRateLimit, getClientIp } from './utils/rateLimiter';
import { safeFetchJobPosting } from './utils/urlSecurity';

// URL fetch quotas: 20 per 10 min per user, 40 per 10 min per IP
const USER_RATE_LIMIT = { windowSeconds: 600, maxRequests: 20 };
const IP_RATE_LIMIT = { windowSeconds: 600, maxRequests: 40 };

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
    const errorResult = authResult as { ok: false; status: number; error: string };
    res.status(errorResult.status).json({ error: errorResult.error });
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

  // 3. Validate input
  const { url } = (req.body || {}) as { url?: string };
  if (!url || typeof url !== 'string' || !url.trim()) {
    res.status(400).json({ error: 'A valid job posting URL is required.' });
    return;
  }

  // 4. Safely fetch job posting with full SSRF, redirect, timeout, and size limits
  try {
    const result = await safeFetchJobPosting(url.trim());
    res.status(200).json({
      text: result.text,
      url: result.url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Could not fetch job posting.';
    console.error('Safe URL fetch error:', message);

    // Differentiate client validation errors from fetch failures
    if (
      message.includes('Malformed URL') ||
      message.includes('Only HTTPS') ||
      message.includes('credentials') ||
      message.includes('ports') ||
      message.includes('prohibited') ||
      message.includes('restricted') ||
      message.includes('did not return an HTML')
    ) {
      res.status(400).json({ error: message });
      return;
    }

    res.status(502).json({
      error: 'Could not read the job description from that URL. Please paste the job description text directly.',
    });
  }
}

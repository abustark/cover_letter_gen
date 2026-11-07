import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractBearerToken, verifyGoogleToken } from './utils/auth';
import { checkRateLimit, getClientIp } from './utils/rateLimiter';
import {
  buildCoverLetterPrompts,
  buildResumeFormattingPrompt,
  validateFormatPayload,
  validateGenerationPayload,
} from './utils/prompts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// AI generation quotas: 15 per 10 min per user, 30 per 10 min per IP
const USER_RATE_LIMIT = { windowSeconds: 600, maxRequests: 15 };
const IP_RATE_LIMIT = { windowSeconds: 600, maxRequests: 30 };

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
  const userRateCheck = await checkRateLimit(userSub, 'ai_gen_user', USER_RATE_LIMIT);
  if (!userRateCheck.allowed) {
    res.setHeader('Retry-After', String(userRateCheck.resetSeconds));
    res.status(429).json({
      error: 'You have reached the generation rate limit. Please wait a few minutes before trying again.',
      retryAfter: userRateCheck.resetSeconds,
    });
    return;
  }

  const ipRateCheck = await checkRateLimit(clientIp, 'ai_gen_ip', IP_RATE_LIMIT);
  if (!ipRateCheck.allowed) {
    res.setHeader('Retry-After', String(ipRateCheck.resetSeconds));
    res.status(429).json({
      error: 'Too many requests from this network address. Please wait a few minutes.',
      retryAfter: ipRateCheck.resetSeconds,
    });
    return;
  }

  // 3. Reject legacy or permissive arbitrary message contracts
  const body = req.body || {};
  if (body.messages !== undefined || (body.model !== undefined && body.type === undefined)) {
    res.status(400).json({
      error: 'Arbitrary model or message arrays are not accepted. Use structured generation requests.',
    });
    return;
  }

  // 4. Validate structured request and construct server-controlled prompts
  let systemPrompt: string;
  let userPrompt: string;
  let model: string;

  try {
    if (body.type === 'format') {
      const validated = validateFormatPayload(body);
      const built = buildResumeFormattingPrompt(validated.rawText);
      systemPrompt = built.systemPrompt;
      userPrompt = built.userPrompt;
      model = built.model;
    } else {
      const validated = validateGenerationPayload(body);
      const built = buildCoverLetterPrompts(validated);
      systemPrompt = built.systemPrompt;
      userPrompt = built.userPrompt;
      model = built.model;
    }
  } catch (validationErr) {
    const msg = validationErr instanceof Error ? validationErr.message : 'Invalid request payload.';
    res.status(400).json({ error: msg });
    return;
  }

  // 5. OpenRouter API key configuration
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not configured on the server.');
    res.status(500).json({ error: 'AI service configuration is missing on the server.' });
    return;
  }

  // 6. Call OpenRouter with strictly controlled parameters
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://covercraft.app',
        'X-Title': 'CoverCraft',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      console.error('OpenRouter upstream error status:', response.status);
      if (response.status === 429) {
        res.status(429).json({ error: 'Upstream AI provider rate limit reached. Please retry in a few seconds.' });
        return;
      }
      res.status(502).json({ error: 'AI generation service is temporarily unavailable. Please try again.' });
      return;
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
      res.status(502).json({ error: 'The AI service returned an empty response. Please try again.' });
      return;
    }

    res.status(200).json({ text: content.trim() });
  } catch (err) {
    console.error('AI generation proxy error:', err instanceof Error ? err.message : 'Unknown');
    res.status(500).json({ error: 'Failed to communicate with the AI service.' });
  }
}

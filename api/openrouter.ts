import type { VercelRequest, VercelResponse } from '@vercel/node';
import { extractBearerToken, verifyGoogleToken } from './_utils/auth.ts';
import { checkRateLimit, getClientIp } from './_utils/rateLimiter.ts';
import {
  buildCoverLetterPrompts,
  buildResumeFormattingPrompt,
  validateFormatPayload,
  validateGenerationPayload,
} from './_utils/prompts.ts';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Verified free models used as resilient fallbacks if an upstream provider experiences a temporary pool outage
const FALLBACK_CANDIDATES = [
  'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nvidia/nemotron-3.5-super-vl:free',
  'nvidia/nemotron-3.5-lightning:free',
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free',
  'google/gemma-4-31b-it:free',
];

// AI generation quotas: 15 per 10 min per user, 30 per 10 min per IP
const USER_RATE_LIMIT = { windowSeconds: 600, maxRequests: 15 };
const IP_RATE_LIMIT = { windowSeconds: 600, maxRequests: 30 };

async function callOpenRouter(
  targetModel: string,
  apiKey: string,
  systemPrompt: string,
  userPrompt: string
): Promise<{ ok: true; content: string } | { ok: false; status: number; message: string }> {
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
        model: targetModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 3072,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let msg = '';
      try {
        const errJson = JSON.parse(errText);
        msg = errJson?.error?.message || errText;
      } catch {
        msg = errText;
      }
      return { ok: false, status: response.status, message: msg };
    }

    const data = await response.json();
    const rawContent = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
    const content = typeof rawContent === 'string' ? rawContent.trim() : '';
    if (!content) {
      return { ok: false, status: 502, message: 'Empty response returned from upstream provider.' };
    }

    return { ok: true, content };
  } catch (err) {
    return { ok: false, status: 500, message: err instanceof Error ? err.message : 'Network error' };
  }
}

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

  // 6. Call OpenRouter with strictly controlled parameters and resilient model fallbacks
  const modelsToTry = [model, ...FALLBACK_CANDIDATES.filter((m) => m !== model)];
  let lastStatus = 502;
  let lastMessage = '';

  for (const candidate of modelsToTry) {
    const result = await callOpenRouter(candidate, apiKey, systemPrompt, userPrompt);
    if (result.ok) {
      res.status(200).json({ text: result.content });
      return;
    }

    const failure = result as { ok: false; status: number; message: string };
    console.warn(`Model ${candidate} failed (${failure.status}): ${failure.message}`);
    lastStatus = failure.status;
    lastMessage = failure.message;

    // If client was unauthorized or forbidden, do not cycle through other models
    if (failure.status === 401 || failure.status === 403) {
      res.status(500).json({ error: 'AI service authorization error. Please contact the administrator.' });
      return;
    }
  }

  // If all candidate models in the pool were exhausted
  if (lastStatus === 429) {
    res.status(429).json({
      error: 'Upstream free AI model pools are temporarily busy. Please wait a few seconds and retry.',
    });
    return;
  }

  res.status(502).json({
    error: 'AI generation service is temporarily unavailable. Please try again in a moment.',
  });
}

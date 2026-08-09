import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY is not set on the server.');
    res.status(500).json({ error: 'Server is missing the API key configuration.' });
    return;
  }

  const { model, messages } = (req.body || {}) as { model?: string; messages?: OpenRouterMessage[] };
  if (!model || !Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'model and messages are required.' });
    return;
  }

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://covercraft.app',
        'X-Title': 'CoverCraft',
      },
      body: JSON.stringify({ model, messages, temperature: 0.7 }),
    });

    const data = await response.json();
    if (!response.ok) {
      const message = data?.error?.message || `OpenRouter request failed (${response.status}).`;
      res.status(response.status).json({ error: message });
      return;
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content) {
      res.status(502).json({ error: 'OpenRouter returned an empty response.' });
      return;
    }

    res.status(200).json({ text: content });
  } catch (err) {
    console.error('OpenRouter proxy error:', err);
    res.status(500).json({ error: 'Failed to communicate with the AI API.' });
  }
}

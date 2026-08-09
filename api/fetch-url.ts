import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const { url } = (req.body || {}) as { url?: string };
  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'url is required.' });
    return;
  }

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'CoverCraft/1.0 (+https://covercraft.app)' },
    });
    if (!response.ok) {
      res.status(502).json({ error: `URL fetch failed (${response.status}).` });
      return;
    }
    const html = await response.text();
    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/\s+/g, ' ')
      .trim();

    res.status(200).json({ text: text.slice(0, 12000) });
  } catch (err) {
    console.error('Failed to fetch job description from URL:', err);
    res.status(502).json({ error: 'Could not read the job description from that URL.' });
  }
}

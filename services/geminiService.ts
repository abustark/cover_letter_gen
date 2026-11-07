import { GenerationMode, JobDescriptionInputType, Tone } from '../types';

export interface GenerationResult {
  text: string;
}

interface OpenRouterApiResponse {
  text?: string;
  error?: string;
}

interface FetchUrlApiResponse {
  text?: string;
  url?: string;
  error?: string;
}

/**
 * Fetch and extract readable job description from a URL via the secure server proxy.
 * The server handles SSRF prevention, redirect validation, and CORS bypassing.
 */
export const fetchJobDescriptionFromUrl = async (
  url: string,
  token: string
): Promise<string> => {
  if (!token) {
    throw new Error('Please sign in with Google to read job postings from URLs.');
  }

  try {
    const res = await fetch('/api/fetch-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });

    const data = (await res.json().catch(() => null)) as FetchUrlApiResponse | null;

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error('Your session has expired. Please sign in again with Google.');
      }
      if (res.status === 429) {
        throw new Error(data?.error || 'URL fetch rate limit reached. Please wait a few minutes.');
      }
      throw new Error(data?.error || `Could not read the job description from that URL (${res.status}).`);
    }

    if (!data?.text) {
      throw new Error('No readable text content found at the provided URL.');
    }

    return data.text;
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Could not read the job description from that URL. Please paste the text directly.');
  }
};

/**
 * Generate a tailored cover letter via the server-controlled AI proxy.
 * Prompts, model allowlists, and factuality constraints are enforced server-side.
 */
export const generateCoverLetter = async (
  resume: string,
  jobInput: { type: JobDescriptionInputType; value: string },
  mode: GenerationMode,
  tone: Tone,
  token: string,
  companyName?: string
): Promise<GenerationResult> => {
  if (!token) {
    throw new Error('Please sign in with Google to generate your cover letter.');
  }

  let finalJobDescription = jobInput.value;
  let jobUrl: string | undefined;

  if (jobInput.type === JobDescriptionInputType.Url) {
    jobUrl = jobInput.value;
    finalJobDescription = await fetchJobDescriptionFromUrl(jobInput.value, token);
  }

  const response = await fetch('/api/openrouter', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      type: 'generate',
      resume,
      jobDescription: finalJobDescription,
      mode,
      tone,
      companyName: companyName?.trim() || undefined,
      jobUrl,
    }),
  });

  const data = (await response.json().catch(() => null)) as OpenRouterApiResponse | null;

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Your session has expired. Please sign in again with Google.');
    }
    if (response.status === 429) {
      throw new Error(data?.error || 'Generation rate limit reached. Please wait a few moments.');
    }
    throw new Error(data?.error || `Cover letter generation failed (${response.status}).`);
  }

  const content = data?.text;
  if (!content) {
    throw new Error('The AI service returned an empty response. Please try again.');
  }

  return { text: content };
};

/**
 * Reformat raw resume text into structured sections via the server proxy.
 */
export const formatResumeText = async (rawText: string, token: string): Promise<string> => {
  if (!rawText.trim()) {
    return '';
  }

  if (!token) {
    // If user is not yet signed in, return raw text gracefully
    return rawText;
  }

  try {
    const response = await fetch('/api/openrouter', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type: 'format',
        rawText,
      }),
    });

    if (!response.ok) {
      return rawText;
    }

    const data = (await response.json().catch(() => null)) as OpenRouterApiResponse | null;
    return data?.text?.trim() || rawText;
  } catch {
    return rawText;
  }
};

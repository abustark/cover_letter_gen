import { GenerationMode, JobDescriptionInputType, Tone } from '../types';

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Free-tier OpenRouter models. Gemma 4 (Neutron/Gemma open family) is the
// primary engine for resume/cover-letter generation; a larger 70B model is
// used for the higher-quality "Thinking" mode.
// Free-tier OpenRouter models. Assignments chosen per use case (all verified
// reachable + free):
//  - nemotron-3-ultra-550b: frontier reasoning, 1M ctx -> best-quality writing.
//  - nemotron-3-super-120b: reasoning MoE, 1M ctx -> Thinking mode.
//  - gemma-4-26b-a4b: fast MoE (3.8B active) -> latency + formatting utility.
const MODELS = {
    // Primary writing engine — highest quality, 1M context.
    standard: "nvidia/nemotron-3-ultra-550b-a55b:free",
    // Fast engine for quick generations.
    lowLatency: "google/gemma-4-26b-a4b-it:free",
    // Reasoning-focused model for deeper tailoring.
    thinking: "nvidia/nemotron-3-super-120b-a12b:free",
    // URL mode reuses the top engine (1M ctx fits long extracted pages).
    url: "nvidia/nemotron-3-ultra-550b-a55b:free",
    // Utility formatting task — speed over max quality.
    formatting: "google/gemma-4-26b-a4b-it:free",
};

const PROMPT_TEMPLATE_TEXT = `
You are a world-class professional career coach. Your task is to write a highly professional, concise, and compelling cover letter.

The cover letter must be tailored specifically to the provided job description, using the candidate's resume to highlight the most relevant skills and experiences.

**TONE REQUIREMENT:**
You must write this cover letter with a **{tone}** tone.
- If Professional: Formal, respectful, polished.
- If Enthusiastic: High energy, passionate, eager.
- If Confident: Assertive, leadership-focused, authoritative.
- If Creative: Unique phrasing, storytelling, engaging.

Follow these instructions:
1.  **Analyze Both Documents:** Carefully read and understand the resume and the job description.
2.  **Identify Keywords:** Extract key skills, qualifications, and requirements from the job description.
3.  **Match Experience:** Find specific examples from the resume that demonstrate these keywords and qualifications.
4.  **Structure the Letter:**
    *   **Introduction:** Briefly introduce the candidate and the position they are applying for. Express enthusiasm for the role and the company.
    *   **Body Paragraph(s):** Create 1-2 paragraphs that connect the candidate's top 2-3 qualifications directly to the job's requirements. Use quantifiable achievements from the resume where possible (e.g., "Increased sales by 15%").
    *   **Conclusion:** Reiterate interest, express confidence in their ability to contribute, and include a strong call to action (e.g., "I am eager to discuss how my background in...").
5.  **No Placeholders:** **DO NOT** include placeholders like "[Your Name]" or "[Company Name]". Assume the letter is ready to be signed.

Here is the candidate's resume:
---
RESUME:
{resume}
---

Here is a job description:
---
JOB DESCRIPTION:
{jobDescription}
---

Now, generate ONLY the cover letter content. Do not include any preamble, analysis, headers, or a list of sources in your response.
`;

const PROMPT_TEMPLATE_URL = `
You are a world-class professional career coach. Your task is to write a highly professional, concise, and compelling cover letter.

A web researcher has already extracted the full job description from the provided URL and supplied it below. Use that extracted job description and the candidate's resume to write a cover letter highlighting the most relevant skills and experiences.

Extracted job description source URL: {jobUrl}

**TONE REQUIREMENT:**
You must write this cover letter with a **{tone}** tone.

Follow these instructions for the cover letter:
1.  **Structure the Letter:**
    *   **Introduction:** Briefly introduce the candidate and the position they are applying for. Express enthusiasm for the role and the company.
    *   **Body Paragraph(s):** Create 1-2 paragraphs that connect the candidate's top 2-3 qualifications directly to the job's requirements. Use quantifiable achievements from the resume where possible (e.g., "Increased sales by 15%").
    *   **Conclusion:** Reiterate interest, express confidence in their ability to contribute, and include a strong call to action (e.g., "I am eager to discuss how my background in...").
2.  **No Placeholders:** **DO NOT** include placeholders like "[Your Name]" or "[Company Name]". Assume the letter is ready to be signed.

Here is the candidate's resume:
---
RESUME:
{resume}
---

Now, generate ONLY the cover letter content. Do not include any preamble, analysis, headers, or a list of sources in your response.
`;

const RESUME_FORMATTING_PROMPT = `
You are an expert text formatter specializing in resumes. Your task is to take a block of raw, unstructured text extracted from a resume document and reformat it for clarity and readability within a simple text editor.

Follow these rules precisely:
1.  Identify logical sections such as Professional Summary, Work Experience, Education, Skills, Projects, etc.
2.  Create clear headings for each section. Mark each heading by surrounding it with three dashes, like so: "--- Work Experience ---".
3.  Use consistent spacing. Add a single blank line between the heading and its content, and between distinct entries (like different jobs or projects).
4.  For lists of skills or responsibilities, use a simple hyphen (-) or asterisk (*) to denote bullet points.
5.  Preserve all the original content. Do not add, remove, or change the original text, only structure and format it.
6.  The output must be a single string of plain text, perfectly formatted for a textarea input.

Here is the raw text to format:
---
RAW TEXT:
{rawText}
---

Now, produce the formatted resume text.
`;

interface OpenRouterMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

const callOpenRouter = async (model: string, messages: OpenRouterMessage[]): Promise<string> => {
    // Local dev: call OpenRouter directly using the key injected by vite.
    // Production: route through the Vercel serverless proxy so the key never
    // ships in the client bundle.
    if (import.meta.env.DEV) {
        const apiKey = process.env.OPENROUTER_API_KEY || process.env.API_KEY;
        if (!apiKey) {
            throw new Error("OPENROUTER_API_KEY is not set. Add it to .env.local (see .env.example).");
        }
        const response = await fetch(OPENROUTER_URL, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "https://covercraft.app",
                "X-Title": "CoverCraft",
            },
            body: JSON.stringify({ model, messages, temperature: 0.7 }),
        });
        return parseOpenRouterResponse(response);
    }

    const response = await fetch("/api/openrouter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages }),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || `OpenRouter request failed (${response.status}).`);
    }

    const data = await response.json();
    const content = data?.text;
    if (!content) {
        throw new Error("OpenRouter returned an empty response.");
    }
    return content;
};

const parseOpenRouterResponse = async (response: Response): Promise<string> => {
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenRouter request failed (${response.status}): ${errorBody}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
        throw new Error("OpenRouter returned an empty response.");
    }

    return content;
};

// Fetch + extract a job page. In production this runs server-side through the
// Vercel proxy so CORS-protected sites (LinkedIn, etc.) can be read; in dev we
// fetch directly since the browser is not running the serverless functions.
const fetchJobDescriptionFromUrl = async (url: string): Promise<string> => {
    try {
        if (import.meta.env.DEV) {
            const res = await fetch(url, { headers: { "User-Agent": "CoverCraft/1.0 (+https://covercraft.app)" } });
            if (!res.ok) {
                throw new Error(`URL fetch failed (${res.status})`);
            }
            const html = await res.text();
            return extractPageText(html);
        }

        const res = await fetch("/api/fetch-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url }),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => null);
            throw new Error(data?.error || `URL fetch failed (${res.status})`);
        }
        const data = await res.json();
        return data?.text || "";
    } catch (err) {
        console.error("Failed to fetch job description from URL:", err);
        throw new Error("Could not read the job description from that URL. Please paste the text directly instead.");
    }
};

const extractPageText = (html: string): string => {
    const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">")
        .replace(/\s+/g, " ")
        .trim();
    return text.slice(0, 12000);
};

export interface GenerationResult {
    text: string;
}

export const generateCoverLetter = async (
    resume: string,
    jobInput: { type: JobDescriptionInputType; value: string },
    mode: GenerationMode,
    tone: Tone
): Promise<GenerationResult> => {
    let prompt: string;
    let modelName: string;

    if (jobInput.type === JobDescriptionInputType.Text) {
        prompt = PROMPT_TEMPLATE_TEXT
            .replace('{resume}', resume)
            .replace('{jobDescription}', jobInput.value)
            .replace('{tone}', tone);
        switch (mode) {
            case GenerationMode.Thinking:
                modelName = MODELS.thinking;
                break;
            case GenerationMode.LowLatency:
                modelName = MODELS.lowLatency;
                break;
            case GenerationMode.Standard:
            default:
                modelName = MODELS.standard;
                break;
        }
    } else {
        const extracted = await fetchJobDescriptionFromUrl(jobInput.value);
        prompt = PROMPT_TEMPLATE_URL
            .replace('{resume}', resume)
            .replace('{jobUrl}', jobInput.value)
            .replace('{jobDescription}', extracted)
            .replace('{tone}', tone);
        modelName = MODELS.url;
    }

    try {
        const text = await callOpenRouter(modelName, [
            { role: "system", content: "You are a professional cover-letter writing assistant. Reply with the cover letter content only." },
            { role: "user", content: prompt },
        ]);
        return { text };
    } catch (error) {
        console.error("Error calling OpenRouter API:", error);
        throw new Error("Failed to communicate with the AI API. Please check your connection or API key.");
    }
};

export const formatResumeText = async (rawText: string): Promise<string> => {
    if (!rawText.trim()) {
        return "";
    }

    const prompt = RESUME_FORMATTING_PROMPT.replace('{rawText}', rawText);

    try {
        const text = await callOpenRouter(MODELS.formatting, [
            { role: "system", content: "You are a resume formatting assistant. Return only the formatted plain text." },
            { role: "user", content: prompt },
        ]);
        return text ?? rawText;
    } catch (error) {
        console.error("Error calling OpenRouter API for resume formatting:", error);
        return rawText;
    }
};

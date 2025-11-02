import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GenerationMode, JobDescriptionInputType } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const PROMPT_TEMPLATE_TEXT = `
You are a world-class professional career coach. Your task is to write a highly professional, concise, and compelling cover letter.

The cover letter must be tailored specifically to the provided job description, using the candidate's resume to highlight the most relevant skills and experiences.

Follow these instructions:
1.  **Analyze Both Documents:** Carefully read and understand the resume and the job description.
2.  **Identify Keywords:** Extract key skills, qualifications, and requirements from the job description.
3.  **Match Experience:** Find specific examples from the resume that demonstrate these keywords and qualifications.
4.  **Structure the Letter:**
    *   **Introduction:** Briefly introduce the candidate and the position they are applying for. Express enthusiasm for the role and the company.
    *   **Body Paragraph(s):** Create 1-2 paragraphs that connect the candidate's top 2-3 qualifications directly to the job's requirements. Use quantifiable achievements from the resume where possible (e.g., "Increased sales by 15%").
    *   **Conclusion:** Reiterate interest, express confidence in their ability to contribute, and include a strong call to action (e.g., "I am eager to discuss how my background in...").
5.  **Tone:** Maintain a professional, confident, and enthusiastic tone throughout.

**DO NOT** include placeholders like "[Your Name]" or "[Company Name]". Assume the letter is ready to be signed.

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

Now, generate the cover letter.
`;

const PROMPT_TEMPLATE_URL = `
You are a world-class professional career coach. Your task is to write a highly professional, concise, and compelling cover letter.

Your first step is to act as a web researcher. You MUST analyze the content at the following URL to find the full job description, including all requirements, responsibilities, and qualifications.
URL: {jobUrl}

Once you have the complete job description from the URL, use it and the candidate's resume below to write a cover letter that highlights the most relevant skills and experiences.

Follow these instructions for the cover letter:
1.  **Structure the Letter:**
    *   **Introduction:** Briefly introduce the candidate and the position they are applying for. Express enthusiasm for the role and the company.
    *   **Body Paragraph(s):** Create 1-2 paragraphs that connect the candidate's top 2-3 qualifications directly to the job's requirements. Use quantifiable achievements from the resume where possible (e.g., "Increased sales by 15%").
    *   **Conclusion:** Reiterate interest, express confidence in their ability to contribute, and include a strong call to action (e.g., "I am eager to discuss how my background in...").
2.  **Tone:** Maintain a professional, confident, and enthusiastic tone throughout.
**DO NOT** include placeholders like "[Your Name]" or "[Company Name]". Assume the letter is ready to be signed.

Here is the candidate's resume:
---
RESUME:
{resume}
---

Now, find the job description from the URL and generate the cover letter.
`;


export const generateCoverLetter = async (
  resume: string,
  jobInput: { type: JobDescriptionInputType; value: string },
  mode: GenerationMode
): Promise<GenerateContentResponse> => {
  let prompt: string;
  let modelName: string;
  let config: any = {};
  
  const effectiveMode = jobInput.type === JobDescriptionInputType.Url ? GenerationMode.SearchGrounding : mode;

  if (jobInput.type === JobDescriptionInputType.Text) {
    prompt = PROMPT_TEMPLATE_TEXT.replace('{resume}', resume).replace('{jobDescription}', jobInput.value);
  } else {
    prompt = PROMPT_TEMPLATE_URL.replace('{resume}', resume).replace('{jobUrl}', jobInput.value);
  }

  switch (effectiveMode) {
    case GenerationMode.Thinking:
      modelName = 'gemini-2.5-pro';
      config = {
        thinkingConfig: { thinkingBudget: 32768 }
      };
      break;
    case GenerationMode.LowLatency:
      modelName = 'gemini-2.5-flash-lite';
      break;
    case GenerationMode.SearchGrounding:
      modelName = 'gemini-2.5-flash';
      config = {
        tools: [{ googleSearch: {} }]
      };
      break;
    case GenerationMode.Standard:
    default:
      modelName = 'gemini-2.5-pro';
      break;
  }

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: config,
    });
    return response;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to communicate with the Gemini API. Please check your connection or API key.");
  }
};
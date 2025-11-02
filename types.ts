// src/types.ts

// Defines the possible themes for your application
export type Theme = 'light' | 'dark';

// Defines the structure of a user object. This is the more complete version.
export interface User {
  id: string;
  name: string;
  imageUrl?: string; // The '?' makes the image optional, which is good practice.
}

// Defines the structure for a saved cover letter draft.
export interface Draft {
  id: string;
  companyName: string;
  coverLetter: string;
  createdAt: string;
}

// Defines the generation modes for the AI model.
export enum GenerationMode {
  Standard = 'standard',
  Thinking = 'thinking',
  LowLatency = 'low-latency',
  SearchGrounding = 'search-grounding',
}

// Defines how the job description is being provided.
export enum JobDescriptionInputType {
  Text = 'text',
  Url = 'url',
}
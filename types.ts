export enum GenerationMode {
  Standard = 'Standard',
  Thinking = 'Thinking Mode',
  LowLatency = 'Low Latency',
  SearchGrounding = 'Search Grounding',
}

export enum JobDescriptionInputType {
  Text = 'Text',
  Url = 'Url',
}

export type Tone = 'Professional' | 'Enthusiastic' | 'Confident' | 'Creative';

export type Theme = 'light' | 'dark';

export interface Draft {
  id: string;
  companyName: string;
  coverLetter: string;
  createdAt: string;
}

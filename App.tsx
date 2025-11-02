import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { OutputSection } from './components/OutputSection';
import { ModeSelector } from './components/ModeSelector';
import { generateCoverLetter } from './services/geminiService';
import { GenerationMode, JobDescriptionInputType } from './types';
import type { GroundingChunk } from "@google/genai";

const App: React.FC = () => {
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [jobInputType, setJobInputType] = useState<JobDescriptionInputType>(JobDescriptionInputType.Text);
  
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.Standard);
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);

  // When switching to URL input, force Search Grounding mode.
  useEffect(() => {
    if (jobInputType === JobDescriptionInputType.Url) {
      setMode(GenerationMode.SearchGrounding);
    }
  }, [jobInputType]);


  const handleGenerate = useCallback(async () => {
    const isJobInputValid = (jobInputType === JobDescriptionInputType.Text && jobDescription.trim()) || 
                            (jobInputType === JobDescriptionInputType.Url && jobUrl.trim());

    if (!resume.trim() || !isJobInputValid) {
      setError('Please provide your resume and the job details.');
      return;
    }
    setIsLoading(true);
    setError(null);
    setCoverLetter('');
    setGroundingSources([]);

    try {
      const jobInput = {
        type: jobInputType,
        value: jobInputType === JobDescriptionInputType.Text ? jobDescription : jobUrl,
      };

      const response = await generateCoverLetter(resume, jobInput, mode);
      const text = response.text;
      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];

      if (text) {
        setCoverLetter(text);
        setGroundingSources(sources);
      } else {
        setError('Failed to generate a cover letter. The response was empty.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [resume, jobDescription, jobUrl, jobInputType, mode]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <ModeSelector 
          currentMode={mode} 
          setMode={setMode} 
          disabled={jobInputType === JobDescriptionInputType.Url} 
        />
        <InputSection
          resume={resume}
          setResume={setResume}
          jobDescription={jobDescription}
          setJobDescription={setJobDescription}
          jobUrl={jobUrl}
          setJobUrl={setJobUrl}
          jobInputType={jobInputType}
          setJobInputType={setJobInputType}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />
        <OutputSection
          coverLetter={coverLetter}
          isLoading={isLoading}
          error={error}
          onRegenerate={handleGenerate}
          groundingSources={groundingSources}
        />
      </main>
       <footer className="text-center py-4 text-gray-500 text-sm">
    © 2025 Basith AbuSyed. All rights reserved.<br />
    This site is under active development. Check back occasionally for new features.
</footer>
    </div>
  );
};

export default App;
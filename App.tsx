import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { OutputSection } from './components/OutputSection';
import { ModeSelector } from './components/ModeSelector';
import { DraftsSection } from './components/DraftsSection';
import { generateCoverLetter } from './services/geminiService';
import { GenerationMode, JobDescriptionInputType, Theme, Draft, Tone } from './types';

const DRAFTS_KEY = 'drafts_local';

const App: React.FC = () => {
  // Inputs
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobInputType, setJobInputType] = useState<JobDescriptionInputType>(JobDescriptionInputType.Text);
  const [tone, setTone] = useState<Tone>('Professional');
  
  // Outputs & State
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.Standard);

  // New Features State
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [drafts, setDrafts] = useState<Draft[]>([]);

  // Theme effect
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // When switching to URL input, force Search Grounding mode.
  useEffect(() => {
    if (jobInputType === JobDescriptionInputType.Url) {
      setMode(GenerationMode.SearchGrounding);
    }
  }, [jobInputType]);

  // Load drafts from localStorage on mount.
  useEffect(() => {
    const savedDrafts = localStorage.getItem(DRAFTS_KEY);
    if (savedDrafts) {
      setDrafts(JSON.parse(savedDrafts));
    }
  }, []);

  const handleSaveDraft = () => {
    if (!coverLetter) return;
    const newDraft: Draft = {
      id: crypto.randomUUID(),
      companyName: companyName || "Untitled Draft",
      coverLetter,
      createdAt: new Date().toISOString(),
    };
    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
  };

  const handleDeleteDraft = (draftId: string) => {
    const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updatedDrafts));
  };

  const handleLoadDraft = (draft: Draft) => {
    setCoverLetter(draft.coverLetter);
    setCompanyName(draft.companyName);
    // Smooth scroll to the output section for better UX
    document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' });
  };


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

    try {
      const jobInput = {
        type: jobInputType,
        value: jobInputType === JobDescriptionInputType.Text ? jobDescription : jobUrl,
      };

      const response = await generateCoverLetter(resume, jobInput, mode, tone);
      const text = response.text;

      if (text) {
        setCoverLetter(text);
      } else {
        setError('Failed to generate a cover letter. The response was empty.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [resume, jobDescription, jobUrl, jobInputType, mode, tone]);

  return (
    <div className="min-h-[100dvh] font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 bg-ambient relative">
       
      <Header 
        theme={theme}
        setTheme={setTheme}
      />
      
      <main className="container mx-auto px-4 md:px-6 py-8 max-w-5xl pb-24">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-gray-900 dark:text-gray-50">
            Write a cover letter that gets noticed
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-2xl leading-relaxed">
            Pair your resume with the role you're targeting, and CoverCraft drafts a tailored, professional letter — ready to review and send.
          </p>
        </div>

        {/* Unified workspace control strip */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 dark:border-gray-800 pb-4 mb-8">
          <ModeSelector
            currentMode={mode}
            setMode={setMode}
            disabled={jobInputType === JobDescriptionInputType.Url}
          />
        </div>

        {/* Inputs workspace — one cohesive form, not floating cards */}
        <div className="mb-10">
          <InputSection
            resume={resume}
            setResume={setResume}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            jobUrl={jobUrl}
            setJobUrl={setJobUrl}
            jobInputType={jobInputType}
            setJobInputType={setJobInputType}
            companyName={companyName}
            setCompanyName={setCompanyName}
            onGenerate={handleGenerate}
            isLoading={isLoading}
            tone={tone}
            setTone={setTone}
          />
        </div>

        {/* Output — the hero of the product */}
        <OutputSection
          coverLetter={coverLetter}
          isLoading={isLoading}
          error={error}
          onRegenerate={handleGenerate}
          onSave={handleSaveDraft}
          companyName={companyName}
        />

        <DraftsSection 
          drafts={drafts}
          onLoad={handleLoadDraft}
          onDelete={handleDeleteDraft}
        />
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
        <div className="container mx-auto max-w-5xl px-4 py-8 text-xs text-gray-400 dark:text-gray-500 text-center flex flex-col gap-1.5">
          <span>© {new Date().getFullYear()} ABu. All rights reserved.</span>
          <span>
            Draft a cover letter that reads like you wrote it — tailored to every role you apply for.
          </span>
        </div>
      </footer>
    </div>
  );
};

export default App;
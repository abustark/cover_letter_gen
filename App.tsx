import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { OutputSection } from './components/OutputSection';
import { ModeSelector } from './components/ModeSelector';
import { DraftsSection } from './components/DraftsSection';
import { generateCoverLetter } from './services/geminiService';
import { useAuth } from './services/auth';
import { loadSavedDrafts, persistDrafts, clearAllDrafts } from './services/draftStorage';
import { GenerationMode, JobDescriptionInputType, Theme, Draft, Tone } from './types';
import { SparklesIcon } from './components/icons';

const App: React.FC = () => {
  // Inputs
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobInputType, setJobInputType] = useState<JobDescriptionInputType>(
    JobDescriptionInputType.Text
  );
  const [tone, setTone] = useState<Tone>('Professional');

  // Outputs & State
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.Standard);

  // Theme & Drafts State
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('theme') as Theme) || 'dark'
  );
  const [drafts, setDrafts] = useState<Draft[]>(() => loadSavedDrafts());
  const [storageNotice, setStorageNotice] = useState<string | null>(null);

  const { isAuthenticated, getValidToken } = useAuth();

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

  const handleSaveDraft = () => {
    if (!coverLetter) return;
    const newDraft: Draft = {
      id: crypto.randomUUID(),
      companyName: companyName.trim() || 'Untitled Draft',
      coverLetter,
      createdAt: new Date().toISOString(),
    };
    const updatedDrafts = [newDraft, ...drafts];
    const result = persistDrafts(updatedDrafts);
    if (result.success) {
      setDrafts(updatedDrafts);
      setStorageNotice(result.error || null);
    } else {
      setError(result.error || 'Could not save draft.');
    }
  };

  const handleDeleteDraft = (draftId: string) => {
    const updatedDrafts = drafts.filter((draft) => draft.id !== draftId);
    setDrafts(updatedDrafts);
    persistDrafts(updatedDrafts);
  };

  const handleClearAllDrafts = () => {
    clearAllDrafts();
    setDrafts([]);
  };

  const handleLoadDraft = (draft: Draft) => {
    setCoverLetter(draft.coverLetter);
    setCompanyName(draft.companyName === 'Untitled Draft' ? '' : draft.companyName);
    document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGenerate = useCallback(async () => {
    const token = getValidToken();
    if (!isAuthenticated || !token) {
      setError('Please sign in with Google to generate your cover letter.');
      document.getElementById('input-section')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    const isJobInputValid =
      (jobInputType === JobDescriptionInputType.Text && jobDescription.trim()) ||
      (jobInputType === JobDescriptionInputType.Url && jobUrl.trim());

    if (!resume.trim() || !isJobInputValid) {
      setError('Please provide your resume and the job details.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setCoverLetter('');
    setStorageNotice(null);

    try {
      const jobInput = {
        type: jobInputType,
        value: jobInputType === JobDescriptionInputType.Text ? jobDescription : jobUrl,
      };

      const response = await generateCoverLetter(
        resume,
        jobInput,
        mode,
        tone,
        token,
        companyName
      );

      const text = response.text;
      if (text) {
        setCoverLetter(text);
        document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' });
      } else {
        setError('Failed to generate a cover letter. The response was empty.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      console.error('Generation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [resume, jobDescription, jobUrl, jobInputType, mode, tone, companyName, isAuthenticated, getValidToken]);

  return (
    <div className="min-h-[100dvh] font-sans text-gray-900 dark:text-gray-100 transition-colors duration-300 bg-ambient relative">
      <Header theme={theme} setTheme={setTheme} />

      <main className="container mx-auto px-4 md:px-6 py-10 max-w-5xl pb-28">
        {/* Hero Section */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-mono uppercase tracking-wider bg-stone-100/90 dark:bg-stone-800/90 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80 mb-4 shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 animate-pulse" />
            <span>Editorial Studio · Factually Grounded</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-stone-900 dark:text-stone-50 leading-[1.14]">
            Craft a cover letter that{' '}
            <em className="font-serif italic font-normal text-stone-900 dark:text-stone-100">
              commands attention.
            </em>
          </h1>

          <p className="mt-3.5 text-sm sm:text-base text-stone-600 dark:text-stone-400 max-w-2xl leading-relaxed">
            Ground your verified experience directly in target role requirements. CoverCraft synthesizes an
            authentic, tailored letter with zero hallucinated credentials — ready to review and send.
          </p>
        </div>

        {/* Workspace Control Strip: Model Intelligence */}
        <div className="mb-8 p-1.5 rounded-2xl bg-white/40 dark:bg-gray-950/40 border border-gray-200/60 dark:border-gray-800/60 backdrop-blur-sm shadow-xs">
          <ModeSelector
            currentMode={mode}
            setMode={setMode}
            disabled={jobInputType === JobDescriptionInputType.Url}
          />
        </div>

        {/* Inputs Workspace */}
        <div className="mb-12" id="input-section">
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

        {storageNotice && (
          <div className="mb-6 rounded-xl border border-amber-300/80 dark:border-amber-700/80 bg-amber-50/70 dark:bg-amber-900/20 p-3.5 text-xs text-amber-800 dark:text-amber-300 shadow-xs">
            {storageNotice}
          </div>
        )}

        {/* Document Preview & Export Section */}
        <OutputSection
          coverLetter={coverLetter}
          isLoading={isLoading}
          error={error}
          onRegenerate={handleGenerate}
          onSave={handleSaveDraft}
          companyName={companyName}
        />

        {/* Saved Drafts Library */}
        <DraftsSection
          drafts={drafts}
          onLoad={handleLoadDraft}
          onDelete={handleDeleteDraft}
          onClearAll={handleClearAllDrafts}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200/80 dark:border-gray-800/80 mt-20 bg-white/40 dark:bg-gray-950/40 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl px-4 py-8 text-xs text-gray-500 dark:text-gray-400 text-center flex flex-col items-center gap-2.5">
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
            <span className="font-semibold text-stone-700 dark:text-stone-300">
              CoverCraft Studio v2.0.9
            </span>
            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">·</span>
            <span>Server-Verified Authentication</span>
            <span className="text-gray-300 dark:text-gray-700 hidden sm:inline">·</span>
            <span>SSRF Protected</span>
          </div>
          <span className="leading-relaxed">
            Client-side parsing ensures documents never leave your machine · Drafts preserved locally
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} ABu. All rights reserved.
          </span>
          <a
            className="foot-cta"
            href="https://abufolio.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="foot-cta-kicker">Like this build? There's more of my work</span>
            <span className="foot-cta-link">Open my portfolio ↗</span>
          </a>
        </div>
      </footer>
    </div>
  );
};

export default App;

import React, { useState, useCallback, useEffect } from 'react';
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { OutputSection } from './components/OutputSection';
import { ModeSelector } from './components/ModeSelector';
import { DraftsSection } from './components/DraftsSection';
import { generateCoverLetter } from './services/geminiService';
import { GenerationMode, JobDescriptionInputType, Theme, User, Draft } from './types';
import type { GroundingChunk } from "@google/genai";


const MOCK_USER: User = {
  id: 'mock-user-123',
  name: 'Alex Doe',
  imageUrl: 'https://i.pravatar.cc/150?u=a042581f4e29026704d',
};

const App: React.FC = () => {
  // Inputs
  const [resume, setResume] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobInputType, setJobInputType] = useState<JobDescriptionInputType>(JobDescriptionInputType.Text);
  
  // Outputs & State
  const [coverLetter, setCoverLetter] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<GenerationMode>(GenerationMode.Standard);
  const [groundingSources, setGroundingSources] = useState<GroundingChunk[]>([]);

  // New Features State
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'dark');
  const [user, setUser] = useState<User | null>(null);
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

  // Load drafts from localStorage when user logs in
  useEffect(() => {
    if (user) {
      const savedDrafts = localStorage.getItem(`drafts_${user.id}`);
      if (savedDrafts) {
        setDrafts(JSON.parse(savedDrafts));
      }
    } else {
      setDrafts([]); // Clear drafts on logout
    }
  }, [user]);

  const handleLogin = () => setUser(MOCK_USER);
  const handleLogout = () => setUser(null);

  const handleSaveDraft = () => {
    if (!user || !coverLetter) return;
    const newDraft: Draft = {
      id: crypto.randomUUID(),
      companyName: companyName || "Untitled Draft",
      coverLetter,
      createdAt: new Date().toISOString(),
    };
    const updatedDrafts = [newDraft, ...drafts];
    setDrafts(updatedDrafts);
    localStorage.setItem(`drafts_${user.id}`, JSON.stringify(updatedDrafts));
  };

  const handleDeleteDraft = (draftId: string) => {
    if (!user) return;
    const updatedDrafts = drafts.filter(draft => draft.id !== draftId);
    setDrafts(updatedDrafts);
    localStorage.setItem(`drafts_${user.id}`, JSON.stringify(updatedDrafts));
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <Header 
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />
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
          companyName={companyName}
          setCompanyName={setCompanyName}
          onGenerate={handleGenerate}
          isLoading={isLoading}
        />
        <OutputSection
          coverLetter={coverLetter}
          isLoading={isLoading}
          error={error}
          onRegenerate={handleGenerate}
          onSave={handleSaveDraft}
          groundingSources={groundingSources}
          isLoggedIn={!!user}
          companyName={companyName}
        />
        {user && (
          <DraftsSection 
            drafts={drafts}
            onLoad={handleLoadDraft}
            onDelete={handleDeleteDraft}
          />
        )}
      </main>
        <footer className="text-center py-4 text-gray-500 text-sm">
    © 2025 Basith AbuSyed. All rights reserved.<br />
    This site is under active development. Check back occasionally for new features.
</footer>
    </div>
  );
};

export default App;
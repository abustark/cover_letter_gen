// src/App.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import axios from 'axios';

// --- Your Existing Imports ---
import { Header } from './components/Header';
import { InputSection } from './components/InputSection';
import { OutputSection } from './components/OutputSection';
import { ModeSelector } from './components/ModeSelector';
import { DraftsSection } from './components/DraftsSection';
import { generateCoverLetter } from './services/geminiService';
import { GenerationMode, JobDescriptionInputType, Theme, User, Draft } from './types';
import type { GroundingChunk } from "@google/genai";

const App: React.FC = () => {
  // --- Your Existing State (all remains the same) ---
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

  // --- NEW: Real Google Authentication Logic ---
  const onLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        // Fetch user information from Google
        const userInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        
        // Create a user object that matches your User type
        setUser({
          id: userInfo.data.sub, // 'sub' is Google's unique ID for the user
          name: userInfo.data.name,
          imageUrl: userInfo.data.picture,
        });
      } catch (err) {
        console.error('Error fetching user info:', err);
      }
    },
    onError: (error) => console.error('Login Failed:', error),
  });

  const onLogout = () => {
    googleLogout(); // Clears Google's authentication state
    setUser(null);  // Clears your application's user state
  };


  // --- All Your Existing Effects and Handlers (no changes needed) ---

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
    document.getElementById('output-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleGenerate = useCallback(async () => {
    // ... (This function remains unchanged)
  }, [resume, jobDescription, jobUrl, jobInputType, mode]);


  // --- Final Render ---
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans transition-colors duration-300">
      <Header 
        theme={theme}
        setTheme={setTheme}
        user={user}
        onLogin={onLogin}   // Pass the REAL login function to the header
        onLogout={onLogout} // Pass the REAL logout function to the header
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
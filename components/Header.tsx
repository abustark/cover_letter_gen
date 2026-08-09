import React from 'react';
import { Theme } from '../types';
import { MoonIcon, SunIcon } from './icons';
import { IconButton } from './UI';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-950/90 border-b border-gray-200 dark:border-gray-800 backdrop-blur-sm">
      <div className="container mx-auto max-w-5xl px-4 h-16 flex items-center justify-between">

        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center shadow-sm ring-1 ring-accent-400/40">
            <span className="text-white font-bold text-base leading-none">C</span>
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-bold tracking-tight text-gray-900 dark:text-gray-50">
              CoverCraft
            </span>
            <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 tracking-wide hidden sm:block">
              Cover Letter Builder
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <IconButton label="Toggle theme" onClick={toggleTheme}>
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </IconButton>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { Theme } from '../types';
import { MoonIcon, SunIcon } from './icons';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const spawnRipple = (x: number, y: number) => {
    const el = document.createElement('div');
    el.className = 'theme-ripple-fallback';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 1300);
  };

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === 'light' ? 'dark' : 'light';
    const root = document.documentElement;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    root.style.setProperty('--theme-x', `${x}px`);
    root.style.setProperty('--theme-y', `${y}px`);

    const apply = () => {
      root.classList.toggle('dark', next === 'dark');
      setTheme(next);
    };

    if ('startViewTransition' in document) {
      (document as Document & { startViewTransition: (cb: () => void) => void }).startViewTransition(apply);
    } else {
      apply();
      spawnRipple(x, y);
    }
  };

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
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-150 focus-ring
              bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-100
              border border-gray-300 dark:border-gray-600
              shadow-sm hover:shadow
              hover:bg-accent-50 hover:text-accent-700 hover:border-accent-300
              dark:hover:bg-accent-900/30 dark:hover:text-accent-200 dark:hover:border-accent-700"
          >
            {theme === 'light' ? (
              <MoonIcon className="w-4 h-4 text-accent2-600" />
            ) : (
              <SunIcon className="w-4 h-4 text-amber-400" />
            )}
            <span>{theme === 'light' ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

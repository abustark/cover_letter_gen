import React from 'react';
import { Theme } from '../types';
import { MoonIcon, SunIcon, SignOutIcon, SparklesIcon } from './icons';
import { GoogleButton } from './GoogleButton';
import { useAuth } from '../services/auth';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const { user, isAuthenticated, isInitializing, signOut } = useAuth();

  const spawnRipple = (x: number, y: number) => {
    const el = document.createElement('div');
    el.className = 'theme-ripple-fallback';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 1100);
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
    <header className="sticky top-3 z-50 px-3 sm:px-6">
      <div className="container mx-auto max-w-5xl rounded-2xl bg-white/80 dark:bg-gray-950/80 border border-gray-200/80 dark:border-gray-800/80 backdrop-blur-xl shadow-xs transition-all duration-300">
        <div className="h-16 px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 min-w-0">
            <div className="relative group flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-accent-600 via-accent-700 to-accent-900 flex items-center justify-center shadow-xs ring-1 ring-white/20 transition-transform duration-200 group-hover:scale-105">
                <span className="text-white font-bold text-sm sm:text-base tracking-wider leading-none">C</span>
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-accent2-400 rounded-full ring-2 ring-white dark:ring-gray-950" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-gray-900 dark:text-gray-50 truncate">
                  CoverCraft
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-accent-50 dark:bg-accent-950/60 text-accent-700 dark:text-accent-300 border border-accent-200/60 dark:border-accent-800/60">
                  PRO
                </span>
              </div>
              <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 hidden sm:block">
                AI Cover Letter Studio
              </span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
            {isInitializing ? (
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ) : isAuthenticated && user ? (
              <div className="flex items-center gap-1.5 sm:gap-2 rounded-full pl-2 sm:pl-2.5 pr-1.5 py-1 bg-gray-100/80 dark:bg-gray-900/80 border border-gray-200/70 dark:border-gray-800/70">
                <div className="hidden md:flex flex-col items-end leading-none pr-1">
                  <span className="text-xs font-semibold text-gray-800 dark:text-gray-100 max-w-[130px] truncate">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-accent2-600 dark:text-accent2-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent2-500 animate-pulse" /> Verified
                  </span>
                </div>
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 sm:w-7 sm:h-7 rounded-full ring-1 ring-gray-200 dark:ring-gray-700 object-cover select-none"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-accent-600 text-white flex items-center justify-center text-xs font-bold select-none">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  type="button"
                  onClick={signOut}
                  aria-label="Sign out"
                  title="Sign out"
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <SignOutIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex-shrink-0 max-w-[135px] sm:max-w-none overflow-hidden">
                <GoogleButton size="medium" fullWidth={false} />
              </div>
            )}

            {/* Theme Toggle Button */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 sm:px-3 py-2 text-xs font-semibold transition-all duration-200 focus-ring flex-shrink-0
                bg-gray-100/80 dark:bg-gray-900/80 text-gray-700 dark:text-gray-200
                border border-gray-200/80 dark:border-gray-800/80
                hover:border-accent-300 dark:hover:border-accent-700 hover:bg-accent-50/50 dark:hover:bg-accent-900/20 active:scale-95"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-3.5 h-3.5 text-accent-600" />
              ) : (
                <SunIcon className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="hidden sm:inline font-medium text-[11px] tracking-wide">
                {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

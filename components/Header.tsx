import React, { useState, useRef, useEffect } from 'react';
import { Theme } from '../types';
import { MoonIcon, SunIcon, SignOutIcon, UserIcon, CheckIcon } from './icons';
import { GoogleButton } from './GoogleButton';
import { useAuth } from '../services/auth';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme }) => {
  const { user, isAuthenticated, isInitializing, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const spawnRipple = (x: number, y: number) => {
    const el = document.createElement('div');
    el.className = 'theme-ripple-fallback';
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);
    window.setTimeout(() => el.remove(), 1100);
  };

  const handleSetTheme = (next: Theme, event?: React.MouseEvent) => {
    const root = document.documentElement;
    let x = window.innerWidth / 2;
    let y = 40;
    if (event) {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
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

  const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
    const next = theme === 'light' ? 'dark' : 'light';
    handleSetTheme(next, event);
  };

  return (
    <header className="sticky top-3 z-50 px-3 sm:px-6">
      <div className="container mx-auto max-w-5xl rounded-2xl bg-white/85 dark:bg-stone-900/85 border border-stone-200/80 dark:border-stone-800/80 backdrop-blur-xl shadow-xs transition-all duration-300">
        <div className="h-15 sm:h-16 px-3.5 sm:px-6 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0 min-w-0">
            <div className="w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl bg-stone-900 dark:bg-stone-100 flex items-center justify-center text-white dark:text-stone-950 shadow-xs ring-1 ring-black/5 dark:ring-white/10 transition-transform duration-200 hover:scale-105 select-none">
              <span className="font-bold text-xs sm:text-sm tracking-widest leading-none">CC</span>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-50 truncate">
                  CoverCraft
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/60 dark:border-stone-700/60">
                  STUDIO
                </span>
              </div>
              <span className="text-[11px] font-medium text-stone-400 dark:text-stone-500 hidden sm:block">
                Grounded Letter Synthesis
              </span>
            </div>
          </div>

          {/* Controls: Desktop Theme Button + Unified Avatar Menu */}
          <div className="flex items-center gap-2 sm:gap-2.5 relative" ref={menuRef}>
            {/* Desktop Direct Theme Toggle */}
            <button
              id="theme-toggle-btn"
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              className="hidden sm:inline-flex items-center justify-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all duration-150 focus-ring flex-shrink-0
                bg-stone-100/80 dark:bg-stone-800/80 text-stone-700 dark:text-stone-200
                border border-stone-200/80 dark:border-stone-700/80
                hover:bg-stone-200/60 dark:hover:bg-stone-700/60 active:scale-95"
            >
              {theme === 'light' ? (
                <MoonIcon className="w-3.5 h-3.5 text-stone-700" />
              ) : (
                <SunIcon className="w-3.5 h-3.5 text-amber-400" />
              )}
              <span className="font-medium text-[11px] tracking-wide">
                {theme === 'light' ? 'Dark' : 'Light'}
              </span>
            </button>

            {/* Avatar Circle Button */}
            <button
              id="profile-menu-button"
              type="button"
              onClick={() => setIsMenuOpen((prev) => !prev)}
              aria-expanded={isMenuOpen}
              aria-label="Account and settings menu"
              title={isAuthenticated && user ? user.name : 'Account and settings'}
              className="relative w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-150 focus-ring active:scale-95 select-none
                bg-stone-100 dark:bg-stone-800 border-stone-200/90 dark:border-stone-700/90
                hover:border-stone-400 dark:hover:border-stone-500 hover:shadow-xs"
            >
              {isInitializing ? (
                <div className="w-full h-full rounded-full bg-stone-200 dark:bg-stone-700 animate-pulse" />
              ) : isAuthenticated && user ? (
                <>
                  {user.picture ? (
                    <img
                      src={user.picture}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full rounded-full object-cover select-none"
                    />
                  ) : (
                    <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-stone-900" />
                </>
              ) : (
                <UserIcon className="w-4 h-4 text-stone-600 dark:text-stone-300" />
              )}
            </button>

            {/* Dropdown Popover Card */}
            {isMenuOpen && (
              <div
                role="dialog"
                aria-label="User Account and Preferences"
                className="absolute right-0 top-11 mt-1.5 w-76 sm:w-84 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800/90 shadow-xl p-4.5 z-50 text-stone-800 dark:text-stone-100 animate-in fade-in zoom-in-95 duration-150"
              >
                {/* 1. Account Section */}
                {isAuthenticated && user ? (
                  <div className="space-y-3 pb-3 border-b border-stone-100 dark:border-stone-800">
                    <div className="flex items-center gap-3">
                      {user.picture ? (
                        <img
                          src={user.picture}
                          alt={user.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover ring-1 ring-stone-200 dark:ring-stone-700 select-none flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-950 flex items-center justify-center font-bold text-sm flex-shrink-0 select-none">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-stone-900 dark:text-stone-50 truncate">
                          {user.name}
                        </div>
                        <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Google Verified
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          signOut();
                          setIsMenuOpen(false);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-red-600 dark:hover:text-red-400 transition-colors py-1 px-2 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800"
                      >
                        <SignOutIcon className="w-3.5 h-3.5" />
                        <span>Sign out</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 pb-3.5 border-b border-stone-100 dark:border-stone-800">
                    <div>
                      <h4 className="text-sm font-bold text-stone-900 dark:text-stone-100">
                        Sign in to CoverCraft
                      </h4>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 leading-relaxed">
                        Authenticate with Google to generate tailored letters and synchronize your drafts.
                      </p>
                    </div>

                    <div className="pt-1 flex justify-center">
                      <GoogleButton
                        size="small"
                        fullWidth
                        onSuccess={() => setIsMenuOpen(false)}
                      />
                    </div>
                  </div>
                )}

                {/* 2. Theme & Appearance Section */}
                <div className="pt-3.5 space-y-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    Appearance
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 bg-stone-100/90 dark:bg-stone-800/90 p-1 rounded-xl border border-stone-200/60 dark:border-stone-700/60">
                    <button
                      type="button"
                      onClick={(e) => handleSetTheme('light', e)}
                      className={`inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 select-none
                        ${
                          theme === 'light'
                            ? 'bg-white text-stone-900 shadow-xs font-bold'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                    >
                      <SunIcon className="w-3.5 h-3.5 text-amber-500" />
                      <span>Light</span>
                    </button>

                    <button
                      type="button"
                      onClick={(e) => handleSetTheme('dark', e)}
                      className={`inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all duration-150 select-none
                        ${
                          theme === 'dark'
                            ? 'bg-stone-900 text-stone-50 shadow-xs font-bold'
                            : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
                        }`}
                    >
                      <MoonIcon className="w-3.5 h-3.5 text-stone-400" />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

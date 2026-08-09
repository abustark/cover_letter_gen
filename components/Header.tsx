import React, { useState } from 'react';
import { Theme, User } from '../types';
import { MoonIcon, SunIcon, UserIcon } from './icons';
import { Button, IconButton } from './UI';

interface HeaderProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme, user, onLogin, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);
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
          {user ? (
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => setMenuOpen(o => !o)}
                onBlur={() => setTimeout(() => setMenuOpen(false), 150)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                className="flex items-center gap-2 rounded-lg pl-1 pr-1.5 py-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-ring"
              >
                <img src={user.imageUrl} alt={user.name} className="w-7 h-7 rounded-full" />
                <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200">{user.name}</span>
              </button>
              <div className={`absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-800 py-1 z-50 transition-all duration-150 origin-top-right
                ${menuOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-95 pointer-events-none'}`}>
                <button
                  onClick={onLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 font-medium focus-ring"
                >
                  Sign Out
                </button>
              </div>
            </div>
          ) : (
            <Button variant="primary" size="sm" onClick={onLogin}>
              <UserIcon className="w-4 h-4" /> Sign In
            </Button>
          )}

          <div className="h-6 w-px bg-gray-200 dark:bg-gray-800 mx-1" />

          <IconButton label="Toggle theme" onClick={toggleTheme}>
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </IconButton>
        </div>
      </div>
    </header>
  );
};

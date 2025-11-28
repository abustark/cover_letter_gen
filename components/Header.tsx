import React from 'react';
import { Theme, User } from '../types';
import { MoonIcon, SunIcon, UserIcon } from './icons';

interface HeaderProps {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    user: User | null;
    onLogin: () => void;
    onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ theme, setTheme, user, onLogin, onLogout }) => {
    const toggleTheme = () => {
        setTheme(theme === 'light' ? 'dark' : 'light');
    };

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/60 dark:bg-gray-900/50 border-b border-white/20 dark:border-white/5 shadow-sm transition-all duration-300">
            <div className="container mx-auto max-w-6xl px-4 h-16 sm:h-20 flex justify-between items-center">
                
                {/* Logo Section */}
                <div className="flex items-center gap-3">
                     <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20 ring-1 ring-white/20">
                        <span className="text-white font-bold text-lg sm:text-xl">Ai</span>
                     </div>
                     <div className="flex flex-col">
                        <h1 className="text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 leading-tight">
                            Cover Letter
                        </h1>
                        <span className="text-[10px] sm:text-xs font-medium text-purple-600 dark:text-purple-400 tracking-wider uppercase hidden sm:block">
                            Gemini 2.5 Powered
                        </span>
                     </div>
                </div>

                {/* Controls Section */}
                <div className="flex items-center gap-2 sm:gap-4">
                     {user ? (
                        <div className="relative group flex items-center bg-white/40 dark:bg-black/20 rounded-full pl-1 sm:pl-3 pr-1 py-1 border border-white/30 dark:border-white/10 backdrop-blur-sm transition-all hover:bg-white/60 dark:hover:bg-white/5">
                             <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-200 mr-2">{user.name}</span>
                             <div className="relative">
                                <img src={user.imageUrl} alt={user.name} className="w-8 h-8 rounded-full cursor-pointer ring-2 ring-purple-500/30"/>
                                <div className="absolute right-0 top-full mt-3 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform origin-top-right scale-95 group-hover:scale-100 pointer-events-none group-hover:pointer-events-auto z-50">
                                    <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 font-medium">
                                        Sign Out
                                    </button>
                                </div>
                             </div>
                        </div>
                    ) : (
                        <button onClick={onLogin} className="flex items-center text-xs sm:text-sm bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-3 sm:px-5 rounded-full shadow-lg shadow-purple-500/30 transition-all duration-200 hover:-translate-y-0.5 border border-white/10">
                            <UserIcon className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Sign In</span>
                        </button>
                    )}

                    <div className="h-6 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>

                    <button 
                        onClick={toggleTheme} 
                        className="p-2 rounded-full text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm"
                        aria-label="Toggle Theme"
                    >
                        {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
                    </button>
                </div>
            </div>
        </header>
    );
};
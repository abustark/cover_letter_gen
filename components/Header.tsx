import React from 'react';
import { Theme, User } from '../types';
// Fix: Removed import for non-existent LoginIcon.
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
        <header className="py-4 px-4 sm:px-6 text-center shadow-lg bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm sticky top-0 z-10 flex justify-between items-center">
            <div></div>
            <div className="flex flex-col items-center">
                 <h1 className="text-3xl sm:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">
                    AI Cover Letter Builder
                </h1>
<p className="text-sm text-yellow-400 mt-2">
  DISCLAIMER: AI is used in generating the cover letter...continue if you acknowledge this....
</p>            </div>
           <div className="flex items-center space-x-4">
                <button onClick={toggleTheme} className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    {theme === 'light' ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
                </button>
                {user ? (
                    <div className="relative group">
                         <img src={user.imageUrl} alt={user.name} className="w-10 h-10 rounded-full cursor-pointer border-2 border-purple-400"/>
                         <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                            <div className="px-4 py-2 text-sm text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">{user.name}</div>
                            <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
                                Sign Out
                            </button>
                         </div>
                    </div>
                ) : (
                    <button onClick={onLogin} className="flex items-center text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                        <UserIcon className="w-4 h-4 mr-2" />
                        Sign In
                    </button>
                )}
           </div>
        </header>
    );
};

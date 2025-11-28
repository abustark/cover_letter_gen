import React from 'react';
import { GenerationMode } from '../types';

interface ModeSelectorProps {
    currentMode: GenerationMode;
    setMode: (mode: GenerationMode) => void;
    disabled?: boolean;
}

const MODE_DESCRIPTIONS: Record<GenerationMode, string> = {
    [GenerationMode.Standard]: "Balanced • Gemini 2.5 Pro",
    [GenerationMode.Thinking]: "Deep Reasoning • Complex Roles",
    [GenerationMode.LowLatency]: "Fastest • Quick Drafts",
    [GenerationMode.SearchGrounding]: "Live Data • Search",
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, setMode, disabled = false }) => {
    return (
        <div className="mb-8 w-full">
            <div className="flex flex-col space-y-3">
                {/* Scrollable Container for Mobile */}
                <div className="w-full overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <div className="flex flex-nowrap sm:flex-wrap gap-3 min-w-max sm:min-w-0">
                        {Object.values(GenerationMode).map(mode => (
                            <button 
                                key={mode}
                                onClick={() => !disabled && setMode(mode)}
                                disabled={disabled}
                                className={`px-4 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 relative overflow-hidden group border
                                    ${currentMode === mode 
                                        ? 'text-white border-transparent shadow-lg shadow-purple-500/20' 
                                        : 'bg-white/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 border-white/20 dark:border-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:border-purple-200 dark:hover:border-purple-900/50'
                                    }
                                    ${disabled ? 'cursor-not-allowed opacity-50 grayscale' : ''}
                                `}
                            >
                                 {currentMode === mode && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-indigo-600 opacity-100" />
                                )}
                                <span className="relative z-10 whitespace-nowrap">{mode}</span>
                            </button>
                        ))}
                    </div>
                </div>
                
                <div className="px-1 flex items-center">
                     <div className={`w-1.5 h-1.5 rounded-full mr-2 transition-colors ${disabled ? 'bg-amber-500' : 'bg-purple-500'}`}></div>
                     <p className={`text-xs sm:text-sm font-medium transition-all duration-300 ${disabled ? "text-amber-600 dark:text-amber-500" : "text-gray-500 dark:text-gray-400"}`}>
                        {disabled ? "Switch input type to 'Text' to enable other modes." : MODE_DESCRIPTIONS[currentMode]}
                    </p>
                </div>
            </div>
        </div>
    );
};
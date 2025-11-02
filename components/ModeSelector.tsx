import React from 'react';
import { GenerationMode } from '../types';

interface ModeSelectorProps {
    currentMode: GenerationMode;
    setMode: (mode: GenerationMode) => void;
    disabled?: boolean;
}

const MODE_DESCRIPTIONS: Record<GenerationMode, string> = {
    [GenerationMode.Standard]: "Balanced approach using Gemini 2.5 Pro for high-quality results.",
    [GenerationMode.Thinking]: "Engages deep reasoning with max thinking budget for complex scenarios.",
    [GenerationMode.LowLatency]: "Uses a lightweight model for the fastest possible responses.",
    [GenerationMode.SearchGrounding]: "Connects to Google Search for up-to-date, factual information.",
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, setMode, disabled = false }) => {
    return (
        <div className={`mb-8 p-4 bg-gray-100 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg transition-opacity ${disabled ? 'opacity-50' : ''}`}>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3 text-center sm:text-left">Select Generation Mode</h2>
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {Object.values(GenerationMode).map(mode => (
                    <button 
                        key={mode}
                        onClick={() => !disabled && setMode(mode)}
                        disabled={disabled}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-50 dark:focus:ring-offset-gray-900
                            ${currentMode === mode 
                                ? 'bg-purple-600 text-white shadow-md' 
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }
                            ${disabled ? 'cursor-not-allowed' : ''}
                        `}
                    >
                        {mode}
                    </button>
                ))}
            </div>
            <p className="text-center sm:text-left mt-3 text-sm text-gray-500 dark:text-gray-400 min-h-[2.5rem] px-1">
                {disabled ? "Search Grounding mode is required when using a job URL." : MODE_DESCRIPTIONS[currentMode]}
            </p>
        </div>
    );
};
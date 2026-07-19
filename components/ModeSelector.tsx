import React from 'react';
import { GenerationMode } from '../types';
import { Segmented } from './UI';

interface ModeSelectorProps {
  currentMode: GenerationMode;
  setMode: (mode: GenerationMode) => void;
  disabled?: boolean;
}

const MODE_OPTIONS: GenerationMode[] = [
  GenerationMode.Standard,
  GenerationMode.Thinking,
  GenerationMode.LowLatency,
  GenerationMode.SearchGrounding,
];

const MODE_DESCRIPTIONS: Record<GenerationMode, string> = {
  [GenerationMode.Standard]: "Balanced — best for most roles",
  [GenerationMode.Thinking]: "Deep reasoning for complex roles",
  [GenerationMode.LowLatency]: "Fastest — quick drafts",
  [GenerationMode.SearchGrounding]: "Live data from a job URL",
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, setMode, disabled = false }) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
      <span className="text-xs font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500 hidden sm:inline">
        Mode
      </span>
      <Segmented
        options={MODE_OPTIONS}
        value={currentMode}
        onChange={setMode}
        disabled={disabled}
      />
      <p className={`text-xs hidden md:block ${disabled ? 'text-amber-600 dark:text-amber-500' : 'text-gray-500 dark:text-gray-400'}`}>
        {disabled
          ? "Switch input to “Text” to change modes."
          : MODE_DESCRIPTIONS[currentMode]}
      </p>
    </div>
  );
};

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

const MODE_META: Record<GenerationMode, { label: string; description: string }> = {
  [GenerationMode.Standard]: {
    label: 'Balanced',
    description: 'A well-rounded draft for most roles — clear, professional, and ready to refine.',
  },
  [GenerationMode.Thinking]: {
    label: 'Deep reasoning',
    description: 'More careful analysis of the role, ideal for senior or complex positions.',
  },
  [GenerationMode.LowLatency]: {
    label: 'Quick draft',
    description: 'Fastest option when you need a solid starting point right away.',
  },
  [GenerationMode.SearchGrounding]: {
    label: 'From URL',
    description: 'Reads the job posting from a link and tailors the letter to it.',
  },
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, setMode, disabled = false }) => {
  const meta = MODE_META[currentMode];
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <span className="text-xs font-medium uppercase tracking-wide text-accent2-600 dark:text-accent2-300">
          Mode
        </span>
        <Segmented
          options={MODE_OPTIONS}
          value={currentMode}
          onChange={setMode}
          disabled={disabled}
        />
      </div>

      <div className={`mt-3 rounded-lg border px-3.5 py-2.5 flex items-start gap-2.5 transition-colors
        ${disabled
          ? 'border-amber-300/60 dark:border-amber-700/50 bg-amber-50/60 dark:bg-amber-900/10'
          : 'border-accent-200 dark:border-accent-700/50 bg-accent-50/50 dark:bg-accent-900/10'}`}>
        <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${disabled ? 'bg-amber-500' : 'bg-accent-500'}`} />
        {disabled ? (
          <p className="text-[13px] text-amber-700 dark:text-amber-400 leading-snug">
            Switch the job input to “Text” to change modes.
          </p>
        ) : (
          <div className="space-y-0.5">
            <p className="text-[13px] font-semibold text-gray-800 dark:text-gray-100">
              {meta.label}
            </p>
            <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-snug">
              {meta.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

import React from 'react';
import { GenerationMode } from '../types';
import { Segmented } from './UI';
import { SparklesIcon } from './icons';

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

const MODE_META: Record<
  GenerationMode,
  { label: string; badge: string; description: string; model: string }
> = {
  [GenerationMode.Standard]: {
    label: 'Balanced Engine',
    badge: 'Recommended',
    description: 'Frontier reasoning with 1M context. Crafts polished, high-conviction letters for general and senior roles.',
    model: 'Nemotron 3 Ultra 550B',
  },
  [GenerationMode.Thinking]: {
    label: 'Deep Reasoning Mode',
    badge: 'High Precision',
    description: 'MoE reasoning model with deeper synthesis. Ideal for executive, principal, and cross-functional leadership roles.',
    model: 'Nemotron 3 Super 120B',
  },
  [GenerationMode.LowLatency]: {
    label: 'Quick Draft',
    badge: 'Fastest',
    description: 'High-speed generation designed for rapid iterations and clean starting drafts in seconds.',
    model: 'Gemma 4 26B',
  },
  [GenerationMode.SearchGrounding]: {
    label: 'URL Reader Engine',
    badge: 'Web Grounded',
    description: 'Directly reads and contextualizes job postings from career portals, bypassing manual copy-pasting.',
    model: 'Nemotron 3 Ultra 550B',
  },
};

export const ModeSelector: React.FC<ModeSelectorProps> = ({ currentMode, setMode, disabled = false }) => {
  const meta = MODE_META[currentMode];
  return (
    <div className="w-full space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-accent-700 dark:text-accent-300 flex items-center gap-1.5">
            <SparklesIcon className="w-3.5 h-3.5 text-accent-600 dark:text-accent-400" /> Model Intelligence
          </span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border border-accent-200/60 dark:border-accent-800/60">
            {meta.badge}
          </span>
        </div>
        <Segmented
          options={MODE_OPTIONS}
          value={currentMode}
          onChange={setMode}
          disabled={disabled}
        />
      </div>

      <div
        className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 transition-all duration-200 ${
          disabled
            ? 'border-amber-300/60 dark:border-amber-700/50 bg-amber-50/50 dark:bg-amber-900/10'
            : 'border-accent-200/70 dark:border-accent-800/50 bg-white/60 dark:bg-gray-900/40 backdrop-blur-sm shadow-xs'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
              disabled ? 'bg-amber-500' : 'bg-accent2-500 ring-2 ring-accent2-200 dark:ring-accent2-900'
            }`}
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
                {disabled ? 'URL Mode Active' : meta.label}
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                {meta.model}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {disabled
                ? 'Switch target job input to “Text” to select other AI models.'
                : meta.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

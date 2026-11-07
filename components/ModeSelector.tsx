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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 dark:text-stone-400 font-bold">
              Engine · Model Pipeline
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
              Synthesis Engine
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wide bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/80 font-semibold">
              {meta.badge}
            </span>
          </div>
        </div>
        <Segmented
          options={MODE_OPTIONS}
          value={currentMode}
          onChange={setMode}
          disabled={disabled}
          gridOnMobile={true}
        />
      </div>

      <div
        className={`rounded-xl border p-3.5 flex items-start justify-between gap-3 transition-all duration-200 ${
          disabled
            ? 'border-amber-300/80 dark:border-amber-700/70 bg-amber-50/60 dark:bg-amber-950/20'
            : 'border-stone-200/80 dark:border-stone-800/80 bg-white/70 dark:bg-stone-900/50 backdrop-blur-sm shadow-xs'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <span
            className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
              disabled ? 'bg-amber-500' : 'bg-stone-700 dark:bg-stone-300'
            }`}
          />
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                {disabled ? 'URL Mode Active' : meta.label}
              </span>
              <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono px-1.5 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60">
                {meta.model}
              </span>
            </div>
            <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
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

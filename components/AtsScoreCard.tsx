import React, { useState, useEffect } from 'react';
import { analyzeAtsSync, AtsAnalysisResult } from '../services/atsEngine';
import { SparklesIcon, CopyIcon, CheckIcon, ChevronDownIcon } from './icons';

interface AtsScoreCardProps {
  resumeText: string;
  jobText: string;
  onInjectPhrase?: (keyword: string, phrase: string) => void;
}

export const AtsScoreCard: React.FC<AtsScoreCardProps> = ({
  resumeText,
  jobText,
  onInjectPhrase,
}) => {
  const [analysis, setAnalysis] = useState<AtsAnalysisResult | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [injectedKeyword, setInjectedKeyword] = useState<string | null>(null);

  const getSuggestedPhrasing = (kw: string) => {
    const isUpper = kw.toUpperCase() === kw || kw.includes('/') || kw.includes('.');
    if (isUpper) {
      return `Architected and maintained production workflows utilizing ${kw}, ensuring high reliability, performance, and seamless system integration.`;
    }
    return `Spearheaded hands-on implementation with ${kw}, aligning technical architecture with mission-critical operational benchmarks.`;
  };

  const handleCopyPhrase = (kw: string) => {
    const phrase = getSuggestedPhrasing(kw);
    navigator.clipboard.writeText(phrase);
    setCopiedKeyword(kw);
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const handleInjectPhrase = (kw: string) => {
    if (!onInjectPhrase) return;
    const phrase = getSuggestedPhrasing(kw);
    onInjectPhrase(kw, phrase);
    setInjectedKeyword(kw);
    setTimeout(() => {
      setInjectedKeyword(null);
      setSelectedKeyword(null);
    }, 1200);
  };

  useEffect(() => {
    if (!resumeText.trim() || !jobText.trim()) {
      setAnalysis(null);
      return;
    }

    // Debounced real-time analysis
    const timer = setTimeout(() => {
      const result = analyzeAtsSync(resumeText, jobText);
      setAnalysis(result);
    }, 150);

    return () => clearTimeout(timer);
  }, [resumeText, jobText]);

  if (!analysis || analysis.score === 0) {
    return null;
  }

  const isHigh = analysis.score >= 80;
  const isMedium = analysis.score >= 60;

  const scoreBadgeColor = isHigh
    ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border-emerald-500/30'
    : isMedium
    ? 'text-amber-700 dark:text-amber-300 bg-amber-500/10 border-amber-500/30'
    : 'text-stone-700 dark:text-stone-300 bg-stone-500/10 border-stone-500/30';

  return (
    <div className="double-bezel">
      <div className="double-bezel-inner p-4 sm:p-5 space-y-3.5">
        {/* Header row: responsive stack on mobile, horizontal on tablet/desktop */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-auto">
            {/* Eyebrow & Rust AST Engine Badge */}
            <div className="flex items-center justify-between sm:justify-start gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-[10px] tracking-widest uppercase text-amber-700 dark:text-amber-400 font-bold">
                Intelligence · ATS Match
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[9.5px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-400/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 dark:border-amber-400/20 shadow-2xs">
                <span className="text-amber-600 dark:text-amber-400 font-bold">⚡</span> Rust AST Engine
              </span>
            </div>

            <h3 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400 flex-shrink-0" />
              ATS Keyword Alignment & Metrics
            </h3>
          </div>

          {/* Action Row: Score Badge + Inspect Keywords Toggle (aligned and balanced on mobile) */}
          <div className="flex items-center justify-between sm:justify-end gap-2.5 w-full sm:w-auto pt-1 sm:pt-0">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 shadow-2xs ${scoreBadgeColor}`}>
              <span className="text-sm sm:text-base font-extrabold">{analysis.score}%</span>
              <span className="text-[11px] font-sans font-medium tracking-normal opacity-90">
                {analysis.match_grade}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-expanded={expanded}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200 hover:text-stone-900 dark:hover:text-stone-50 px-3 py-1.5 rounded-xl border border-stone-300/90 dark:border-stone-700 bg-white dark:bg-stone-800/90 hover:bg-stone-50 dark:hover:bg-stone-700/80 active:scale-95 transition-all shadow-xs"
            >
              <span>{expanded ? 'Collapse' : 'Inspect Keywords'}</span>
              <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick summary chips row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400 pt-0.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100/90 dark:bg-stone-900/80 border border-stone-200/70 dark:border-stone-800 font-mono text-[10.5px] sm:text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
            {analysis.matched_keywords.length} matched terms
          </span>

          {analysis.missing_keywords.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100/90 dark:bg-stone-900/80 border border-stone-200/70 dark:border-stone-800 font-mono text-[10.5px] sm:text-[11px]">
              <span className="text-amber-600 dark:text-amber-400 font-bold">+</span>
              {analysis.missing_keywords.length} missing from resume
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100/90 dark:bg-stone-900/80 border border-stone-200/70 dark:border-stone-800 font-mono text-[10.5px] sm:text-[11px]">
            <SparklesIcon className="w-3 h-3 text-amber-500" />
            {analysis.quantifiable_metrics_count} quantifiable metrics
          </span>
        </div>

        {/* Expandable keyword breakdown */}
        {expanded && (
          <div className="pt-3 border-t border-stone-200/80 dark:border-stone-800/80 space-y-3.5 text-xs">
            {/* Matched keywords */}
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5 font-semibold">
                Matched Target Keywords ({analysis.matched_keywords.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matched_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/25 font-mono text-[11px]"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing keywords with interactive Alignment Injector */}
            {analysis.missing_keywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 font-semibold">
                    Missing Keywords · Tap chip to inject phrasing
                  </span>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 font-mono">
                    {analysis.missing_keywords.length} recommendations
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {analysis.missing_keywords.map((kw) => {
                    const isSelected = selectedKeyword === kw;
                    return (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => setSelectedKeyword(isSelected ? null : kw)}
                        title="Click to inspect suggested STAR phrasing"
                        className={`px-2 py-0.5 rounded-md font-mono text-[11px] transition-all cursor-pointer flex items-center gap-1 select-none ${
                          isSelected
                            ? 'bg-amber-600 text-stone-950 font-bold ring-2 ring-amber-500/50 shadow-xs scale-105'
                            : 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 hover:bg-amber-500/20 active:scale-95'
                        }`}
                      >
                        <span>+{kw}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Alignment Injector Phrasing Drawer */}
                {selectedKeyword && (
                  <div className="p-3 sm:p-3.5 rounded-xl border border-amber-300/80 dark:border-amber-700/60 bg-amber-50/70 dark:bg-amber-950/30 space-y-2.5 animate-in fade-in slide-in-from-top-1 duration-150 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                        <SparklesIcon className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        Alignment Injector · <span className="underline decoration-amber-500/60 underline-offset-2 break-all">{selectedKeyword}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedKeyword(null)}
                        className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 text-xs px-1.5 py-0.5 rounded transition-colors"
                        aria-label="Close phrasing suggestion"
                      >
                        ✕
                      </button>
                    </div>

                    <p className="text-[11.5px] sm:text-[12px] text-stone-700 dark:text-stone-300 italic leading-relaxed bg-white/70 dark:bg-stone-900/60 p-2.5 sm:p-3 rounded-lg border border-amber-200/60 dark:border-amber-800/50">
                      "{getSuggestedPhrasing(selectedKeyword)}"
                    </p>

                    <div className="flex items-center justify-end gap-2 pt-0.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleCopyPhrase(selectedKeyword)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 bg-white/80 dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 transition-colors shadow-2xs"
                        title="Copy phrasing to clipboard"
                      >
                        {copiedKeyword === selectedKeyword ? (
                          <>
                            <CheckIcon className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="w-3 h-3 text-stone-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {onInjectPhrase && (
                        <button
                          type="button"
                          onClick={() => handleInjectPhrase(selectedKeyword)}
                          disabled={Boolean(injectedKeyword)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-semibold text-stone-950 bg-amber-500 hover:bg-amber-400 active:scale-95 transition-all shadow-xs disabled:opacity-80 cursor-pointer"
                        >
                          {injectedKeyword === selectedKeyword ? (
                            <>
                              <CheckIcon className="w-3.5 h-3.5 text-stone-950" />
                              <span>Injected into Resume!</span>
                            </>
                          ) : (
                            <>
                              <SparklesIcon className="w-3.5 h-3.5 text-stone-950" />
                              <span>Auto-Inject into Resume</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Sample Metrics */}
            {analysis.sample_metrics.length > 0 && (
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1.5 font-semibold">
                  Detected Quantifiable Proof Points
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.sample_metrics.map((m, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-mono text-[11px]"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

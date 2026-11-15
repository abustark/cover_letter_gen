import React, { useState, useEffect } from 'react';
import { analyzeAtsSync, AtsAnalysisResult } from '../services/atsEngine';
import { SparklesIcon } from './icons';

interface AtsScoreCardProps {
  resumeText: string;
  jobText: string;
}

export const AtsScoreCard: React.FC<AtsScoreCardProps> = ({ resumeText, jobText }) => {
  const [analysis, setAnalysis] = useState<AtsAnalysisResult | null>(null);
  const [expanded, setExpanded] = useState(false);

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
      <div className="double-bezel-inner p-4 sm:p-5 space-y-3">
        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] tracking-widest uppercase text-amber-700 dark:text-amber-400 font-bold">
                Intelligence · ATS Keyword Match
              </span>
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border border-stone-200/80 dark:border-stone-700/80">
                ⚡ Rust AST Engine
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
              ATS Keyword Alignment & Metrics
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 ${scoreBadgeColor}`}>
              <span className="text-base font-extrabold">{analysis.score}%</span>
              <span className="text-[11px] font-sans font-medium tracking-normal opacity-90 hidden xs:inline">
                {analysis.match_grade}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-[11px] font-semibold text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 px-2.5 py-1.5 rounded-lg border border-stone-200/80 dark:border-stone-800 bg-stone-100/70 dark:bg-stone-900/60 transition-colors"
            >
              {expanded ? 'Collapse' : 'Inspect Keywords'}
            </button>
          </div>
        </div>

        {/* Quick summary chips row */}
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 dark:text-stone-400 pt-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800 font-mono text-[11px]">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
            {analysis.matched_keywords.length} matched terms
          </span>

          {analysis.missing_keywords.length > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800 font-mono text-[11px]">
              <span className="text-amber-600 dark:text-amber-400 font-bold">+</span>
              {analysis.missing_keywords.length} missing from resume
            </span>
          )}

          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-900/80 border border-stone-200/60 dark:border-stone-800 font-mono text-[11px]">
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

            {/* Missing keywords */}
            {analysis.missing_keywords.length > 0 && (
              <div>
                <div className="text-[11px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5 font-semibold">
                  Missing Keywords (Consider emphasizing in cover letter)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missing_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/25 font-mono text-[11px]"
                    >
                      +{kw}
                    </span>
                  ))}
                </div>
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

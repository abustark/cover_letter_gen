import React, { useState, useEffect, useMemo } from 'react';
import {
  SpinnerIcon,
  CopyIcon,
  RegenerateIcon,
  CheckIcon,
  SaveIcon,
  DownloadIcon,
  FileIcon,
  SparklesIcon,
} from './icons';
import { IconButton } from './UI';
import { downloadEditorialPdf } from '../services/pdfExportService';
import { generateInterviewQuestions } from '../services/interviewPrepService';

interface OutputSectionProps {
  coverLetter: string;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onSave: () => void;
  companyName: string;
  resumeText?: string;
  jobText?: string;
}

const CHECKLIST_ITEMS = [
  { id: 'company_role', label: 'Target employer and exact job title are verified' },
  { id: 'claims_match', label: 'All career accomplishments strictly match your resume' },
  { id: 'no_invented', label: 'Zero invented metrics, degrees, or certifications' },
  { id: 'tone_length', label: 'Length is focused (300-400 words) and tone is authentic' },
  { id: 'contact_refs', label: 'Salutation, contact details, and dates are accurate' },
];

const renderWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/\S+|www\.\S+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (part && part.match(urlRegex)) {
      const url = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-700 dark:text-accent-400 font-medium hover:underline underline-offset-2"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

export const OutputSection: React.FC<OutputSectionProps> = ({
  coverLetter,
  onRegenerate,
  onSave,
  companyName,
  isLoading,
  error,
  resumeText,
  jobText,
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);
  const [isInterviewPrepOpen, setIsInterviewPrepOpen] = useState(false);
  const [activeQuestionId, setActiveQuestionId] = useState<string>('q1');
  const [copiedAllPrep, setCopiedAllPrep] = useState(false);

  const interviewQuestions = useMemo(() => {
    if (!resumeText?.trim() && !jobText?.trim()) return [];
    return generateInterviewQuestions(resumeText || '', jobText || '', companyName);
  }, [resumeText, jobText, companyName]);

  const handleCopyAllPrep = () => {
    if (interviewQuestions.length === 0) return;
    const text = interviewQuestions
      .map(
        (q, idx) =>
          `Question ${idx + 1} (${q.competency}):\n"${q.question}"\n\nSTAR Talking Points:\n- Situation: ${q.star.situation}\n- Action: ${q.star.action}\n- Result: ${q.star.result}\n`
      )
      .join('\n---\n\n');
    navigator.clipboard.writeText(text);
    setCopiedAllPrep(true);
    setTimeout(() => setCopiedAllPrep(false), 2000);
  };

  const toggleCheck = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = CHECKLIST_ITEMS.filter((item) => checkedItems[item.id]).length;
  const progressPercent = Math.round((completedCount / CHECKLIST_ITEMS.length) * 100);

  const handleCopy = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      setCopied(true);
    }
  };

  const handleSaveWithFeedback = () => {
    onSave();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleDownloadPdf = async () => {
    if (!coverLetter) return;
    await downloadEditorialPdf(coverLetter, companyName);
  };

  const handleDownloadDocx = async () => {
    if (!coverLetter) return;
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: coverLetter.split('\n').map(
            (line) =>
              new Paragraph({
                children: [new TextRun({ text: line, size: 24, font: 'Times New Roman' })],
                spacing: { after: 120 },
              })
          ),
        },
      ],
    });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const sanitized = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    a.download = sanitized ? `Cover_Letter_${sanitized}.docx` : 'Cover_Letter.docx';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  useEffect(() => {
    setCopied(false);
    setCheckedItems({});
  }, [coverLetter]);

  const docTitle = companyName?.trim()
    ? `Tailored Application — ${companyName.trim()}`
    : 'Tailored Cover Letter';

  return (
    <div id="output-section" className="mt-14 scroll-mt-24 space-y-4">
      {/* Document Section Header & Floating Action Island */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-emerald-700 dark:text-emerald-400 font-bold">
              Output 03 · Final Manuscript
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 font-semibold">
              Live Synthesis
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-bold tracking-tight text-stone-900 dark:text-stone-50 flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20" />
            {isLoading ? 'Synthesizing Application Letter…' : coverLetter ? docTitle : 'Document Studio'}
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            {coverLetter
              ? 'Stationery grade formatting · Ready for review, download, or local archive'
              : 'Add your candidate credentials and target job above to draft'}
          </p>
        </div>

        {coverLetter && !isLoading && (
          <div className="flex flex-wrap items-center justify-end gap-1 rounded-xl bg-white/95 dark:bg-stone-900/95 border border-stone-200 dark:border-stone-800 p-1 shadow-xs backdrop-blur-md">
            <button
              onClick={handleSaveWithFeedback}
              title="Save to local drafts"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {saved ? (
                <CheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <SaveIcon className="w-3.5 h-3.5 text-stone-700 dark:text-stone-300" />
              )}
              <span>{saved ? 'Saved' : 'Save draft'}</span>
            </button>

            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
            >
              {copied ? (
                <CheckIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {interviewQuestions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsInterviewPrepOpen((v) => !v)}
                title="Toggle interview talking points and question prep"
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors select-none ${
                  isInterviewPrepOpen
                    ? 'bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                    : 'text-stone-700 dark:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800'
                }`}
              >
                <SparklesIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{isInterviewPrepOpen ? 'Hide Prep' : 'Interview Prep'}</span>
              </button>
            )}

            <div className="h-4 w-px bg-stone-200 dark:bg-stone-800 mx-0.5" />

            <IconButton label="Download PDF" onClick={handleDownloadPdf}>
              <DownloadIcon className="w-4 h-4 text-stone-600 dark:text-stone-300" />
            </IconButton>

            <IconButton label="Download DOCX" onClick={handleDownloadDocx}>
              <FileIcon className="w-4 h-4 text-stone-600 dark:text-stone-300" />
            </IconButton>

            <IconButton label="Regenerate" onClick={onRegenerate}>
              <RegenerateIcon className="w-4 h-4 text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100" />
            </IconButton>
          </div>
        )}
      </div>

      {/* Review Before Sending Checklist */}
      {coverLetter && !isLoading && (
        <div className="rounded-2xl border border-stone-200/90 dark:border-stone-800/90 bg-stone-50/80 dark:bg-stone-900/60 p-4 sm:p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-xs flex-shrink-0 border border-emerald-200/80 dark:border-emerald-800/80">
                ✓
              </span>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-100 font-mono">
                  Factuality & Alignment Audit
                </span>
                <span className="text-xs text-stone-600 dark:text-stone-400 font-mono">
                  {completedCount} of {CHECKLIST_ITEMS.length} verified ({progressPercent}%)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsChecklistOpen((v) => !v)}
              className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors self-end sm:self-auto"
            >
              {isChecklistOpen ? 'Collapse' : 'Show checklist'}
            </button>
          </div>

          {/* Progress track */}
          <div className="w-full bg-stone-200 dark:bg-stone-800 h-1 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-stone-900 dark:bg-stone-100 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isChecklistOpen && (
            <div className="mt-3.5 pt-3 border-t border-stone-200/60 dark:border-stone-800/60 space-y-2">
              <p className="text-[11px] text-stone-500 dark:text-stone-400">
                AI outputs should always be verified by the applicant. Confirm all points below before submitting:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {CHECKLIST_ITEMS.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 text-xs text-stone-700 dark:text-stone-300 cursor-pointer select-none group"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[item.id]}
                      onChange={() => toggleCheck(item.id)}
                      className="mt-0.5 rounded-md border-stone-300 dark:border-stone-700 text-stone-900 focus:ring-stone-500 cursor-pointer"
                    />
                    <span className="group-hover:text-stone-900 dark:group-hover:text-stone-100 transition-colors">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Match-Grounded Interview Readiness & Talking Points */}
      {coverLetter && !isLoading && isInterviewPrepOpen && interviewQuestions.length > 0 && (
        <div className="rounded-2xl border border-amber-300/80 dark:border-amber-800/80 bg-amber-50/70 dark:bg-amber-950/30 p-4 sm:p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/80 dark:border-amber-800/60">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[10px] tracking-widest uppercase text-amber-800 dark:text-amber-400 font-bold">
                  Preparation · Interview Readiness
                </span>
                <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border border-amber-300/80 dark:border-amber-700/80 font-semibold">
                  5 STAR Question Profiles
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600 dark:bg-amber-400" />
                Targeted Interview Questions & STAR Responses
              </h3>
              <p className="text-xs text-stone-600 dark:text-stone-400 mt-0.5">
                Derived directly from your verified resume accomplishments and target role requirements
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyAllPrep}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-950 dark:text-amber-100 bg-amber-200/90 dark:bg-amber-850 hover:bg-amber-300 dark:hover:bg-amber-750 border border-amber-300 dark:border-amber-700 transition-colors shadow-2xs self-start sm:self-auto"
            >
              {copiedAllPrep ? (
                <>
                  <CheckIcon className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                  <span>Copied All Questions!</span>
                </>
              ) : (
                <>
                  <CopyIcon className="w-3.5 h-3.5 text-amber-800 dark:text-amber-300" />
                  <span>Copy All Q&A</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3">
            {interviewQuestions.map((q, idx) => {
              const isOpen = activeQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  className="rounded-xl border border-amber-200/90 dark:border-amber-900/60 bg-white/85 dark:bg-stone-900/80 p-3.5 transition-all shadow-2xs"
                >
                  <button
                    type="button"
                    onClick={() => setActiveQuestionId(isOpen ? '' : q.id)}
                    className="w-full flex items-start justify-between text-left gap-3 select-none cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                          Q{idx + 1} · {q.category}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 font-medium">
                          {q.competency}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-[13px] font-bold text-stone-900 dark:text-stone-100 leading-snug">
                        "{q.question}"
                      </h4>
                    </div>

                    <span className="text-xs font-mono text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800">
                      {isOpen ? 'Collapse' : 'Expand'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3 border-t border-amber-200/60 dark:border-amber-900/50 space-y-2 text-xs leading-relaxed animate-in fade-in duration-100">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40">
                          <span className="font-mono text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block mb-1">
                            Situation & Context
                          </span>
                          <p className="text-stone-700 dark:text-stone-300 text-[11.5px]">
                            {q.star.situation}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40">
                          <span className="font-mono text-[10px] uppercase font-bold text-amber-800 dark:text-amber-300 block mb-1">
                            Action & Execution
                          </span>
                          <p className="text-stone-700 dark:text-stone-300 text-[11.5px]">
                            {q.star.action}
                          </p>
                        </div>

                        <div className="p-2.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-900/40">
                          <span className="font-mono text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-400 block mb-1">
                            Verified Result & Impact
                          </span>
                          <p className="text-stone-700 dark:text-stone-300 text-[11.5px]">
                            {q.star.result}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Luxury Document Surface Container */}
      <div className="double-bezel">
        <div className="double-bezel-inner overflow-hidden min-h-[55vh] relative doc-surface-card bg-stone-50/50 dark:bg-stone-950/60">
          {/* Subtle Top Rule */}
          <div className="h-0.5 bg-stone-200/80 dark:bg-stone-800/80" />

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-accent-50/20 dark:bg-accent-900/10">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-gray-800 shadow-md flex items-center justify-center mb-4 ring-1 ring-accent-200 dark:ring-accent-800 animate-pulse">
                <SpinnerIcon className="w-6 h-6 animate-spin text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
                Synthesizing Career Narrative…
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                Grounding your verified resume achievements directly in the role specifications.
              </p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
              <div className="w-12 h-12 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-center mb-4 text-red-600 dark:text-red-400 font-bold text-lg">
                !
              </div>
              <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 mb-1">
                Generation Encountered an Issue
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mb-5 leading-relaxed">
                {error}
              </p>
              <button
                onClick={onRegenerate}
                className="inline-flex items-center gap-1.5 bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
              >
                <RegenerateIcon className="w-4 h-4 mr-1" /> Retry Generation
              </button>
            </div>
          )}

          {/* Empty Placeholder State */}
          {!isLoading && !coverLetter && !error && (
            <div className="flex flex-col items-center justify-center min-h-[38vh] sm:min-h-[48vh] text-center p-6 sm:p-8">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 flex items-center justify-center mb-3 sm:mb-4 text-stone-600 dark:text-stone-300 shadow-2xs">
                <FileIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <p className="text-sm sm:text-base font-bold text-stone-800 dark:text-stone-200">
                Your Cover Letter Will Appear Here
              </p>
              <p className="text-xs mt-1.5 text-stone-400 dark:text-stone-500 max-w-sm leading-relaxed">
                Provide your candidate resume and target role above, then click Generate to produce a tailored letter.
              </p>
            </div>
          )}

          {/* Rendered Letter */}
          {!isLoading && coverLetter && (
            <div className="p-4 sm:p-12 overflow-y-auto">
              <article className="doc-surface px-5 sm:px-12 py-8 sm:py-14 text-stone-900 dark:text-stone-100 leading-8 sm:leading-9 text-[15px] sm:text-[16px] whitespace-pre-wrap font-serif tracking-normal selection:bg-amber-100 dark:selection:bg-stone-700 bg-[#fffdfa] dark:bg-stone-900 rounded-xl shadow-xs border border-stone-200/80 dark:border-stone-800/80">
                {renderWithLinks(coverLetter)}
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

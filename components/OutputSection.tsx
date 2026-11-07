import React, { useState, useEffect } from 'react';
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

interface OutputSectionProps {
  coverLetter: string;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onSave: () => void;
  companyName: string;
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
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isChecklistOpen, setIsChecklistOpen] = useState(true);

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
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textLines = doc.splitTextToSize(coverLetter, pageWidth - margin * 2);
    doc.setFont('times', 'normal');
    doc.setFontSize(11);
    doc.text(textLines, margin, margin);
    const sanitized = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(sanitized ? `Cover_Letter_${sanitized}.pdf` : 'Cover_Letter.pdf');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-gray-200/80 dark:border-gray-800/80">
        <div>
          <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-accent-500" />
            {isLoading ? 'Synthesizing Cover Letter…' : coverLetter ? docTitle : 'Document Preview Studio'}
          </h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {coverLetter
              ? 'Ready for review, download, or local archive'
              : 'Add your candidate credentials and target job above to draft'}
          </p>
        </div>

        {coverLetter && !isLoading && (
          <div className="flex items-center gap-1 rounded-2xl bg-white/90 dark:bg-gray-900/90 border border-gray-200/80 dark:border-gray-800/80 p-1 shadow-sm backdrop-blur-md">
            <button
              onClick={handleSaveWithFeedback}
              title="Save to local drafts"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {saved ? (
                <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <SaveIcon className="w-3.5 h-3.5 text-accent-600" />
              )}
              <span>{saved ? 'Saved' : 'Save draft'}</span>
            </button>

            <button
              onClick={handleCopy}
              title="Copy to clipboard"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {copied ? (
                <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5 text-gray-500" />
              )}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <div className="h-4 w-px bg-gray-200 dark:bg-gray-800 mx-0.5" />

            <IconButton label="Download PDF" onClick={handleDownloadPdf}>
              <DownloadIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </IconButton>

            <IconButton label="Download DOCX" onClick={handleDownloadDocx}>
              <FileIcon className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </IconButton>

            <IconButton label="Regenerate" onClick={onRegenerate}>
              <RegenerateIcon className="w-4 h-4 text-accent2-600 dark:text-accent2-400" />
            </IconButton>
          </div>
        )}
      </div>

      {/* Review Before Sending Checklist */}
      {coverLetter && !isLoading && (
        <div className="rounded-2xl border border-accent-200/60 dark:border-accent-800/60 bg-gradient-to-r from-accent-50/50 via-white to-accent2-50/40 dark:from-accent-950/20 dark:via-gray-900/40 dark:to-accent2-950/20 p-4 sm:p-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-accent-100 dark:bg-accent-900/50 flex items-center justify-center text-accent-700 dark:text-accent-300">
                <SparklesIcon className="w-3.5 h-3.5" />
              </span>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100">
                  Pre-Flight Factuality Checklist
                </span>
                <span className="ml-2 text-xs text-accent-700 dark:text-accent-300 font-semibold">
                  {completedCount} of {CHECKLIST_ITEMS.length} verified ({progressPercent}%)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsChecklistOpen((v) => !v)}
              className="text-xs font-semibold text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
            >
              {isChecklistOpen ? 'Collapse' : 'Show checklist'}
            </button>
          </div>

          {/* Progress track */}
          <div className="w-full bg-gray-200/80 dark:bg-gray-800/80 h-1 rounded-full mt-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-accent-600 to-accent2-500 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {isChecklistOpen && (
            <div className="mt-3.5 pt-3 border-t border-gray-200/60 dark:border-gray-800/60 space-y-2">
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                AI outputs should always be verified by the applicant. Confirm all points below before submitting:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {CHECKLIST_ITEMS.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-2.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer select-none group"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedItems[item.id]}
                      onChange={() => toggleCheck(item.id)}
                      className="mt-0.5 rounded-md border-gray-300 dark:border-gray-700 text-accent-600 focus:ring-accent-500/50 cursor-pointer"
                    />
                    <span className="group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Luxury Document Surface Container */}
      <div className="double-bezel">
        <div className="double-bezel-inner overflow-hidden min-h-[55vh] relative doc-surface-card bg-white dark:bg-gray-900">
          {/* Top Decorative Foil Rule */}
          <div className="h-1 bg-gradient-to-r from-accent-500 via-accent2-400 to-accent-600" />

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
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
              <div className="w-14 h-14 rounded-2xl bg-accent-50/80 dark:bg-accent-900/20 border border-accent-200/60 dark:border-accent-800/60 flex items-center justify-center mb-4 text-accent-600 dark:text-accent-300">
                <FileIcon className="w-6 h-6" />
              </div>
              <p className="text-base font-bold text-gray-800 dark:text-gray-200">
                Your Cover Letter Will Appear Here
              </p>
              <p className="text-xs mt-1.5 text-gray-400 dark:text-gray-500 max-w-sm leading-relaxed">
                Provide your candidate resume and target role above, then click Generate to produce a tailored letter.
              </p>
            </div>
          )}

          {/* Rendered Letter */}
          {!isLoading && coverLetter && (
            <div className="p-6 sm:p-14 overflow-y-auto">
              <article className="doc-surface px-4 sm:px-12 py-8 sm:py-14 text-gray-900 leading-8 sm:leading-9 text-[15px] sm:text-[16px] whitespace-pre-wrap font-serif tracking-normal selection:bg-accent2-200 bg-white rounded-lg shadow-xs border border-gray-100/80">
                {renderWithLinks(coverLetter)}
              </article>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

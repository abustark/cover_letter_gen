import React, { useState, useEffect } from 'react';
import { SpinnerIcon, CopyIcon, RegenerateIcon, CheckIcon, SaveIcon, DownloadIcon, FileIcon } from './icons';
import { IconButton } from './UI';

interface OutputSectionProps {
  coverLetter: string;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  onSave: () => void;
  companyName: string;
}

const renderWithLinks = (text: string) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/\S+|www\.\S+)/g;
  return text.split(urlRegex).map((part, index) => {
    if (part && part.match(urlRegex)) {
      const url = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-accent-700 dark:text-accent-500 font-medium hover:underline underline-offset-2">
          {part}
        </a>
      );
    }
    return part;
  });
};

export const OutputSection: React.FC<OutputSectionProps> = ({
  coverLetter, onRegenerate, onSave, companyName, isLoading, error
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (coverLetter) {
      navigator.clipboard.writeText(coverLetter);
      setCopied(true);
    }
  };

  const handleDownloadPdf = async () => {
    if (!coverLetter) return;
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const margin = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const textLines = doc.splitTextToSize(coverLetter, pageWidth - margin * 2);
    doc.setFont('helvetica');
    doc.setFontSize(11);
    doc.text(textLines, margin, margin);
    const sanitized = companyName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(sanitized ? `Cover_Letter_${sanitized}.pdf` : 'Cover_Letter.pdf');
  };

  const handleDownloadDocx = async () => {
    if (!coverLetter) return;
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    const doc = new Document({
      sections: [{
        properties: {},
        children: coverLetter.split('\n').map(line => 
          new Paragraph({
            children: [new TextRun({ text: line, size: 24 })],
            spacing: { after: 120 },
          })
        ),
      }],
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

  useEffect(() => { setCopied(false); }, [coverLetter]);

  const docTitle = companyName?.trim() ? `Cover Letter — ${companyName.trim()}` : 'Your Cover Letter';

  return (
    <div id="output-section" className="mt-12">

      {/* Document toolbar */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100 truncate">
          {isLoading ? 'Generating…' : (coverLetter ? docTitle : 'Cover Letter')}
        </h2>
        {coverLetter && !isLoading && (
          <div className="flex items-center gap-1">
            <IconButton label="Save draft" onClick={onSave}>
              <SaveIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </IconButton>
            <IconButton label={copied ? 'Copied' : 'Copy'} onClick={handleCopy}>
              {copied ? <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" /> : <CopyIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
            </IconButton>
            <IconButton label="Download PDF" onClick={handleDownloadPdf}>
              <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </IconButton>
            <IconButton label="Download DOCX" onClick={handleDownloadDocx}>
              <FileIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </IconButton>
            <IconButton label="Regenerate" onClick={onRegenerate}>
              <RegenerateIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </IconButton>
          </div>
        )}
      </div>

      {/* Document surface */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden min-h-[50vh] relative">

        {/* Accent rule across the top of the document */}
        <div className="h-0.5 bg-gradient-to-r from-accent-500 via-accent2-500 to-accent-500" />

        {isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8 bg-accent-50/30 dark:bg-accent-900/5">
            <SpinnerIcon className="w-8 h-8 mb-4 animate-spin text-accent-600" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Crafting a tailored cover letter from your inputs.</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center mb-5">
              <span className="text-xl text-red-500">!</span>
            </div>
            <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-100 mb-2">Generation failed</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-6 leading-relaxed">{error}</p>
            <button onClick={onRegenerate}
              className="inline-flex items-center bg-accent-600 hover:bg-accent-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors focus-ring">
              <RegenerateIcon className="w-4 h-4 mr-2" /> Try again
            </button>
          </div>
        )}

        {!isLoading && !coverLetter && !error && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-8">
            <div className="w-12 h-12 rounded-xl bg-accent-50 dark:bg-accent-900/20 flex items-center justify-center mb-5">
              <FileIcon className="w-6 h-6 text-accent-500 dark:text-accent-300" />
            </div>
            <p className="text-base font-medium text-gray-700 dark:text-gray-200">Your cover letter will appear here</p>
            <p className="text-sm mt-1.5 text-gray-500 dark:text-gray-400 max-w-sm">Add your resume and job details above, then generate.</p>
          </div>
        )}

        {!isLoading && coverLetter && (
          <div className="p-6 sm:p-12 overflow-y-auto custom-scrollbar">
            <article className="doc-surface px-2 sm:px-10 py-8 sm:py-12 text-gray-800 dark:text-gray-800 leading-7 sm:leading-8 text-[15px] sm:text-base whitespace-pre-wrap font-sans">
              {renderWithLinks(coverLetter)}
            </article>
          </div>
        )}
      </div>
    </div>
  );
};

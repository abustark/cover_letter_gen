import React, { useState, useRef } from 'react';
import { Draft } from '../types';
import { TrashIcon, FileIcon, SparklesIcon, DownloadIcon, UploadIcon, CheckIcon } from './icons';
import { SectionTitle, IconButton } from './UI';
import { exportDraftsBackup, importDraftsBackup } from '../services/draftStorage';

interface DraftsSectionProps {
  drafts: Draft[];
  onLoad: (draft: Draft) => void;
  onDelete: (draftId: string) => void;
  onClearAll: () => void;
  onImportDrafts?: (drafts: Draft[]) => void;
}

export const DraftsSection: React.FC<DraftsSectionProps> = ({
  drafts,
  onLoad,
  onDelete,
  onClearAll,
  onImportDrafts,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all saved drafts? This cannot be undone.')) {
      onClearAll();
      showFeedback('All drafts cleared.');
    }
  };

  const handleExport = () => {
    if (drafts.length === 0) return;
    exportDraftsBackup(drafts);
    showFeedback(`Exported ${drafts.length} drafts as JSON backup.`);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content !== 'string') return;

      const result = importDraftsBackup(content, drafts);
      if (result.success) {
        if (onImportDrafts) {
          onImportDrafts(result.merged);
        }
        showFeedback(`✓ Successfully imported ${result.addedCount} new drafts!`);
      } else {
        showFeedback(`Import error: ${result.error || 'Invalid file format.'}`);
      }
    };
    reader.readAsText(file);
    // Reset file input so re-selecting the same file fires onChange
    e.target.value = '';
  };

  if (drafts.length === 0) {
    return (
      <div className="mt-16 space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          accept=".json,application/json"
          onChange={handleFileChange}
          className="hidden"
          aria-hidden="true"
        />

        <div className="flex items-center justify-between pb-3 border-b border-stone-200/80 dark:border-stone-800/80">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 dark:text-stone-400 font-bold">
                Archive 04 · Local Repository
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-stone-700 dark:bg-stone-300" />
              Saved Drafts Library
            </h2>
          </div>

          <button
            type="button"
            onClick={handleImportClick}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700/80 transition-colors shadow-2xs"
          >
            <UploadIcon className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>Import Backup</span>
          </button>
        </div>

        {feedback && (
          <div className="p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-700/80 bg-amber-50/80 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 font-medium animate-in fade-in">
            {feedback}
          </div>
        )}

        <div className="rounded-2xl border border-dashed border-stone-200 dark:border-stone-800 p-8 text-center bg-stone-50/40 dark:bg-stone-900/20">
          <FileIcon className="w-8 h-8 text-stone-400 mx-auto mb-2 opacity-50" />
          <p className="text-xs text-stone-500 dark:text-stone-400">
            No local drafts saved yet. Letters you save or import will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-16 space-y-4">
      <input
        type="file"
        ref={fileInputRef}
        accept=".json,application/json"
        onChange={handleFileChange}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/80 dark:border-stone-800/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-widest uppercase text-stone-500 dark:text-stone-400 font-bold">
              Archive 04 · Local Repository
            </span>
          </div>
          <h2 className="text-sm sm:text-base font-bold tracking-tight text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-stone-700 dark:bg-stone-300" />
            Saved Drafts Library
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80">
              {drafts.length}
            </span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Archived locally in your browser — reload any previous draft with one click
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={handleExport}
            title="Download JSON archive of all saved drafts"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700/80 transition-colors shadow-2xs"
          >
            <DownloadIcon className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>Export Backup</span>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            title="Restore drafts from a JSON backup file"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 dark:text-stone-200 bg-stone-100 hover:bg-stone-200/80 dark:bg-stone-800 dark:hover:bg-stone-700 border border-stone-200/80 dark:border-stone-700/80 transition-colors shadow-2xs"
          >
            <UploadIcon className="w-3.5 h-3.5 text-stone-600 dark:text-stone-400" />
            <span>Import Backup</span>
          </button>

          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors px-1.5 py-1"
          >
            Clear all
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed((o) => !o)}
            className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors px-1.5 py-1"
          >
            {isCollapsed ? 'Expand library' : 'Collapse'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-2.5 rounded-xl border border-amber-300/80 dark:border-amber-700/80 bg-amber-50/80 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 font-medium animate-in fade-in">
          {feedback}
        </div>
      )}

      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((draft) => {
            const initial = (draft.companyName || 'U').charAt(0).toUpperCase();
            return (
              <div
                key={draft.id}
                onClick={() => onLoad(draft)}
                className="group relative rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/90 dark:border-stone-800/90 p-4 hover:border-stone-400 dark:hover:border-stone-600 hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-2xs">
                      {initial}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate group-hover:text-amber-800 dark:group-hover:text-amber-300 transition-colors">
                        {draft.companyName}
                      </h3>
                      <p className="text-[11px] text-stone-400 dark:text-stone-500 mt-0.5">
                        {new Date(draft.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  <IconButton
                    label="Delete draft"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(draft.id);
                    }}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </IconButton>
                </div>

                <div className="mt-3.5 pt-2.5 border-t border-gray-100 dark:border-gray-800/60 flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500">
                  <span className="line-clamp-1 italic text-gray-400">
                    {draft.coverLetter.slice(0, 45)}…
                  </span>
                  <span className="font-semibold text-accent2-600 dark:text-accent2-400 ml-2 flex-shrink-0">
                    Load draft →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

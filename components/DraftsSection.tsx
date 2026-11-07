import React, { useState } from 'react';
import { Draft } from '../types';
import { TrashIcon, FileIcon, SparklesIcon } from './icons';
import { SectionTitle, IconButton } from './UI';

interface DraftsSectionProps {
  drafts: Draft[];
  onLoad: (draft: Draft) => void;
  onDelete: (draftId: string) => void;
  onClearAll: () => void;
}

export const DraftsSection: React.FC<DraftsSectionProps> = ({
  drafts,
  onLoad,
  onDelete,
  onClearAll,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (drafts.length === 0) return null;

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all saved drafts? This cannot be undone.')) {
      onClearAll();
    }
  };

  return (
    <div className="mt-16 space-y-4">
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
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-stone-200/80 dark:border-stone-700/80">
              {drafts.length}
            </span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            Archived locally in your browser — reload any previous draft with one click
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs font-semibold text-stone-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed((o) => !o)}
            className="text-xs font-semibold text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
          >
            {isCollapsed ? 'Expand library' : 'Collapse'}
          </button>
        </div>
      </div>

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

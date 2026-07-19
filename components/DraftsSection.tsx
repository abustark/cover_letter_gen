import React, { useState } from 'react';
import { Draft } from '../types';
import { TrashIcon, FileIcon } from './icons';
import { SectionTitle, IconButton } from './UI';

interface DraftsSectionProps {
  drafts: Draft[];
  onLoad: (draft: Draft) => void;
  onDelete: (draftId: string) => void;
}

export const DraftsSection: React.FC<DraftsSectionProps> = ({ drafts, onLoad, onDelete }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (drafts.length === 0) return null;

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-5">
        <SectionTitle hint={`${drafts.length}`}>Saved Drafts</SectionTitle>
        <button
          onClick={() => setIsCollapsed(o => !o)}
          className="text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          {isCollapsed ? 'Show all' : 'Hide'}
        </button>
      </div>

      {!isCollapsed && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {drafts.map((draft) => (
            <div
              key={draft.id}
              onClick={() => onLoad(draft)}
              className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-gray-300 dark:hover:border-gray-700 hover:shadow-sm transition-all duration-150 cursor-pointer"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-500 dark:text-gray-400 flex-shrink-0">
                    <FileIcon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 truncate">
                      {draft.companyName}
                    </h3>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(draft.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
                <IconButton
                  label="Delete draft"
                  onClick={(e) => { e.stopPropagation(); onDelete(draft.id); }}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                >
                  <TrashIcon className="w-4 h-4" />
                </IconButton>
              </div>
              <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">Click to load</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

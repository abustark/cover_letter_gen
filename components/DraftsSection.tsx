import React, { useState } from 'react';
import { Draft } from '../types';
import { TrashIcon, FileIcon } from './icons';

interface DraftsSectionProps {
    drafts: Draft[];
    onLoad: (draft: Draft) => void;
    onDelete: (draftId: string) => void;
}

export const DraftsSection: React.FC<DraftsSectionProps> = ({ drafts, onLoad, onDelete }) => {
    const [isCollapsed, setIsCollapsed] = useState(false);

    if (drafts.length === 0) {
        return null; // Don't show the section if there are no drafts
    }

    return (
        <div className="mt-12">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-700 dark:text-gray-300">My Drafts</h2>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-sm text-purple-500 dark:text-purple-400 hover:underline"
                >
                    {isCollapsed ? 'Show' : 'Hide'}
                </button>
            </div>
            {!isCollapsed && (
                <div className="space-y-4">
                    {drafts.map(draft => (
                        <div key={draft.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center">
                                <FileIcon className="w-6 h-6 mr-4 text-purple-500 dark:text-purple-400 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold text-gray-800 dark:text-gray-200">{draft.companyName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                        Saved on {new Date(draft.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => onLoad(draft)}
                                    className="px-4 py-1.5 text-sm font-semibold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-md hover:bg-purple-200 dark:hover:bg-purple-900 transition-colors"
                                >
                                    Load
                                </button>
                                <button
                                    onClick={() => onDelete(draft.id)}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    title="Delete draft"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
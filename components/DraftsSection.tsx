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
        return null;
    }

    return (
        <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
             <div className="flex justify-between items-center mb-6 px-1">
                <div className="flex items-center space-x-3">
                     <h2 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-700 to-gray-900 dark:from-gray-100 dark:to-gray-400">
                        Saved Drafts
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800/50">
                        {drafts.length}
                    </span>
                </div>
                <button 
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                    {isCollapsed ? 'Show All' : 'Hide'}
                </button>
            </div>
            
            {!isCollapsed && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {drafts.map((draft, index) => (
                        <div 
                            key={draft.id} 
                            style={{ animationDelay: `${index * 50}ms` }}
                            className="group relative bg-white/60 dark:bg-gray-900/40 border border-white/50 dark:border-white/5 rounded-2xl p-5 backdrop-blur-md shadow-sm hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 animate-in fade-in zoom-in-95 cursor-pointer"
                            onClick={() => onLoad(draft)}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3 overflow-hidden">
                                     <div className="p-2.5 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/40 dark:to-indigo-900/40 rounded-xl text-purple-600 dark:text-purple-300 flex-shrink-0">
                                        <FileIcon className="w-5 h-5" />
                                     </div>
                                     <div className="min-w-0">
                                        <h3 className="font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                            {draft.companyName}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                            {new Date(draft.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center opacity-80 group-hover:opacity-100 transition-opacity">
                                <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">
                                    Click to Load
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(draft.id);
                                    }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Delete draft"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
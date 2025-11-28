
import React, { useState, useEffect } from 'react';
import type { GroundingChunk } from "@google/genai";
import { SpinnerIcon, CopyIcon, RegenerateIcon, CheckIcon, LinkIcon, SaveIcon, DownloadIcon, FileIcon } from './icons';

// Tell TypeScript about the global jspdf variable from the script tag
declare const jspdf: any;

interface OutputSectionProps {
    coverLetter: string;
    isLoading: boolean;
    error: string | null;
    onRegenerate: () => void;
    onSave: () => void;
    groundingSources: GroundingChunk[];
    isLoggedIn: boolean;
    companyName: string;
}

const renderWithLinks = (text: string) => {
    if (!text) return null;
    const urlRegex = /(https?:\/\/\S+|www\.\S+)/g;
    return text.split(urlRegex).map((part, index) => {
        if (part && part.match(urlRegex)) {
            const url = part.startsWith('www.') ? `https://${part}` : part;
            return (
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-medium hover:underline decoration-blue-400/50 transition-colors">
                    {part}
                </a>
            );
        }
        return part;
    });
};


export const OutputSection: React.FC<OutputSectionProps> = ({
    coverLetter,
    isLoading,
    error,
    onRegenerate,
    onSave,
    groundingSources,
    isLoggedIn,
    companyName,
}) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (coverLetter) {
            navigator.clipboard.writeText(coverLetter);
            setCopied(true);
        }
    };

    const handleDownloadPdf = () => {
        if (!coverLetter) return;
        const { jsPDF } = jspdf;
        const doc = new jsPDF();
        const margin = 20;
        const pageWidth = doc.internal.pageSize.getWidth();
        const textLines = doc.splitTextToSize(coverLetter, pageWidth - margin * 2);

        doc.setFont('helvetica');
        doc.setFontSize(11);
        doc.text(textLines, margin, margin);
        
        const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = sanitizedCompanyName ? `Cover_Letter_${sanitizedCompanyName}.pdf` : 'Cover_Letter.pdf';
        doc.save(fileName);
    };

    useEffect(() => {
        if (copied) {
            const timer = setTimeout(() => setCopied(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [copied]);
    
    // Reset copied state when a new letter is generated
    useEffect(() => {
        setCopied(false);
    }, [coverLetter])

    const renderGroundingSources = () => {
        if (!groundingSources || groundingSources.length === 0) return null;

        const uniqueSources = groundingSources.reduce((acc, chunk) => {
            if (chunk.web && chunk.web.uri && !acc.some(item => item.uri === chunk.web.uri)) {
                acc.push({ uri: chunk.web.uri, title: chunk.web.title || chunk.web.uri });
            }
            return acc;
        }, [] as { uri: string, title: string }[]);

        if (uniqueSources.length === 0) return null;

        return (
            <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-gray-700/50">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-3 flex items-center">
                    <LinkIcon className="w-3 h-3 mr-2" />
                    Verified Sources
                </h4>
                <div className="flex flex-wrap gap-2">
                    {uniqueSources.map((source, index) => (
                        <a
                            key={index}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-white/50 dark:bg-black/20 text-blue-600 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 transition-all hover:scale-105"
                            title={source.title}
                        >
                           <LinkIcon className="w-3 h-3 mr-1.5 opacity-70" /> {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                        </a>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div id="output-section" className="mt-12 transition-all duration-700 ease-in-out">
             {/* Glass Container - Resembles paper on glass */}
            <div className={`relative min-h-[50vh] w-full rounded-2xl sm:rounded-3xl shadow-2xl transition-all duration-500 overflow-hidden border border-white/40 dark:border-white/5 ring-1 ring-black/5
                 ${isLoading ? 'bg-white/30 dark:bg-gray-900/30 backdrop-blur-sm' : 'bg-white/90 dark:bg-[#0f1115]/90 backdrop-blur-2xl'}
            `}>
                
                {/* Header Strip Gradient */}
                <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-purple-500 via-indigo-500 to-pink-500 opacity-80" />

                {/* Loading State */}
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-4 text-center">
                        <div className="relative mb-8">
                            <div className="w-24 h-24 border-4 border-purple-200 dark:border-purple-900/30 rounded-full animate-pulse"></div>
                            <div className="absolute top-0 left-0 w-24 h-24 border-t-4 border-purple-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl">✨</span>
                            </div>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Generating...</h3>
                        <p className="text-base text-gray-500 dark:text-gray-400 max-w-sm animate-pulse">
                            Gemini is analyzing your resume and tailoring a professional narrative.
                        </p>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center p-8 min-h-[400px]">
                        <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6 ring-4 ring-red-50 dark:ring-red-900/10">
                             <span className="text-3xl text-red-500">⚠️</span>
                        </div>
                        <h3 className="font-bold text-2xl text-gray-800 dark:text-gray-200 mb-2">Generation Failed</h3>
                        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8 leading-relaxed">{error}</p>
                        <button
                            onClick={onRegenerate}
                            className="flex items-center bg-gray-900 dark:bg-white hover:bg-gray-700 dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold py-3 px-8 rounded-xl transition-all hover:scale-105 shadow-xl"
                        >
                            <RegenerateIcon className="w-5 h-5 mr-2" />
                            Try Again
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !coverLetter && !error && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] h-full text-center p-8 opacity-60">
                        <div className="w-32 h-32 mb-8 rounded-3xl bg-gradient-to-tr from-gray-100 to-white dark:from-gray-800 dark:to-gray-900 flex items-center justify-center transform rotate-6 border border-white/50 dark:border-white/5 shadow-2xl">
                             <div className="w-24 h-24 rounded-2xl bg-white dark:bg-gray-800 shadow-inner flex items-center justify-center">
                                 <FileIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                             </div>
                        </div>
                        <p className="text-2xl font-bold text-gray-400 dark:text-gray-500">Ready to write</p>
                        <p className="text-base mt-2 text-gray-400 dark:text-gray-500">Your tailored cover letter will appear here.</p>
                    </div>
                )}

                {/* Content State */}
                {!isLoading && coverLetter && (
                    <div className="relative h-full flex flex-col">
                        {/* Toolbar - Sticky */}
                        <div className="sticky top-0 z-30 flex justify-between items-center px-4 sm:px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
                             <div className="flex items-center">
                                 <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                                 <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                                    Result
                                 </h3>
                             </div>
                             <div className="flex space-x-1 sm:space-x-2">
                                  {isLoggedIn && (
                                    <button onClick={onSave} className="action-btn group" title="Save Draft">
                                        <SaveIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
                                    </button>
                                )}
                                <button onClick={handleDownloadPdf} className="action-btn group" title="Download PDF">
                                    <DownloadIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                                </button>
                                <button onClick={handleCopy} className="action-btn group" title="Copy Text">
                                    {copied ? <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" /> : <CopyIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 dark:text-gray-400 group-hover:text-green-600 dark:group-hover:text-green-400" />}
                                </button>
                                <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1 self-center"></div>
                                <button onClick={onRegenerate} className="action-btn group bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800/30" title="Regenerate">
                                    <RegenerateIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400 group-hover:rotate-180 transition-transform duration-500" />
                                </button>
                             </div>
                        </div>

                        {/* Paper Content */}
                        <div className="flex-grow p-5 sm:p-12 overflow-y-auto custom-scrollbar">
                            <div className="max-w-3xl mx-auto bg-white dark:bg-[#15171b] shadow-sm border border-gray-100 dark:border-gray-800 rounded-lg p-6 sm:p-12 min-h-[500px] text-gray-800 dark:text-gray-200 font-sans leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                                 {renderWithLinks(coverLetter)}
                            </div>
                            <div className="max-w-3xl mx-auto mt-4 sm:mt-8 px-2 sm:px-0">
                                {renderGroundingSources()}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            
             {/* Custom Styles for buttons in this file */}
            <style>{`
                .action-btn {
                    @apply p-2 sm:p-2.5 rounded-lg bg-transparent hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-700 active:scale-95;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background-color: rgba(156, 163, 175, 0.3);
                    border-radius: 20px;
                }
            `}</style>
        </div>
    );
};

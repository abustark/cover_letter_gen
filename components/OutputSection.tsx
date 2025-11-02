import React, { useState, useEffect } from 'react';
import type { GroundingChunk } from "@google/genai";
import { SpinnerIcon, CopyIcon, RegenerateIcon, CheckIcon, LinkIcon, SaveIcon, DownloadIcon } from './icons';

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
                <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="text-blue-500 dark:text-blue-400 hover:underline">
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
        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const textLines = doc.splitTextToSize(coverLetter, pageWidth - margin * 2);

        doc.setFontSize(12);
        doc.text(textLines, margin, margin);
        
        const sanitizedCompanyName = companyName.replace(/[^a-zA-Z0-9]/g, '_');
        const fileName = sanitizedCompanyName ? `Cover_Letter_for_${sanitizedCompanyName}.pdf` : 'Cover_Letter.pdf';
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

    const hasOutput = coverLetter || error;

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
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2 flex items-center">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Sources
                </h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                    {uniqueSources.map((source, index) => (
                        <li key={index}>
                            <a
                                href={source.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 dark:text-blue-400 hover:underline break-all"
                                title={source.title}
                            >
                                {source.title}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        );
    };

    return (
        <div id="output-section" className="mt-8">
            <h2 className="text-2xl font-bold text-center text-gray-700 dark:text-gray-300 mb-4">
                Generated Cover Letter
            </h2>
            <div className="relative min-h-[30rem] w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-6 shadow-lg transition-all duration-300">
                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm z-10 rounded-lg">
                        <SpinnerIcon className="w-12 h-12" />
                        <p className="mt-4 text-lg font-semibold text-gray-600 dark:text-gray-300">Generating your cover letter...</p>
                        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">This may take a few moments.</p>
                    </div>
                )}
                {error && !isLoading && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-red-500 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/50 rounded-md">
                        <h3 className="font-bold text-lg">An Error Occurred</h3>
                        <p className="mt-2">{error}</p>
                        <button
                            onClick={onRegenerate}
                            className="mt-4 flex items-center mx-auto bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors"
                        >
                            <RegenerateIcon className="w-5 h-5 mr-2" />
                            Try Again
                        </button>
                    </div>
                )}
                {!isLoading && !hasOutput && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                        <p className="text-lg">Your generated cover letter will appear here.</p>
                        <p className="text-sm mt-2">Fill in the details above and click "Generate" to start.</p>
                    </div>
                )}
                {!isLoading && coverLetter && (
                    <>
                        <div className="absolute top-4 right-4 flex items-center space-x-2">
                             {isLoggedIn && (
                                <button
                                    onClick={onSave}
                                    className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                    title="Save Draft"
                                >
                                   <SaveIcon className="w-5 h-5" />
                                </button>
                            )}
                            <button
                                onClick={handleDownloadPdf}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                title="Download as PDF"
                            >
                                <DownloadIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={onRegenerate}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                title="Regenerate"
                            >
                                <RegenerateIcon className="w-5 h-5" />
                            </button>
                            <button
                                onClick={handleCopy}
                                className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                                title="Copy to clipboard"
                            >
                                {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="whitespace-pre-wrap font-sans text-gray-800 dark:text-gray-200 leading-relaxed overflow-y-auto max-h-[calc(30rem-3rem)] pr-4">
                             {renderWithLinks(coverLetter)}
                        </div>
                        {renderGroundingSources()}
                    </>
                )}
            </div>
        </div>
    );
};
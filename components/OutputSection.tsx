
import React, { useState } from 'react';
import { CopyIcon, RegenerateIcon, SpinnerIcon, CheckIcon, LinkIcon } from './icons';
import type { GroundingChunk } from "@google/genai";


interface OutputSectionProps {
  coverLetter: string;
  isLoading: boolean;
  error: string | null;
  onRegenerate: () => void;
  groundingSources: GroundingChunk[];
}

const Placeholder = () => (
  <div className="flex flex-col items-center justify-center h-full text-gray-500">
    <div className="w-16 h-16 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-16 h-16">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
        </svg>
    </div>
    <p className="text-xl">Your generated cover letter will appear here.</p>
    <p className="text-sm mt-1">Fill in your resume and job description, then click generate.</p>
  </div>
);

export const OutputSection: React.FC<OutputSectionProps> = ({
  coverLetter,
  isLoading,
  error,
  onRegenerate,
  groundingSources
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasContent = !isLoading && !error && coverLetter;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold text-center mb-4 text-gray-300">Generated Cover Letter</h2>
      <div className="relative bg-gray-800 border border-gray-700 rounded-lg min-h-[30rem] p-6 shadow-2xl">
        {hasContent && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 bg-gray-700 hover:bg-purple-600 rounded-md transition-colors text-gray-300 hover:text-white"
              title="Copy to clipboard"
            >
              {copied ? <CheckIcon className="w-5 h-5" /> : <CopyIcon className="w-5 h-5" />}
            </button>
            <button
              onClick={onRegenerate}
              className="p-2 bg-gray-700 hover:bg-purple-600 rounded-md transition-colors text-gray-300 hover:text-white"
              title="Regenerate"
            >
              <RegenerateIcon className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="prose prose-invert prose-p:text-gray-300 prose-headings:text-gray-100 max-w-none whitespace-pre-wrap">
          {isLoading && (
            <div className="flex items-center justify-center h-full absolute inset-0">
              <SpinnerIcon className="w-12 h-12" />
            </div>
          )}
          {error && <p className="text-red-400 text-center">{error}</p>}
          {!isLoading && !error && !coverLetter && <Placeholder />}
          {coverLetter && <p>{coverLetter}</p>}
        </div>

        {groundingSources.length > 0 && (
            <div className="mt-6 border-t border-gray-700 pt-4">
                <h3 className="text-sm font-semibold text-gray-400 mb-2 flex items-center">
                    <LinkIcon className="w-4 h-4 mr-2" />
                    Sources
                </h3>
                <ul className="list-none p-0 m-0 space-y-1">
                    {groundingSources.map((source, index) => (
                       source.web?.uri && (
                        <li key={index}>
                            <a 
                                href={source.web.uri} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-purple-400 hover:text-purple-300 hover:underline truncate"
                            >
                                {source.web.title || source.web.uri}
                            </a>
                        </li>
                       )
                    ))}
                </ul>
            </div>
        )}
      </div>
    </div>
  );
};

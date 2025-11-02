
import React, { useRef, useState, ChangeEvent } from 'react';
import { SparklesIcon, UploadIcon, FileIcon, SpinnerIcon } from './icons';
import { JobDescriptionInputType } from '../types';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';

// Let Vite find the worker file from your installed package
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

declare const mammoth: any; // For mammoth.js from global scope, added via script tag in index.html

interface InputSectionProps {
  resume: string;
  setResume: (value: string) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  jobUrl: string;
  setJobUrl: (value: string) => void;
  jobInputType: JobDescriptionInputType;
  setJobInputType: (type: JobDescriptionInputType) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  resume, setResume, jobDescription, setJobDescription, jobUrl, setJobUrl, jobInputType, setJobInputType,
  onGenerate, isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileParsing(true);
    setFileName(file.name);
    setFileError('');
    setResume('');

    try {
      const arrayBuffer = await file.arrayBuffer();
      let text = '';
      if (file.type === 'application/pdf') {
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;
        const pageTexts = [];
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          pageTexts.push(pageText);
        }
        text = pageTexts.join('\n\n');
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
      }
      setResume(text);
    } catch (err) {
      console.error('File parsing error:', err);
      setFileError(err instanceof Error ? err.message : 'Failed to parse file.');
      setFileName('');
    } finally {
      setFileParsing(false);
      // Reset file input to allow uploading the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const isGenerateDisabled = isLoading || !resume.trim() || 
    (jobInputType === JobDescriptionInputType.Text && !jobDescription.trim()) ||
    (jobInputType === JobDescriptionInputType.Url && !jobUrl.trim());

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume Section */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="resume" className="block text-lg font-semibold text-gray-300">
              Your Resume
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
            <button 
              onClick={handleFileClick} 
              disabled={fileParsing}
              className="flex items-center text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50"
            >
              <UploadIcon className="w-4 h-4 mr-2"/>
              Upload File
            </button>
          </div>
          {fileParsing && (
            <div className="flex items-center text-sm text-gray-400 mb-2">
              <SpinnerIcon className="w-4 h-4 mr-2" /> Parsing "{fileName}"...
            </div>
          )}
          {fileName && !fileParsing && !fileError && (
             <div className="flex items-center text-sm text-green-400 mb-2 p-2 bg-green-900/50 rounded-md">
              <FileIcon className="w-4 h-4 mr-2 flex-shrink-0" /> <span className="truncate">Successfully parsed "{fileName}"</span>
            </div>
          )}
           {fileError && (
             <div className="text-sm text-red-400 mb-2 p-2 bg-red-900/50 rounded-md">Error: {fileError}</div>
           )}
          <textarea
            id="resume"
            value={resume}
            onChange={(e) => {
              setResume(e.target.value);
              setFileName('');
              setFileError('');
            }}
            placeholder="Paste your resume here or upload a PDF/DOCX file..."
            className="w-full h-80 bg-gray-800 border border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 resize-y shadow-inner"
            disabled={fileParsing}
          />
        </div>

        {/* Job Description Section */}
        <div>
           <div className="mb-2">
              <div className="flex border-b border-gray-700">
                <button 
                  onClick={() => setJobInputType(JobDescriptionInputType.Text)}
                  className={`flex-1 py-2 text-lg font-semibold transition-colors focus:outline-none ${jobInputType === JobDescriptionInputType.Text ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Paste Description
                </button>
                <button 
                  onClick={() => setJobInputType(JobDescriptionInputType.Url)}
                  className={`flex-1 py-2 text-lg font-semibold transition-colors focus:outline-none ${jobInputType === JobDescriptionInputType.Url ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-gray-200'}`}
                >
                  Use Link
                </button>
              </div>
           </div>
           {jobInputType === JobDescriptionInputType.Text ? (
             <textarea
               id="job-description"
               value={jobDescription}
               onChange={(e) => setJobDescription(e.target.value)}
               placeholder="Paste the job description here..."
               className="w-full h-80 bg-gray-800 border border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 resize-y shadow-inner"
             />
           ) : (
             <div className="h-80 flex flex-col">
              <input
                type="url"
                id="job-url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://example.com/careers/job-posting"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 shadow-inner"
              />
              <p className="text-xs text-gray-500 mt-2 px-1">Note: This uses Google Search to find the job description on the page. Ensure the link is public and accessible.</p>
             </div>
           )}
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <button
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 shadow-lg"
        >
          <SparklesIcon className="w-6 h-6 mr-2" />
          {isLoading ? 'Generating...' : 'Generate Cover Letter'}
        </button>
      </div>
    </div>
  );
};

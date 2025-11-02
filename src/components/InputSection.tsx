import React, { useRef, useState, ChangeEvent } from 'react';
import { SparklesIcon, UploadIcon, FileIcon, SpinnerIcon, LightbulbIcon } from './icons';
import { JobDescriptionInputType } from '../types';
import { formatResumeText } from '../services/geminiService';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs';

declare const mammoth: any;

const RESUME_EXAMPLE = `
--- Professional Summary ---
Dynamic and results-oriented Software Engineer with 5+ years of experience in developing, testing, and maintaining web applications. Proficient in JavaScript, React, and Node.js. Proven ability to collaborate with cross-functional teams to deliver high-quality software solutions.

--- Experience ---
Senior Frontend Developer | Tech Solutions Inc. | 2020 - Present
- Led the development of a new customer-facing dashboard using React and Redux, resulting in a 20% increase in user engagement.
- Mentored junior developers, improving team productivity by 15%.

--- Skills ---
- Languages: JavaScript, TypeScript, Python
- Frameworks: React, Node.js, Express
- Tools: Git, Docker, Webpack

--- Education ---
Bachelor of Science in Computer Science
State University, 2015-2019
`.trim();

const JOB_DESC_EXAMPLE = `
Frontend Engineer at Innovate Corp

Innovate Corp is seeking a passionate Frontend Engineer to join our growing team. You will be responsible for building and maintaining our user-facing web applications.

--- Responsibilities ---
- Develop new user-facing features using React.js
- Build reusable components and front-end libraries for future use
- Translate designs and wireframes into high-quality code
- Optimize components for maximum performance across a vast array of web-capable devices and browsers

--- Qualifications ---
- 3+ years of experience with React.js
- Strong proficiency in JavaScript, including DOM manipulation and the JavaScript object model
- Experience with popular React.js workflows (such as Flux or Redux)
- Familiarity with RESTful APIs
`.trim();


const ExampleDisplay: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="my-2">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center text-sm text-purple-400 hover:text-purple-300">
        <LightbulbIcon className="w-4 h-4 mr-1" /> Show {title} Example
      </button>
      {isOpen && (
        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md">
          <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-sans">{content}</pre>
        </div>
      )}
    </div>
  );
};


interface InputSectionProps {
  resume: string;
  setResume: (value: string) => void;
  jobDescription: string;
  setJobDescription: (value: string) => void;
  jobUrl: string;
  setJobUrl: (value: string) => void;
  jobInputType: JobDescriptionInputType;
  setJobInputType: (type: JobDescriptionInputType) => void;
  companyName: string;
  setCompanyName: (value: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  resume, setResume, jobDescription, setJobDescription, jobUrl, setJobUrl, jobInputType, setJobInputType,
  companyName, setCompanyName, onGenerate, isLoading,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploadWithFormatting, setUploadWithFormatting] = useState(false);

  const handleFileClick = (withFormatting: boolean) => {
    setUploadWithFormatting(withFormatting);
    fileInputRef.current?.click();
  };
  
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileParsing(true);
    setIsFormatting(false);
    setFileName(file.name);
    setFileError('');
    setResume('');

    let rawText = '';
    try {
      const arrayBuffer = await file.arrayBuffer();
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
        rawText = pageTexts.join('\n\n');
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ arrayBuffer });
        rawText = result.value;
      } else {
        throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
      }
    } catch (err) {
      console.error('File parsing error:', err);
      setFileError(err instanceof Error ? err.message : 'Failed to parse file.');
      setFileName('');
      setFileParsing(false);
      return;
    } finally {
      setFileParsing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }

    if (uploadWithFormatting) {
        // After parsing, format the text
        setIsFormatting(true);
        try {
          const formattedText = await formatResumeText(rawText);
          setResume(formattedText);
        } catch (err) {
          console.error('Resume formatting error:', err);
          setFileError('Could not format resume text, using raw text.');
          setResume(rawText); // Fallback to raw text
        } finally {
          setIsFormatting(false);
        }
    } else {
        // Fast upload: just set the raw text
        setResume(rawText);
    }
  };

  const isGenerateDisabled = isLoading || isFormatting || !resume.trim() || 
    (jobInputType === JobDescriptionInputType.Text && !jobDescription.trim()) ||
    (jobInputType === JobDescriptionInputType.Url && !jobUrl.trim());

  const isUploading = fileParsing || isFormatting;

  return (
    <div className="mt-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Resume Section */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label htmlFor="resume" className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
              Your Resume
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
            />
            <div className="flex items-center space-x-2">
                 <button 
                  onClick={() => handleFileClick(false)} 
                  disabled={isUploading}
                  className="flex items-center text-sm bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50"
                  title="Quickly parse text without AI formatting"
                >
                  <UploadIcon className="w-4 h-4 mr-2"/>
                  Fast Upload
                </button>
                <button 
                  onClick={() => handleFileClick(true)}
                  disabled={isUploading}
                  className="flex items-center text-sm bg-purple-200 dark:bg-purple-900/50 hover:bg-purple-300 dark:hover:bg-purple-800/60 text-purple-700 dark:text-purple-300 font-semibold py-1 px-3 rounded-md transition-colors disabled:opacity-50"
                  title="Parse and format resume using AI"
                >
                  <SparklesIcon className="w-4 h-4 mr-2"/>
                  Upload & Format (AI)
                </button>
            </div>
          </div>
          <ExampleDisplay title="Resume" content={RESUME_EXAMPLE} />
          {fileParsing && (
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
              <SpinnerIcon className="w-4 h-4 mr-2" /> Parsing "{fileName}"...
            </div>
          )}
           {isFormatting && (
            <div className="flex items-center text-sm text-purple-500 dark:text-purple-400 mb-2">
              <SpinnerIcon className="w-4 h-4 mr-2" /> Optimizing format...
            </div>
          )}
          {fileName && !isUploading && !fileError && (
             <div className="flex items-center text-sm text-green-600 dark:text-green-400 mb-2 p-2 bg-green-100 dark:bg-green-900/50 rounded-md">
              <FileIcon className="w-4 h-4 mr-2 flex-shrink-0" /> <span className="truncate">Successfully processed "{fileName}"</span>
            </div>
          )}
           {fileError && (
             <div className="text-sm text-red-600 dark:text-red-400 mb-2 p-2 bg-red-100 dark:bg-red-900/50 rounded-md">Error: {fileError}</div>
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
            className="w-full h-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 resize-y shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
            disabled={isUploading}
          />
        </div>

        {/* Job Info Section */}
        <div>
           <div className="mb-2">
            <label htmlFor="company-name" className="block text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Job Details
            </label>
             <input
                type="text"
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Company Name (for saving draft)"
                className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
              />
           </div>
           <div className="mt-4">
              <div className="flex border-b border-gray-300 dark:border-gray-700">
                <button 
                  onClick={() => setJobInputType(JobDescriptionInputType.Text)}
                  className={`flex-1 py-2 font-semibold transition-colors focus:outline-none ${jobInputType === JobDescriptionInputType.Text ? 'text-purple-500 dark:text-purple-400 border-b-2 border-purple-500 dark:border-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                >
                  Paste Description
                </button>
                <button 
                  onClick={() => setJobInputType(JobDescriptionInputType.Url)}
                  className={`flex-1 py-2 font-semibold transition-colors focus:outline-none ${jobInputType === JobDescriptionInputType.Url ? 'text-purple-500 dark:text-purple-400 border-b-2 border-purple-500 dark:border-purple-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}
                >
                  Use Link
                </button>
              </div>
           </div>
           <div className="mt-2">
               {jobInputType === JobDescriptionInputType.Text ? (
                <>
                <ExampleDisplay title="Job Description" content={JOB_DESC_EXAMPLE} />
                 <textarea
                   id="job-description"
                   value={jobDescription}
                   onChange={(e) => setJobDescription(e.target.value)}
                   placeholder="Paste the job description here..."
                   className="w-full h-64 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 resize-y shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
                 />
                </>
               ) : (
                 <div className="h-64 flex flex-col pt-2">
                  <input
                    type="url"
                    id="job-url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="https://example.com/careers/job-posting"
                    className="w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-4 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-shadow duration-200 shadow-inner placeholder-gray-400 dark:placeholder-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-2 px-1">Note: This uses Google Search to find the job description on the page. Ensure the link is public and accessible.</p>
                 </div>
               )}
           </div>
        </div>
      </div>
      <div className="mt-8 flex justify-center">
        <button
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="flex items-center justify-center bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg transition-all duration-300 disabled:bg-gray-500 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-purple-500 focus:ring-opacity-50 shadow-lg"
        >
          <SparklesIcon className="w-6 h-6 mr-2" />
          {isLoading ? 'Generating...' : isFormatting ? 'Formatting...' : 'Generate Cover Letter'}
        </button>
      </div>
    </div>
  );
};
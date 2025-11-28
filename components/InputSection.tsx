import React, { useRef, useState, ChangeEvent } from 'react';
import { SparklesIcon, UploadIcon, FileIcon, SpinnerIcon, LightbulbIcon } from './icons';
import { JobDescriptionInputType, Tone } from '../types';
import { formatResumeText } from '../services/geminiService';
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

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
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center text-xs font-bold uppercase tracking-wide text-purple-600 dark:text-purple-400 hover:text-purple-500 transition-colors">
        <LightbulbIcon className="w-3 h-3 mr-1" /> {isOpen ? 'Hide Example' : `Show ${title} Example`}
      </button>
      {isOpen && (
        <div className="mt-2 p-4 bg-white/40 dark:bg-black/40 border border-white/20 dark:border-gray-700/30 rounded-xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 shadow-inner">
          <pre className="text-[10px] leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono">{content}</pre>
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
  tone: Tone;
  setTone: (tone: Tone) => void;
}

export const InputSection: React.FC<InputSectionProps> = ({
  resume, setResume, jobDescription, setJobDescription, jobUrl, setJobUrl, jobInputType, setJobInputType,
  companyName, setCompanyName, onGenerate, isLoading, tone, setTone
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
        setIsFormatting(true);
        try {
          const formattedText = await formatResumeText(rawText);
          setResume(formattedText);
        } catch (err) {
          console.error('Resume formatting error:', err);
          setFileError('Could not format resume text, using raw text.');
          setResume(rawText);
        } finally {
          setIsFormatting(false);
        }
    } else {
        setResume(rawText);
    }
  };

  const isGenerateDisabled = isLoading || isFormatting || !resume.trim() || 
    (jobInputType === JobDescriptionInputType.Text && !jobDescription.trim()) ||
    (jobInputType === JobDescriptionInputType.Url && !jobUrl.trim());

  const isUploading = fileParsing || isFormatting;

  // Modern glass input class
  const glassInputClass = "w-full bg-white/40 dark:bg-gray-900/30 backdrop-blur-md border border-white/20 dark:border-white/10 rounded-xl p-4 focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 focus:outline-none transition-all duration-300 placeholder-gray-400 dark:placeholder-gray-600 shadow-sm hover:bg-white/50 dark:hover:bg-gray-900/50 text-gray-800 dark:text-gray-100";

  return (
    <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
        
        {/* Left Column: Resume */}
        <div className="flex flex-col h-full relative group">
             {/* Decorative background for column */}
             <div className="absolute inset-0 bg-white/20 dark:bg-white/5 rounded-3xl -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <div className="flex justify-between items-center mb-4 px-1">
                <label className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center">
                    Candidate Resume
                    {resume && <span className="ml-2 w-2 h-2 rounded-full bg-green-500 shadow-lg shadow-green-500/50"></span>}
                </label>
                 <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="hidden"
                />
            </div>

            <div className="flex-grow flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => handleFileClick(false)} 
                        disabled={isUploading}
                        className="flex flex-col sm:flex-row items-center justify-center py-4 sm:py-3 px-2 rounded-xl bg-blue-50/60 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-800/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/30 transition-all text-xs sm:text-sm font-bold hover:shadow-lg hover:shadow-blue-500/10 disabled:opacity-50 group/btn"
                        >
                        <UploadIcon className="w-5 h-5 mb-1 sm:mb-0 sm:mr-2 group-hover/btn:scale-110 transition-transform"/>
                        Fast Upload
                    </button>
                    <button 
                        onClick={() => handleFileClick(true)}
                        disabled={isUploading}
                        className="relative overflow-hidden flex flex-col sm:flex-row items-center justify-center py-4 sm:py-3 px-2 rounded-xl bg-purple-50/60 dark:bg-purple-900/20 border border-purple-200/50 dark:border-purple-800/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100/60 dark:hover:bg-purple-900/30 transition-all text-xs sm:text-sm font-bold hover:shadow-lg hover:shadow-purple-500/10 disabled:opacity-50 group/btn"
                        >
                        <SparklesIcon className="w-5 h-5 mb-1 sm:mb-0 sm:mr-2 group-hover/btn:scale-110 transition-transform"/>
                        AI Format Upload
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 translate-x-[-100%] group-hover/btn:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000"></div>
                    </button>
                </div>
                 
                {/* Status Messages */}
                {fileParsing && (
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 p-2 bg-gray-100/50 dark:bg-gray-800/50 rounded-lg animate-pulse">
                    <SpinnerIcon className="w-4 h-4 mr-2" /> Parsing "{fileName}"...
                    </div>
                )}
                {isFormatting && (
                    <div className="flex items-center text-sm text-purple-600 dark:text-purple-400 p-2 bg-purple-50/50 dark:bg-purple-900/20 rounded-lg animate-pulse">
                    <SpinnerIcon className="w-4 h-4 mr-2" /> Enhancing resume structure with Gemini...
                    </div>
                )}
                {fileError && (
                    <div className="text-xs text-red-600 dark:text-red-400 p-3 bg-red-50/50 dark:bg-red-900/20 border border-red-200/50 dark:border-red-800/30 rounded-lg backdrop-blur-sm">{fileError}</div>
                )}

                <textarea
                    value={resume}
                    onChange={(e) => {
                        setResume(e.target.value);
                        setFileName('');
                        setFileError('');
                    }}
                    placeholder="Paste your resume content here..."
                    className={`${glassInputClass} flex-grow min-h-[350px] resize-none font-mono text-xs sm:text-sm`}
                    disabled={isUploading}
                />
                <ExampleDisplay title="Resume" content={RESUME_EXAMPLE} />
            </div>
        </div>

        {/* Right Column: Job & Config */}
        <div className="flex flex-col h-full space-y-6 relative group">
             <div className="absolute inset-0 bg-white/20 dark:bg-white/5 rounded-3xl -z-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            {/* 1. Job Details */}
            <div>
                 <div className="flex justify-between items-center mb-4 px-1">
                    <label className="text-sm font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 flex items-center">
                        Target Job
                    </label>
                    <div className="bg-white/50 dark:bg-gray-800/50 p-1 rounded-lg flex text-xs font-bold backdrop-blur-md border border-white/20 shadow-sm">
                        <button 
                            onClick={() => setJobInputType(JobDescriptionInputType.Text)}
                            className={`px-3 py-1.5 rounded-md transition-all ${jobInputType === JobDescriptionInputType.Text ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            Text
                        </button>
                        <button 
                            onClick={() => setJobInputType(JobDescriptionInputType.Url)}
                             className={`px-3 py-1.5 rounded-md transition-all ${jobInputType === JobDescriptionInputType.Url ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                        >
                            URL
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Company Name (e.g. Google)"
                        className={glassInputClass}
                    />
                    
                    {jobInputType === JobDescriptionInputType.Text ? (
                        <>
                            <textarea
                                value={jobDescription}
                                onChange={(e) => setJobDescription(e.target.value)}
                                placeholder="Paste job description..."
                                className={`${glassInputClass} h-48 resize-none font-mono text-xs sm:text-sm`}
                            />
                            <ExampleDisplay title="Job Description" content={JOB_DESC_EXAMPLE} />
                        </>
                    ) : (
                        <div className="h-48 flex flex-col justify-center space-y-3 p-6 rounded-2xl bg-white/30 dark:bg-gray-900/20 border border-white/20 border-dashed">
                             <input
                                type="url"
                                value={jobUrl}
                                onChange={(e) => setJobUrl(e.target.value)}
                                placeholder="https://example.com/careers/job"
                                className={glassInputClass}
                            />
                             <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                                <span className="font-bold text-purple-600 dark:text-purple-400">Search Grounding Enabled.</span><br/> We will analyze the page content automatically.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. Tone Selector (New Feature) */}
            <div className="bg-gradient-to-br from-purple-50/80 to-indigo-50/80 dark:from-purple-900/20 dark:to-indigo-900/20 p-5 rounded-2xl border border-white/30 dark:border-white/5 backdrop-blur-md shadow-sm">
                <label className="block text-xs font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300 mb-3">
                    Select Tone
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(['Professional', 'Enthusiastic', 'Confident', 'Creative'] as Tone[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTone(t)}
                            className={`py-2 px-1 text-xs sm:text-sm font-semibold rounded-xl border transition-all duration-300
                                ${tone === t 
                                    ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/20 transform scale-105' 
                                    : 'bg-white/60 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 border-transparent hover:bg-white dark:hover:bg-gray-700 hover:border-purple-200 dark:hover:border-purple-800'
                                }
                            `}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Generate Button */}
            <button
                onClick={onGenerate}
                disabled={isGenerateDisabled}
                className="w-full relative group overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 bg-[length:200%_auto] hover:bg-right text-white font-bold py-4 sm:py-5 px-8 rounded-2xl transition-all duration-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-purple-500/30 hover:shadow-purple-500/50 hover:-translate-y-1"
            >
                 <span className="relative z-10 flex items-center justify-center text-base sm:text-lg tracking-wide">
                    {isLoading ? (
                         <>
                            <SpinnerIcon className="w-5 h-5 mr-3 text-white" />
                            {isFormatting ? 'Formatting...' : 'Crafting Your Letter...'}
                         </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2 sm:mr-3" />
                            Generate Cover Letter
                        </>
                    )}
                 </span>
            </button>
        </div>
      </div>
    </div>
  );
};
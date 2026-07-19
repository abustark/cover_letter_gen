import React, { useRef, useState, ChangeEvent } from 'react';
import { SparklesIcon, UploadIcon, FileIcon, SpinnerIcon, LightbulbIcon } from './icons';
import { JobDescriptionInputType, Tone } from '../types';
import { formatResumeText } from '../services/geminiService';
import { Button, Segmented, Field } from './UI';
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

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

const TONES: Tone[] = ['Professional', 'Enthusiastic', 'Confident', 'Creative'];
const JOB_TYPES: readonly string[] = ['Text', 'URL'];

const ExampleToggle: React.FC<{ title: string; content: string }> = ({ title, content }) => {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="inline-flex items-center text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      >
        <LightbulbIcon className="w-3.5 h-3.5 mr-1.5" />
        {open ? 'Hide example' : `See a ${title.toLowerCase()} example`}
      </button>
      {open && (
        <pre className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg text-[11px] leading-relaxed text-gray-600 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
          {content}
        </pre>
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
        const pageTexts = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          pageTexts.push(pageText);
        }
        rawText = pageTexts.join('\n\n');
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const mammoth = (await import('mammoth')).default;
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

  const inputClass = "w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-3.5 text-[15px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus-ring transition-colors resize-none";

  return (
    <div className="space-y-10">

      {/* 1. Resume */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
            Your Resume
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" onClick={() => handleFileClick(false)} disabled={isUploading}>
              <UploadIcon className="w-4 h-4" /> Upload
            </Button>
            <button
              type="button"
              onClick={() => handleFileClick(true)}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors disabled:opacity-50 px-2 py-1.5"
            >
              <SparklesIcon className="w-3.5 h-3.5" /> AI format
            </button>
          </div>
        </div>

        <textarea
          value={resume}
          onChange={(e) => { setResume(e.target.value); setFileName(''); setFileError(''); }}
          placeholder="Paste your resume text here, or upload a PDF / DOCX…"
          className={`${inputClass} min-h-[280px] font-mono text-[13px] leading-relaxed`}
          disabled={isUploading}
        />

        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          {fileParsing && <span className="inline-flex items-center"><SpinnerIcon className="w-4 h-4 mr-2 animate-spin" /> Parsing “{fileName}”…</span>}
          {isFormatting && <span className="inline-flex items-center text-accent-600 dark:text-accent-400"><SpinnerIcon className="w-4 h-4 mr-2 animate-spin" /> Enhancing structure…</span>}
          {resume && !isUploading && <span className="inline-flex items-center text-green-600 dark:text-green-400"><span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2" /> Resume ready</span>}
          {fileError && <span className="text-red-600 dark:text-red-400">{fileError}</span>}
        </div>

        <ExampleToggle title="Resume" content={RESUME_EXAMPLE} />
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleFileChange} />
      </section>

      <div className="border-t border-gray-200 dark:border-gray-800" />

      {/* 2. Target Job */}
      <section className="space-y-4">
        <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Target Job
        </h2>

        <Field label="Company name" htmlFor="company">
          <input
            id="company"
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Google"
            className={inputClass}
          />
        </Field>

        <Segmented
          options={JOB_TYPES}
          value={jobInputType}
          onChange={(v) => setJobInputType(v as JobDescriptionInputType)}
        />

        {jobInputType === JobDescriptionInputType.Text ? (
          <div className="space-y-2">
            <Field label="Job description">
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the job description…"
                className={`${inputClass} min-h-[160px] font-mono text-[13px] leading-relaxed`}
              />
            </Field>
            <ExampleToggle title="Job Description" content={JOB_DESC_EXAMPLE} />
          </div>
        ) : (
          <Field label="Job posting URL" hint="Search mode enabled — we'll read the page for you.">
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="https://example.com/careers/job"
              className={inputClass}
            />
          </Field>
        )}
      </section>

      <div className="border-t border-gray-200 dark:border-gray-800" />

      {/* 3. Tone */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          Tone
        </h2>
        <Segmented options={TONES} value={tone} onChange={setTone} />
      </section>

      {/* 4. Generate */}
      <Button
        variant="primary"
        size="lg"
        onClick={onGenerate}
        disabled={isGenerateDisabled}
        className="w-full"
      >
        {isLoading ? (
          <><SpinnerIcon className="w-5 h-5 mr-2 animate-spin" /> {isFormatting ? 'Formatting…' : 'Crafting your letter…'}</>
        ) : (
          <><SparklesIcon className="w-5 h-5 mr-2" /> Generate Cover Letter</>
        )}
      </Button>
    </div>
  );
};

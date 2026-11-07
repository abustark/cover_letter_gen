import React, { useRef, useState, ChangeEvent, DragEvent } from 'react';
import {
  SparklesIcon,
  UploadIcon,
  FileIcon,
  SpinnerIcon,
  LightbulbIcon,
  LockIcon,
  CheckIcon,
} from './icons';
import { JobDescriptionInputType, Tone } from '../types';
import { formatResumeText } from '../services/geminiService';
import { Button, Segmented, Field } from './UI';
import { GoogleButton } from './GoogleButton';
import { useAuth } from '../services/auth';

const loadPdfjs = () => import('pdfjs-dist');

const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_PAGES = 10;
const MAX_RESUME_TEXT_LENGTH = 50000;

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
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
      >
        <LightbulbIcon className="w-3.5 h-3.5 mr-1.5 text-accent2-500" />
        {open ? 'Hide sample' : `Preview sample ${title.toLowerCase()}`}
      </button>
      {open && (
        <pre className="mt-2.5 p-4 bg-gray-50/80 dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-800/80 rounded-xl text-[11px] leading-relaxed text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto shadow-inner">
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
  resume,
  setResume,
  jobDescription,
  setJobDescription,
  jobUrl,
  setJobUrl,
  jobInputType,
  setJobInputType,
  companyName,
  setCompanyName,
  onGenerate,
  isLoading,
  tone,
  setTone,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileParsing, setFileParsing] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [uploadWithFormatting, setUploadWithFormatting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const { isAuthenticated, signInError, getValidToken } = useAuth();

  const handleFileClick = (withFormatting: boolean) => {
    setUploadWithFormatting(withFormatting);
    fileInputRef.current?.click();
  };

  const processFile = async (file: File) => {
    setFileError('');
    setFileName(file.name);

    if (file.size > MAX_RESUME_FILE_SIZE) {
      setFileError('File exceeds 5 MB limit. Please upload a smaller file or paste your resume text.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const lowerName = file.name.toLowerCase();
    const isPdf = lowerName.endsWith('.pdf') || file.type === 'application/pdf';
    const isDocx =
      lowerName.endsWith('.docx') ||
      file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (!isPdf && !isDocx) {
      setFileError('Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileParsing(true);
    setIsFormatting(false);
    setResume('');

    let rawText = '';
    try {
      const arrayBuffer = await file.arrayBuffer();

      if (isPdf) {
        const pdfjs = await loadPdfjs();
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url
        ).toString();

        let pdf;
        try {
          pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        } catch (pdfErr) {
          const errStr = String(pdfErr).toLowerCase();
          if (errStr.includes('password')) {
            throw new Error('This PDF is password-protected. Please upload an unprotected copy or paste the text.');
          }
          throw new Error('Could not read this PDF. The file may be corrupted.');
        }

        if (pdf.numPages > MAX_PDF_PAGES) {
          throw new Error(`PDF has ${pdf.numPages} pages, exceeding the ${MAX_PDF_PAGES}-page limit. Please upload a shorter resume or paste the text.`);
        }

        const pageTexts: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item) => ('str' in item ? item.str : ''))
            .join(' ');
          pageTexts.push(pageText);
        }
        rawText = pageTexts.join('\n\n').trim();

        if (rawText.replace(/\s/g, '').length < 50) {
          throw new Error('This PDF appears to be scanned or contains only images with no selectable text. Please upload a text-based document or paste your resume text.');
        }
      } else {
        const mammoth = (await import('mammoth')).default;
        try {
          const result = await mammoth.extractRawText({ arrayBuffer });
          rawText = result.value.trim();
        } catch {
          throw new Error('Could not read this DOCX file. It may be corrupted or password-protected. Please paste the text directly.');
        }

        if (rawText.replace(/\s/g, '').length < 50) {
          throw new Error('No readable text found in this document. Please paste your resume text.');
        }
      }

      if (rawText.length > MAX_RESUME_TEXT_LENGTH) {
        rawText = rawText.slice(0, MAX_RESUME_TEXT_LENGTH);
      }
    } catch (err) {
      console.error('File parsing error:', err);
      setFileError(err instanceof Error ? err.message : 'Failed to parse file.');
      setFileName('');
      setFileParsing(false);
      return;
    } finally {
      setFileParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }

    if (uploadWithFormatting) {
      const token = getValidToken();
      if (token) {
        setIsFormatting(true);
        try {
          const formattedText = await formatResumeText(rawText, token);
          setResume(formattedText);
        } catch (err) {
          console.error('Resume formatting error:', err);
          setFileError('Could not format resume text with AI, using raw text.');
          setResume(rawText);
        } finally {
          setIsFormatting(false);
        }
      } else {
        setResume(rawText);
      }
    } else {
      setResume(rawText);
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const isGenerateDisabled =
    isLoading ||
    isFormatting ||
    !resume.trim() ||
    (jobInputType === JobDescriptionInputType.Text && !jobDescription.trim()) ||
    (jobInputType === JobDescriptionInputType.Url && !jobUrl.trim());

  const isUploading = fileParsing || isFormatting;

  const inputClass =
    'w-full bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800/80 rounded-xl p-3.5 text-[14px] text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600 focus-ring transition-all resize-none shadow-xs';

  return (
    <div className="space-y-8">
      {/* 1. Resume Container (Double Bezel) */}
      <div
        className={`double-bezel transition-colors duration-200 ${
          isDragging ? 'ring-2 ring-accent-500 ring-offset-2' : ''
        }`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <div className="double-bezel-inner p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent2-500" />
                Candidate Resume
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Drop your PDF or DOCX file (up to 10 pages) or paste text directly
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleFileClick(false)}
                disabled={isUploading}
              >
                <UploadIcon className="w-3.5 h-3.5 mr-1" /> Upload PDF / DOCX
              </Button>
              <button
                type="button"
                onClick={() => handleFileClick(true)}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent-700 dark:text-accent-300 border border-accent-200 dark:border-accent-800/80 bg-accent-50/80 dark:bg-accent-950/40 hover:bg-accent-100 dark:hover:bg-accent-900/40 rounded-xl px-3 py-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <SparklesIcon className="w-3.5 h-3.5 text-accent-500" /> AI format
              </button>
            </div>
          </div>

          <textarea
            value={resume}
            onChange={(e) => {
              setResume(e.target.value);
              setFileName('');
              setFileError('');
            }}
            placeholder="Paste your resume text here, or drag & drop a PDF / DOCX resume into this area…"
            className={`${inputClass} min-h-[240px] font-mono text-[12.5px] leading-relaxed`}
            disabled={isUploading}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              {fileParsing && (
                <span className="inline-flex items-center text-accent-600 dark:text-accent-400 font-medium">
                  <SpinnerIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Parsing “{fileName}”…
                </span>
              )}
              {isFormatting && (
                <span className="inline-flex items-center text-accent2-600 dark:text-accent2-400 font-medium">
                  <SpinnerIcon className="w-3.5 h-3.5 mr-1.5 animate-spin" /> Structuring resume with AI…
                </span>
              )}
              {resume && !isUploading && (
                <span className="inline-flex items-center text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30 px-2 py-0.5 rounded-full border border-green-200/60 dark:border-green-800/60">
                  <CheckIcon className="w-3 h-3 mr-1" /> Resume loaded ({resume.split(/\s+/).filter(Boolean).length} words)
                </span>
              )}
              {fileError && <span className="text-red-600 dark:text-red-400 font-medium">{fileError}</span>}
            </div>

            <ExampleToggle title="Resume" content={RESUME_EXAMPLE} />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* 2. Target Job Container (Double Bezel) */}
      <div className="double-bezel">
        <div className="double-bezel-inner p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent-500" />
                Target Opportunity
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Paste the job description or provide the direct posting link
              </p>
            </div>

            <Segmented
              options={JOB_TYPES}
              value={jobInputType}
              onChange={(v) => setJobInputType(v as JobDescriptionInputType)}
            />
          </div>

          <Field label="Company name (optional)" htmlFor="company" hint="Helps tailor the salutation">
            <input
              id="company"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. OpenAI, Stripe, Linear"
              className={inputClass}
            />
          </Field>

          {jobInputType === JobDescriptionInputType.Text ? (
            <div className="space-y-2">
              <Field label="Job description text">
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the requirements, responsibilities, and about the company…"
                  className={`${inputClass} min-h-[160px] font-mono text-[12.5px] leading-relaxed`}
                />
              </Field>
              <ExampleToggle title="Job Description" content={JOB_DESC_EXAMPLE} />
            </div>
          ) : (
            <Field
              label="Job posting link (HTTPS)"
              hint="Server-side reader active — bypasses CORS & strips tracking"
            >
              <input
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://jobs.lever.co/company/job-id or careers URL"
                className={inputClass}
              />
            </Field>
          )}
        </div>
      </div>

      {/* 3. Tone Selector Container */}
      <div className="double-bezel">
        <div className="double-bezel-inner p-5 sm:p-6 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent2-500" />
                Narrative Tone
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Tunes diction and pacing without fabricating or exaggerating facts
              </p>
            </div>
            <Segmented options={TONES} value={tone} onChange={setTone} />
          </div>
        </div>
      </div>

      {/* Privacy Callout */}
      <div className="rounded-xl border border-gray-200/80 dark:border-gray-800/80 bg-gray-50/70 dark:bg-gray-900/40 p-4 text-xs text-gray-500 dark:text-gray-400 leading-relaxed flex items-start gap-3 shadow-xs">
        <div className="w-7 h-7 rounded-lg bg-accent2-50 dark:bg-accent2-950/40 flex items-center justify-center flex-shrink-0 text-accent2-600 dark:text-accent2-400 border border-accent2-200/50 dark:border-accent2-800/50">
          <LockIcon className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="font-semibold text-gray-700 dark:text-gray-200">
            Privacy & Trust Architecture:{' '}
          </span>
          Your resume is parsed in-memory on your device and never uploaded as a document file.
          Extracted text is processed strictly through CoverCraft's authenticated server proxy to OpenRouter.
          Drafts are saved locally in your browser only.
        </div>
      </div>

      {/* 4. Generate Action */}
      {isAuthenticated ? (
        <Button
          variant="primary"
          size="lg"
          onClick={onGenerate}
          disabled={isGenerateDisabled}
          className="w-full text-base font-semibold py-4 shadow-lg shadow-accent-600/25"
          iconTrailing={<SparklesIcon className="w-4 h-4 text-white" />}
        >
          {isLoading ? (
            <>
              <SpinnerIcon className="w-5 h-5 mr-2 animate-spin" />
              {isFormatting ? 'Formatting resume…' : 'Synthesizing tailored letter…'}
            </>
          ) : (
            'Generate Tailored Cover Letter'
          )}
        </Button>
      ) : (
        <div className="rounded-2xl border border-gray-200/90 dark:border-gray-800/90 bg-white/90 dark:bg-gray-900/90 p-6 sm:p-8 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto mb-3.5 rounded-2xl bg-gradient-to-br from-accent-50 to-accent-100 dark:from-accent-950/40 dark:to-accent-900/20 border border-accent-200/60 dark:border-accent-800/60 flex items-center justify-center text-accent-600 dark:text-accent-300 shadow-xs">
            <LockIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-50">
            Sign in with Google to Generate
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1.5 mb-6 max-w-sm mx-auto leading-relaxed">
            One-click sign-in protects the API proxy. Your documents remain local on your machine.
          </p>
          <div className="max-w-xs mx-auto">
            <GoogleButton size="large" fullWidth />
          </div>
          {signInError && (
            <p className="mt-3 text-xs text-red-600 dark:text-red-400 font-medium">{signInError}</p>
          )}
        </div>
      )}
    </div>
  );
};

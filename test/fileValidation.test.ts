import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

const MAX_RESUME_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_PDF_PAGES = 10;

function validateResumeFileMeta(name: string, size: number, type: string): { valid: boolean; error?: string } {
  if (size > MAX_RESUME_FILE_SIZE) {
    return { valid: false, error: 'File exceeds 5 MB limit. Please upload a smaller file or paste your resume text.' };
  }

  const lowerName = name.toLowerCase();
  const isPdf = lowerName.endsWith('.pdf') || type === 'application/pdf';
  const isDocx =
    lowerName.endsWith('.docx') ||
    type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (!isPdf && !isDocx) {
    return { valid: false, error: 'Unsupported file type. Please upload a PDF (.pdf) or Word document (.docx).' };
  }

  return { valid: true };
}

function validatePdfPageCount(numPages: number): { valid: boolean; error?: string } {
  if (numPages > MAX_PDF_PAGES) {
    return {
      valid: false,
      error: `PDF has ${numPages} pages, exceeding the ${MAX_PDF_PAGES}-page limit. Please upload a shorter resume or paste the text.`,
    };
  }
  return { valid: true };
}

function detectScannedOrImageOnly(extractedText: string): boolean {
  return extractedText.replace(/\s/g, '').length < 50;
}

function isPasswordProtectedError(errMessage: string): boolean {
  const lower = errMessage.toLowerCase();
  return lower.includes('password') || lower.includes('passwordexception');
}

describe('Resume File Handling & Validation', () => {
  it('accepts valid PDF and DOCX files within size limits', () => {
    assert.deepEqual(validateResumeFileMeta('resume.pdf', 1024 * 500, 'application/pdf'), { valid: true });
    assert.deepEqual(
      validateResumeFileMeta(
        'resume.docx',
        1024 * 300,
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ),
      { valid: true }
    );
  });

  it('rejects files larger than 5 MB', () => {
    const res = validateResumeFileMeta('resume.pdf', 6 * 1024 * 1024, 'application/pdf');
    assert.equal(res.valid, false);
    assert.ok(res.error?.includes('5 MB limit'));
  });

  it('rejects unsupported file extensions', () => {
    assert.equal(validateResumeFileMeta('malware.exe', 1000, 'application/x-msdownload').valid, false);
    assert.equal(validateResumeFileMeta('resume.png', 1000, 'image/png').valid, false);
    assert.equal(validateResumeFileMeta('archive.zip', 1000, 'application/zip').valid, false);
  });

  it('enforces maximum PDF page count of 10 pages', () => {
    assert.deepEqual(validatePdfPageCount(3), { valid: true });
    assert.deepEqual(validatePdfPageCount(10), { valid: true });

    const excessive = validatePdfPageCount(15);
    assert.equal(excessive.valid, false);
    assert.ok(excessive.error?.includes('exceeding the 10-page limit'));
  });

  it('detects scanned or image-only documents lacking selectable text', () => {
    assert.equal(detectScannedOrImageOnly(''), true);
    assert.equal(detectScannedOrImageOnly('   \n\n  '), true);
    assert.equal(detectScannedOrImageOnly('Short snippet'), true);
    assert.equal(
      detectScannedOrImageOnly(
        'Senior Software Engineer with 7 years of full-stack web application development experience in React and Node.'
      ),
      false
    );
  });

  it('identifies password protection error messages', () => {
    assert.equal(isPasswordProtectedError('PasswordException: Need password to open'), true);
    assert.equal(isPasswordProtectedError('Error: password required'), true);
    assert.equal(isPasswordProtectedError('General file reading error'), false);
  });
});

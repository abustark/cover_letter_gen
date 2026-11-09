/**
 * Heuristically clean and structure cramped resume text extracted from PDFs,
 * Word documents, or copy-pasted text where line breaks were flattened.
 */
export function cleanCrampedResumeText(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000]/g, ' ');

  // 1. Separate common resume section headers (case-insensitive, whole word)
  // Ensure we don't match email prefixes like contact@example.com by asserting (?![@.])
  const sectionHeaders = [
    'PROFESSIONAL SUMMARY',
    'EXECUTIVE SUMMARY',
    'CAREER SUMMARY',
    'SUMMARY',
    'WORK EXPERIENCE',
    'PROFESSIONAL EXPERIENCE',
    'EMPLOYMENT HISTORY',
    'WORK HISTORY',
    'EXPERIENCE',
    'ACADEMIC BACKGROUND',
    'EDUCATION',
    'TECHNICAL SKILLS',
    'CORE COMPETENCIES',
    'AREAS OF EXPERTISE',
    'SKILLS',
    'KEY PROJECTS',
    'NOTABLE PROJECTS',
    'PROJECTS',
    'LICENSES & CERTIFICATIONS',
    'CERTIFICATIONS',
    'HONORS & AWARDS',
    'ACHIEVEMENTS',
    'AWARDS',
    'PUBLICATIONS',
    'VOLUNTEER EXPERIENCE',
    'COMMUNITY INVOLVEMENT',
    'LANGUAGES',
    'CONTACT INFORMATION',
    'CONTACT',
    'REFERENCES',
  ];

  const headerPattern = sectionHeaders
    .map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');

  const headerRegex = new RegExp(
    `(^|[\\n\\s])(${headerPattern})\\b(?![@.])[:\\s]*`,
    'gi'
  );

  text = text.replace(headerRegex, (_match, _prefix, header) => {
    return `\n\n${header.trim().toUpperCase()}\n`;
  });

  // 2. Put bullet points on new lines if cramped together
  // Matches bullets: •, ●, ▪, ▫, ◦, ■, ‣
  text = text.replace(/([^\n])\s*([•●▪▫◦■‣])\s*/g, '$1\n• ');

  // 3. Numbered lists at sentence boundaries or after periods/colons: ' 1. '
  text = text.replace(/([.:;]|\n)\s*(\d{1,2}\.)\s+([A-Z])/g, '$1\n$2 $3');

  // 4. Ensure email addresses and profile links have line breaks if mashed into text
  text = text.replace(
    /([^\n])\s+(\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b)/g,
    '$1\n$2'
  );
  text = text.replace(
    /([^\n])\s+(\b(?:https?:\/\/)?(?:www\.)?(?:linkedin\.com\/in\/|github\.com\/)[A-Za-z0-9_.-]+)/gi,
    '$1\n$2'
  );

  // 5. Ensure date ranges like "2020 - Present" don't immediately blend into the next job title
  text = text.replace(
    /(\b(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}\s*[-–—]\s*(?:Present|Current|\d{4}|(?:(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+)?\d{4}))\s+([A-Z][a-z])/g,
    '$1\n$2'
  );

  // 6. Normalize each line's whitespace and collapse consecutive blank lines
  const lines = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim());

  return lines
    .filter((line, idx, arr) => !(line === '' && arr[idx - 1] === ''))
    .join('\n')
    .trim();
}

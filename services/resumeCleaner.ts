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

/**
 * Intelligently injects a STAR achievement phrasing into the resume text,
 * locating the Experience or Skills section, or appending cleanly.
 * Ensures proper bullet character (•) and trailing period (.).
 */
export function injectPhraseIntoResume(resumeText: string, phrase: string): string {
  if (!resumeText || !resumeText.trim()) {
    const clean = phrase.trim().endsWith('.') ? phrase.trim() : `${phrase.trim()}.`;
    return `• ${clean}`;
  }

  // Ensure phrase ends with a period and uses bullet dot
  const cleanPhrase = phrase.trim().endsWith('.') ? phrase.trim() : `${phrase.trim()}.`;
  const bullet = `• ${cleanPhrase}`;

  // 1. Look for Experience section
  const expMatch = resumeText.match(
    /(?:^|\n)(---?\s*(?:professional\s+experience|work\s+experience|employment\s+history|experience)\s*---?|[A-Z\s]{4,30}EXPERIENCE[^\n]*)/i
  );

  if (expMatch && typeof expMatch.index === 'number') {
    const afterHeaderIdx = expMatch.index + expMatch[0].length;
    const rest = resumeText.slice(afterHeaderIdx);

    // Look for the first bullet point under the primary job in Experience
    const firstBulletMatch = rest.match(/\n\s*[•\-*]\s+/);
    if (firstBulletMatch && typeof firstBulletMatch.index === 'number') {
      const insertIdx = afterHeaderIdx + firstBulletMatch.index;
      return `${resumeText.slice(0, insertIdx)}\n${bullet}${resumeText.slice(insertIdx)}`;
    }

    // Look for the next major section boundary (--- or double line with capitalized header)
    const nextSectionMatch = rest.match(/\n\n(?:---|\b[A-Z\s]{4,30}\b)/);
    if (nextSectionMatch && typeof nextSectionMatch.index === 'number') {
      const insertIdx = afterHeaderIdx + nextSectionMatch.index;
      return `${resumeText.slice(0, insertIdx)}\n${bullet}${resumeText.slice(insertIdx)}`;
    } else {
      return `${resumeText.trimEnd()}\n${bullet}\n`;
    }
  }

  // 2. Look for Skills section if no Experience section
  const skillsMatch = resumeText.match(
    /(?:^|\n)(---?\s*(?:technical\s+skills|core\s+competencies|skills)\s*---?|[A-Z\s]{4,30}SKILLS[^\n]*)/i
  );

  if (skillsMatch && typeof skillsMatch.index === 'number') {
    const afterHeaderIdx = skillsMatch.index + skillsMatch[0].length;
    const rest = resumeText.slice(afterHeaderIdx);
    const nextSectionMatch = rest.match(/\n\n(?:---|\b[A-Z\s]{4,30}\b)/);
    if (nextSectionMatch && typeof nextSectionMatch.index === 'number') {
      const insertIdx = afterHeaderIdx + nextSectionMatch.index;
      return `${resumeText.slice(0, insertIdx)}\n${bullet}${resumeText.slice(insertIdx)}`;
    } else {
      return `${resumeText.trimEnd()}\n${bullet}\n`;
    }
  }

  // 3. Fallback: cleanly append to resume
  return `${resumeText.trimEnd()}\n\n${bullet}\n`;
}

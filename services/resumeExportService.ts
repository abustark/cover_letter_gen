/**
 * ATS-Friendly Resume Export Service
 *
 * Adheres to strict ATS-proof vector PDF guidelines:
 * 1. 1-Column Linear Stream: No multi-column tables or complex grids that scramble ATS reading order.
 * 2. Standardized Section Hierarchy: Recognizable headers (EXPERIENCE, EDUCATION, SKILLS) in bold uppercase.
 * 3. Typographic Legibility: Clean 10.5pt body text with 15pt leading, 54pt (0.75 in) standard margins.
 * 4. High-Contrast Vector Text: 100% selectable, machine-parseable text streams with zero graphical noise.
 */

import { cleanCrampedResumeText } from './resumeCleaner';

export interface AtsResumePdfOptions {
  resumeText: string;
  candidateName?: string;
  targetRole?: string;
}

/**
 * Escapes regex special characters
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generates an ATS-compliant vector PDF blob from structured resume text
 */
export async function generateAtsResumePdfBlob(options: AtsResumePdfOptions): Promise<Blob> {
  const { resumeText, candidateName, targetRole } = options;
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const margin = 54; // 0.75 in
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const printableWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin;

  let y = margin;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = margin;
    }
  };

  // Header: Candidate Name or Title
  if (candidateName && candidateName.trim()) {
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 20, 20);
    doc.text(candidateName.trim().toUpperCase(), margin, y);
    y += 24;

    if (targetRole && targetRole.trim()) {
      doc.setFont('times', 'italic');
      doc.setFontSize(11);
      doc.setTextColor(80, 80, 80);
      doc.text(targetRole.trim(), margin, y);
      y += 18;
    }

    // Subtle divider
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.75);
    doc.line(margin, y, margin + printableWidth, y);
    y += 16;
  }

  // Parse lines from resume
  const rawLines = resumeText.split(/\r?\n/);
  const sectionHeaderPattern = /^(?:---?\s*)?([A-Z\s]{3,30})(?:\s*---?)?$/;

  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trim();

    if (!rawLine) {
      y += 8; // Small paragraph spacing
      continue;
    }

    const headerMatch = rawLine.match(sectionHeaderPattern);
    const isSectionHeader =
      Boolean(headerMatch) &&
      [
        'SUMMARY',
        'PROFESSIONAL SUMMARY',
        'EXPERIENCE',
        'WORK EXPERIENCE',
        'PROFESSIONAL EXPERIENCE',
        'EDUCATION',
        'SKILLS',
        'TECHNICAL SKILLS',
        'PROJECTS',
        'CERTIFICATIONS',
      ].includes(headerMatch![1].trim().toUpperCase());

    if (isSectionHeader) {
      checkPageBreak(36);
      y += 10;
      doc.setFont('times', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      const headerTitle = headerMatch![1].trim().toUpperCase();
      doc.text(headerTitle, margin, y);
      y += 4;

      // Section underline rule (ATS friendly)
      doc.setDrawColor(180, 180, 180);
      doc.setLineWidth(0.5);
      doc.line(margin, y, margin + printableWidth, y);
      y += 14;
      continue;
    }

    // Check if line is a bullet point
    const isBullet = /^[-•*▪]\s+/.test(rawLine);
    const cleanContent = isBullet ? rawLine.replace(/^[-•*▪]\s+/, '') : rawLine;

    doc.setFont('times', isBullet ? 'normal' : 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(40, 40, 40);

    const indent = isBullet ? 14 : 0;
    const textWidth = printableWidth - indent;
    const wrappedLines = doc.splitTextToSize(cleanContent, textWidth);

    checkPageBreak(wrappedLines.length * 14 + 4);

    if (isBullet) {
      doc.text('•', margin, y);
      doc.text(wrappedLines, margin + indent, y);
    } else {
      doc.text(wrappedLines, margin, y);
    }

    y += wrappedLines.length * 14 + 3;
  }

  return doc.output('blob');
}

/**
 * Direct browser download for ATS-ready PDF
 */
export async function downloadAtsResumePdf(
  resumeText: string,
  filename = 'ATS_Optimized_Resume.pdf'
): Promise<void> {
  const blob = await generateAtsResumePdfBlob({ resumeText });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Injects a new bullet into an existing LaTeX document
 */
export function injectIntoLatexSource(latexSource: string, phrase: string): string {
  const latexItem = `  \\item ${phrase}`;

  // Find the first itemize environment in Experience or Work
  const itemizeIdx = latexSource.indexOf('\\begin{itemize}');
  if (itemizeIdx !== -1) {
    const afterBegin = itemizeIdx + '\\begin{itemize}'.length;
    return `${latexSource.slice(0, afterBegin)}\n${latexItem}${latexSource.slice(afterBegin)}`;
  }

  // Fallback: append before \end{document}
  const endDocIdx = latexSource.indexOf('\\end{document}');
  if (endDocIdx !== -1) {
    return `${latexSource.slice(0, endDocIdx)}\n% Injected ATS Alignment Item\n${latexItem}\n\n${latexSource.slice(endDocIdx)}`;
  }

  return `${latexSource}\n${latexItem}\n`;
}

/**
 * Removes an injected phrase from LaTeX source
 */
export function removePhraseFromLatexSource(latexSource: string, phrase: string): string {
  const escaped = escapeRegex(phrase);
  const pattern = new RegExp(`(?:\\r?\\n)?\\s*\\\\item\\s*${escaped}\\s*`, 'g');
  return latexSource.replace(pattern, '\n');
}

/**
 * Generates an ATS-compliant LaTeX resume document from plain text
 */
export function generateLatexFromResumeText(resumeText: string): string {
  const lines = resumeText.split(/\r?\n/);
  let bodyTex = '';

  let inItemize = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inItemize) {
        bodyTex += '\\end{itemize}\n\n';
        inItemize = false;
      }
      continue;
    }

    // Check for section header
    if (/^(?:---?\s*)?([A-Z\s]{3,30})(?:\s*---?)?$/.test(trimmed)) {
      if (inItemize) {
        bodyTex += '\\end{itemize}\n\n';
        inItemize = false;
      }
      const title = trimmed.replace(/[-]/g, '').trim();
      bodyTex += `\\section*{${title}}\n\\hrule\n\\vspace{4pt}\n`;
      continue;
    }

    // Check for bullet
    if (/^[-•*▪]\s+/.test(trimmed)) {
      if (!inItemize) {
        bodyTex += '\\begin{itemize}[leftmargin=18pt, itemsep=2pt, parsep=0pt]\n';
        inItemize = true;
      }
      const itemText = trimmed.replace(/^[-•*▪]\s+/, '').replace(/[&%$#_{}~^\\]/g, '\\$&');
      bodyTex += `  \\item ${itemText}\n`;
      continue;
    }

    if (inItemize) {
      bodyTex += '\\end{itemize}\n\n';
      inItemize = false;
    }

    const safeText = trimmed.replace(/[&%$#_{}~^\\]/g, '\\$&');
    bodyTex += `${safeText}\\par\\vspace{3pt}\n`;
  }

  if (inItemize) {
    bodyTex += '\\end{itemize}\n\n';
  }

  return `\\documentclass[10.5pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{enumitem}
\\usepackage{hyperref}
\\usepackage[utf8]{inputenc}
\\usepackage{titlesec}

\\pagestyle{empty}
\\setlength{\\parindent}{0pt}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{10pt}{4pt}

\\begin{document}

${bodyTex}

\\end{document}
`;
}

/**
 * Cleanly extracts readable text from LaTeX resume source while stripping
 * preambles, color definitions (\definecolor, rgb), TikZ, and macro markup.
 */
export function extractCleanTextFromLatex(textContent: string): string {
  if (!textContent || typeof textContent !== 'string') return '';

  let body = textContent;

  // 1. Isolate the document body if \begin{document} is present
  const beginDocIdx = body.indexOf('\\begin{document}');
  if (beginDocIdx !== -1) {
    body = body.slice(beginDocIdx + '\\begin{document}'.length);
  } else {
    // If no \begin{document}, strip typical preamble commands
    body = body
      .replace(/\\documentclass(?:\[[^\]]*\])?\{[^}]*\}/gi, '')
      .replace(/\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/gi, '')
      .replace(/\\definecolor\{[^}]*\}\{[^}]*\}\{[^}]*\}/gi, '')
      .replace(/\\definecolor\{[^}]*\}\[[^\]]*\]\{[^}]*\}/gi, '')
      .replace(/\\colorlet\{[^}]*\}\{[^}]*\}/gi, '')
      .replace(/\\geometry\{[^}]*\}/gi, '')
      .replace(/\\hypersetup\{[^}]*\}/gi, '');
  }

  const endDocIdx = body.indexOf('\\end{document}');
  if (endDocIdx !== -1) {
    body = body.slice(0, endDocIdx);
  }

  // 2. Remove all LaTeX comments
  body = body.replace(/%.*$/gm, '');

  // 3. Remove color and font preamble macros that might be in body
  body = body
    .replace(/\\definecolor\{[^}]*\}\{[^}]*\}\{[^}]*\}/gi, '')
    .replace(/\\definecolor\{[^}]*\}\[[^\]]*\]\{[^}]*\}/gi, '')
    .replace(/\\colorlet\{[^}]*\}\{[^}]*\}/gi, '')
    .replace(/\\color(?:\[[^\]]*\])?\{[^}]*\}/gi, '')
    .replace(/\\textcolor\{[^}]*\}\{([^}]*)\}/gi, '$1')
    .replace(/\\pagecolor\{[^}]*\}/gi, '')
    .replace(/\\fontsize\{[^}]*\}\{[^}]*\}/gi, '')
    .replace(/\\selectfont/gi, '');

  // 4. Section headings
  body = body
    .replace(/\\(?:cv)?section\*?(?:\[[^\]]*\])?\{([^}]+)\}/gi, '\n\n--- $1 ---\n')
    .replace(/\\(?:cv)?subsection\*?(?:\[[^\]]*\])?\{([^}]+)\}/gi, '\n$1\n');

  // 5. Common multi-argument resume macros (Jake's Resume, ModernCV, AwesomeCV)
  body = body
    // \resumeSubheading{Role/Company}{Dates}{Company/Role}{Location}
    .replace(/\\resumeSubheading\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}/gi, '\n$1 | $2\n$3 | $4\n')
    // \cventry{Dates}{Degree/Role}{Institution/Company}{City}{Grade}{Description}
    .replace(/\\cventry\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}/gi, '\n$2 | $3 | $1 | $4\n$6\n')
    // \resumeProjectHeading{Title & tech}{Dates}
    .replace(/\\resumeProjectHeading\s*\{([^}]*)\}\s*\{([^}]*)\}/gi, '\n$1 | $2\n')
    // \resumeItem{Content}
    .replace(/\\resumeItem\s*\{([^}]*)\}/gi, '\n• $1\n');

  // 6. Hyperlinks: \href{url}{text} -> text
  body = body.replace(/\\href\{[^}]*\}\{([^}]*)\}/gi, '$1');
  body = body.replace(/\\url\{([^}]*)\}/gi, '$1');

  // 7. Bullet items
  body = body.replace(/\\item(?:\s*\[[^\]]*\])?\s*/gi, '\n• ');

  // 8. Text formatting macros (nested passes for \textbf{\textit{...}})
  for (let pass = 0; pass < 3; pass++) {
    body = body.replace(/\\(?:textbf|textit|emph|underline|textsc|textmd|textsf|textrm|texttt|mbox)\{([^}]*)\}/gi, '$1');
    body = body.replace(/\{\\(?:bfseries|itshape|em|scshape|sf|rm|tt)\s+([^}]*)\}/gi, '$1');
  }

  // 9. Environments (remove begin/end, table markup)
  body = body
    .replace(/\\begin\{[^}]+\}(?:\[[^\]]*\])?/gi, '')
    .replace(/\\end\{[^}]+\}/gi, '')
    .replace(/\\hline/gi, '')
    .replace(/\\hrulefill/gi, '')
    .replace(/\\hrule/gi, '')
    .replace(/\\vspace\*?\{[^}]*\}/gi, '\n')
    .replace(/\\hspace\*?\{[^}]*\}/gi, ' ');

  // 10. Strip all remaining backslash commands with or without arguments
  body = body.replace(/\\[a-zA-Z]+(?:\*|\[[^\]]*\])?(?:\{[^}]*\})?/gi, ' ');

  // 11. Tabular separators and line breaks
  body = body
    .replace(/\\\\(?:\s*\[[^\]]*\])?/g, '\n')
    .replace(/&/g, ' ')
    .replace(/\|/g, ' | ');

  // 12. Unescape common LaTeX symbols and ligatures
  body = body
    .replace(/\\([&%$#_{}])/g, '$1')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/``|''/g, '"')
    .replace(/`|'/g, "'")
    .replace(/~/g, ' ')
    .replace(/\\textbackslash/g, '\\')
    .replace(/[\{\}]/g, ''); // strip any orphan curly braces

  // 13. Pass through cleanCrampedResumeText to normalize headers, bullets, spacing
  return cleanCrampedResumeText(body);
}

/**
 * Direct browser download for LaTeX (.tex) resume
 */
export function downloadLatexResume(
  latexContent: string,
  filename = 'updated_resume.tex'
): void {
  const blob = new Blob([latexContent], { type: 'text/x-tex;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

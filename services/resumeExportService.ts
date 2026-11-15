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
 * Generates an ATS-compliant vector PDF blob styled exactly like the Overleaf / Jake's Resume
 * layout: centered name/contact header, solid section dividers, two-column role/date subheadings,
 * bold category skill prefixes, and clean dot bullets.
 */
export async function generateAtsResumePdfBlob(options: AtsResumePdfOptions): Promise<Blob> {
  const { resumeText } = options;
  const { jsPDF } = await import('jspdf');

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const margin = 40; // 0.55 in - matches modern LaTeX resumes (Overleaf standard)
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const printableWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin;

  let y = margin + 5;

  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > bottomLimit) {
      doc.addPage();
      y = margin + 10;
    }
  };

  const rawLines = resumeText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 0) {
    return doc.output('blob');
  }

  let lineIdx = 0;

  // 1. Name & Contact Header Detection
  const firstLine = rawLines[0];
  const isFirstLineHeader = /^(?:---?\s*)?(?:SUMMARY|EXPERIENCE|EDUCATION|SKILLS|PROJECTS)/i.test(firstLine);

  if (!isFirstLineHeader) {
    // Render Candidate Name: Large Bold Centered Serif
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(17, 17, 17);
    doc.text(firstLine, pageWidth / 2, y, { align: 'center' });
    y += 17;
    lineIdx = 1;

    // Check if next line is Contact Information (email, phone, dots, pipes, or links)
    if (lineIdx < rawLines.length) {
      const secondLine = rawLines[lineIdx];
      const isContact = /[@\+\|·•]|(?:github|linkedin)\.com/i.test(secondLine);
      if (isContact) {
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(40, 40, 40);
        doc.text(secondLine, pageWidth / 2, y, { align: 'center' });
        y += 18;
        lineIdx = 2;
      }
    }
    y += 4;
  }

  const standardSections = [
    'PROFESSIONAL SUMMARY',
    'SUMMARY',
    'TECHNICAL SKILLS',
    'SKILLS',
    'PROFESSIONAL EXPERIENCE',
    'EXPERIENCE',
    'WORK EXPERIENCE',
    'PROJECTS',
    'KEY PROJECTS',
    'EDUCATION',
    'CERTIFICATIONS',
    'AWARDS',
    'PUBLICATIONS',
  ];

  for (; lineIdx < rawLines.length; lineIdx++) {
    const line = rawLines[lineIdx];

    // 2. Check for Section Header (e.g. "PROFESSIONAL SUMMARY", "--- TECHNICAL SKILLS ---", "PROJECTS | github.com/...")
    let cleanHeaderTitle: string | null = null;
    let rightHeaderText: string | null = null;

    if (line.includes('|')) {
      const parts = line.split('|').map((p) => p.trim());
      const possibleSection = parts[0].replace(/^[-–—\s]+|[-–—\s]+$/g, '').toUpperCase();
      if (standardSections.includes(possibleSection)) {
        cleanHeaderTitle = possibleSection;
        rightHeaderText = parts.slice(1).join(' | ');
      }
    } else {
      const possibleSection = line.replace(/^[-–—\s]+|[-–—\s]+$/g, '').toUpperCase();
      if (standardSections.includes(possibleSection)) {
        cleanHeaderTitle = possibleSection;
      }
    }

    if (cleanHeaderTitle) {
      checkPageBreak(38);
      y += 8;

      // Section Title (Bold Uppercase 11.5pt)
      doc.setFont('times', 'bold');
      doc.setFontSize(11.5);
      doc.setTextColor(17, 17, 17);
      doc.text(cleanHeaderTitle, margin, y);

      // Right-side text if present (e.g. github.com/abustark)
      if (rightHeaderText) {
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(70, 70, 70);
        doc.text(rightHeaderText, pageWidth - margin, y, { align: 'right' });
      }

      // Crisp Full-Width Divider Rule
      y += 3;
      doc.setDrawColor(20, 20, 20);
      doc.setLineWidth(0.75);
      doc.line(margin, y, pageWidth - margin, y);
      y += 12;
      continue;
    }

    // 3. Check for Dual-Column Subheading (e.g. "ML Data Associate II | Aug 2023 – Present" or "Amazon | Chennai, India")
    if (line.includes('|') && !line.startsWith('•') && !line.startsWith('-')) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 2) {
        checkPageBreak(22);
        const leftText = parts[0];
        const rightText = parts.slice(1).join(' | ');

        // Check if this looks like a Company/Location line (italic) or Title/Dates line (bold)
        const isItalicSubheading =
          /^(?:Amazon|The American College|Thiagarajar College|Google|Meta|Microsoft|Freelance)\b/i.test(leftText) ||
          /(?:India|CA|USA|NY|Remote|Chennai|Madurai)\b/i.test(rightText);

        doc.setFont('times', isItalicSubheading ? 'italic' : 'bold');
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);
        doc.text(leftText, margin, y);

        doc.setFont('times', isItalicSubheading ? 'italic' : 'bold');
        doc.text(rightText, pageWidth - margin, y, { align: 'right' });
        y += 13.5;
        continue;
      }
    }

    // 4. Bullet Points (e.g. "• Analyzed and validated...", "• Data Analysis & Reporting: ...")
    const isBullet = /^[•\-*▪]\s+/.test(line);
    if (isBullet) {
      const bulletContent = line.replace(/^[•\-*▪]\s+/, '').trim();

      // Check if bullet has a bold category prefix (e.g. "Data Analysis & Reporting: ...", "Technologies: ...")
      const categoryMatch = bulletContent.match(/^([^:]+:)\s*(.*)$/);

      if (categoryMatch) {
        const categoryPrefix = categoryMatch[1]; // e.g. "Data Analysis & Reporting:" or "Technologies:"
        const categoryBody = categoryMatch[2];
        const isTechPrefix = /^Technologies:/i.test(categoryPrefix);

        doc.setFont('times', isTechPrefix ? 'italic' : 'bold');
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);

        const bulletSymbol = '•';
        const prefixWidth = doc.getTextWidth(`•  ${categoryPrefix} `);

        const textWidth = printableWidth - prefixWidth;
        const bodyLines = doc.splitTextToSize(categoryBody, textWidth);

        checkPageBreak(Math.max(1, bodyLines.length) * 13.5 + 4);

        doc.text(bulletSymbol, margin, y);
        doc.text(categoryPrefix, margin + 10, y);

        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);

        if (bodyLines.length > 0) {
          doc.text(bodyLines[0], margin + prefixWidth, y);

          for (let bIdx = 1; bIdx < bodyLines.length; bIdx++) {
            y += 13.5;
            doc.text(bodyLines[bIdx], margin + 10, y);
          }
        }
        y += 14;
        continue;
      } else {
        // Standard achievement bullet
        doc.setFont('times', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);

        const indent = 12;
        const textWidth = printableWidth - indent;
        const wrapped = doc.splitTextToSize(bulletContent, textWidth);

        checkPageBreak(wrapped.length * 13.5 + 3);

        doc.text('•', margin, y);
        doc.text(wrapped, margin + indent, y);
        y += wrapped.length * 13.5 + 2.5;
        continue;
      }
    }

    // 5. Standard Body Paragraphs (e.g. Summary text)
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(30, 30, 30);

    const wrapped = doc.splitTextToSize(line, printableWidth);
    checkPageBreak(wrapped.length * 13.5 + 4);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 13.5 + 4;
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
 * Injects a new bullet into an existing LaTeX document under the current job role
 */
export function injectIntoLatexSource(latexSource: string, phrase: string): string {
  const cleanPhrase = phrase.trim().endsWith('.') ? phrase.trim() : `${phrase.trim()}.`;

  // Look for Experience section in LaTeX
  const expMatch = latexSource.match(/\\(?:cv)?section\*?\{[^}]*(?:experience|employment)[^}]*\}/i);

  if (expMatch && typeof expMatch.index === 'number') {
    const expStart = expMatch.index;
    const rest = latexSource.slice(expStart);

    // 1. Check for \resumeItemListStart (e.g. Jake's Resume, Overleaf)
    const listStartIdx = rest.indexOf('\\resumeItemListStart');
    if (listStartIdx !== -1) {
      const insertPos = expStart + listStartIdx + '\\resumeItemListStart'.length;
      return `${latexSource.slice(0, insertPos)}\n        \\resumeItem{${cleanPhrase}}${latexSource.slice(insertPos)}`;
    }

    // 2. Check for \begin{itemize}
    const itemizeIdx = rest.indexOf('\\begin{itemize}');
    if (itemizeIdx !== -1) {
      const insertPos = expStart + itemizeIdx + '\\begin{itemize}'.length;
      return `${latexSource.slice(0, insertPos)}\n  \\item ${cleanPhrase}${latexSource.slice(insertPos)}`;
    }
  }

  // Fallback 1: Any \resumeItemListStart
  const anyResumeList = latexSource.indexOf('\\resumeItemListStart');
  if (anyResumeList !== -1) {
    const insertPos = anyResumeList + '\\resumeItemListStart'.length;
    return `${latexSource.slice(0, insertPos)}\n        \\resumeItem{${cleanPhrase}}${latexSource.slice(insertPos)}`;
  }

  // Fallback 2: Any \begin{itemize}
  const anyItemize = latexSource.indexOf('\\begin{itemize}');
  if (anyItemize !== -1) {
    const insertPos = anyItemize + '\\begin{itemize}'.length;
    return `${latexSource.slice(0, insertPos)}\n  \\item ${cleanPhrase}${latexSource.slice(insertPos)}`;
  }

  // Fallback 3: Append before \end{document}
  const endDocIdx = latexSource.indexOf('\\end{document}');
  if (endDocIdx !== -1) {
    return `${latexSource.slice(0, endDocIdx)}\n\\resumeItem{${cleanPhrase}}\n\n${latexSource.slice(endDocIdx)}`;
  }

  return `${latexSource}\n\\resumeItem{${cleanPhrase}}\n`;
}

/**
 * Removes an injected phrase from LaTeX source
 */
export function removePhraseFromLatexSource(latexSource: string, phrase: string): string {
  const clean = phrase.trim().replace(/\.$/, '');
  const escaped = escapeRegex(clean);
  const patterns = [
    new RegExp(`(?:\\r?\\n)?\\s*\\\\resumeItem\\{[^}]*${escaped}[^}]*\\}\\s*`, 'gi'),
    new RegExp(`(?:\\r?\\n)?\\s*\\\\item\\s+[^\\n]*${escaped}[^\\n]*`, 'gi'),
  ];
  let updated = latexSource;
  for (const p of patterns) {
    updated = updated.replace(p, '\n');
  }
  return updated;
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

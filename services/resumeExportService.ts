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

  const margin = 32; // Overleaf / Jake's resume compact 0.45 in margin
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const printableWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - margin;

  let y = margin + 2;

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

  // 1. Name & Contact Header Detection
  const firstLine = rawLines[0];
  const isFirstLineHeader = standardSections.some((s) => firstLine.toUpperCase().startsWith(s));

  if (!isFirstLineHeader) {
    // Render Candidate Name: Large Bold Centered Serif
    doc.setFont('times', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(17, 17, 17);
    doc.text(firstLine, pageWidth / 2, y, { align: 'center' });
    y += 13.5;
    lineIdx = 1;

    // Collect all contact lines before the first section header
    const contactParts: string[] = [];
    while (lineIdx < rawLines.length) {
      const nextLine = rawLines[lineIdx];
      const isNextSection = standardSections.some((s) => nextLine.toUpperCase().startsWith(s));
      if (isNextSection) break;

      // Extract parts separated by · or | or dots
      const parts = nextLine.split(/[|·•]/).map((p) => p.trim()).filter(Boolean);
      contactParts.push(...parts);
      lineIdx++;
    }

    if (contactParts.length > 0) {
      const contactRow = contactParts.join(' · ');
      doc.setFont('times', 'normal');
      doc.setFontSize(8.8);
      doc.setTextColor(40, 40, 40);
      doc.text(contactRow, pageWidth / 2, y, { align: 'center' });
      y += 12;
    }
  }

  for (; lineIdx < rawLines.length; lineIdx++) {
    const line = rawLines[lineIdx];

    // 2. Check for Section Header (e.g. "PROFESSIONAL SUMMARY", "TECHNICAL SKILLS", "PROJECTS | github.com/...")
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
      checkPageBreak(28);
      y += 6;

      // Section Title (Bold Uppercase 10.5pt)
      doc.setFont('times', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(17, 17, 17);
      doc.text(cleanHeaderTitle, margin, y);

      // Right-side text if present (e.g. github.com/abustark)
      if (rightHeaderText) {
        doc.setFont('times', 'normal');
        doc.setFontSize(8.8);
        doc.setTextColor(60, 60, 60);
        doc.text(rightHeaderText, pageWidth - margin, y, { align: 'right' });
      }

      // Crisp Full-Width Divider Rule
      y += 2.5;
      doc.setDrawColor(30, 30, 30);
      doc.setLineWidth(0.65);
      doc.line(margin, y, pageWidth - margin, y);
      y += 8.5;
      continue;
    }

    // 3. Check for Dual-Column Subheading (e.g. "ML Data Associate II | Aug 2023 – Present" or "Amazon | Chennai, India")
    if (line.includes('|') && !line.startsWith('•') && !line.startsWith('-')) {
      const parts = line.split('|').map((p) => p.trim());
      if (parts.length >= 2) {
        checkPageBreak(18);
        const leftText = parts[0];
        const rightText = parts.slice(1).join(' | ');

        // Check if this looks like a Company/Location line (italic) or Title/Dates line (bold)
        const isItalicSubheading =
          /^(?:Amazon|The American College|Thiagarajar College|Google|Meta|Microsoft|Freelance)\b/i.test(leftText) ||
          /(?:India|CA|USA|NY|Remote|Chennai|Madurai)\b/i.test(rightText);

        doc.setFont('times', isItalicSubheading ? 'italic' : 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(20, 20, 20);

        const rightWidth = doc.getTextWidth(rightText);
        const maxLeftWidth = printableWidth - rightWidth - 10;
        const leftLines = doc.splitTextToSize(leftText, maxLeftWidth);

        doc.text(leftLines[0], margin, y);
        doc.text(rightText, pageWidth - margin, y, { align: 'right' });

        if (leftLines.length > 1) {
          for (let l = 1; l < leftLines.length; l++) {
            y += 11.5;
            doc.text(leftLines[l], margin, y);
          }
        }

        y += 11.5;
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
        doc.setFontSize(9.5);
        doc.setTextColor(20, 20, 20);

        const bulletSymbol = '•';
        const prefixWidth = doc.getTextWidth(`•  ${categoryPrefix} `);

        const textWidth = printableWidth - prefixWidth;
        const bodyLines = doc.splitTextToSize(categoryBody, textWidth);

        checkPageBreak(Math.max(1, bodyLines.length) * 11.5 + 2);

        doc.text(bulletSymbol, margin, y);
        doc.text(categoryPrefix, margin + 9, y);

        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 30, 30);

        if (bodyLines.length > 0) {
          doc.text(bodyLines[0], margin + prefixWidth, y);

          for (let bIdx = 1; bIdx < bodyLines.length; bIdx++) {
            y += 11.5;
            doc.text(bodyLines[bIdx], margin + 9, y);
          }
        }
        y += 11.8;
        continue;
      } else {
        // Standard achievement bullet
        doc.setFont('times', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 30, 30);

        const indent = 9;
        const textWidth = printableWidth - indent;
        const wrapped = doc.splitTextToSize(bulletContent, textWidth);

        checkPageBreak(wrapped.length * 11.5 + 2);

        doc.text('•', margin, y);
        doc.text(wrapped, margin + indent, y);
        y += wrapped.length * 11.5 + 1.2;
        continue;
      }
    }

    // 5. Standard Body Paragraphs (e.g. Summary text)
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 30, 30);

    const wrapped = doc.splitTextToSize(line, printableWidth);
    checkPageBreak(wrapped.length * 11.5 + 3);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 11.5 + 3;
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

  // 2. Remove all LaTeX comments while preserving escaped \% (negative lookbehind)
  body = body.replace(/(?<!\\)%.*$/gm, '');

  // 3. Protect literal escaped symbols with unique sentinels so & in \& is never treated as a tabular delimiter
  body = body
    .replace(/\\&/g, '___AMP___')
    .replace(/\\%/g, '___PCT___')
    .replace(/\\\$/g, '___DLR___')
    .replace(/\\#/g, '___HSH___')
    .replace(/\\_/g, '___UND___')
    .replace(/\\\{/g, '___LBR___')
    .replace(/\\\}/g, '___RBR___');

  // 4. Remove color, geometry, and font preamble macros that might be in body
  body = body
    .replace(/\\definecolor\{[^}]*\}\{[^}]*\}\{[^}]*\}/gi, '')
    .replace(/\\definecolor\{[^}]*\}\[[^\]]*\]\{[^}]*\}/gi, '')
    .replace(/\\colorlet\{[^}]*\}\{[^}]*\}/gi, '')
    .replace(/\\color(?:\[[^\]]*\])?\{[^}]*\}/gi, '')
    .replace(/\\textcolor\{[^}]*\}\{([^}]*)\}/gi, '$1')
    .replace(/\\pagecolor\{[^}]*\}/gi, '')
    .replace(/\\fontsize\{[^}]*\}\{[^}]*\}/gi, '')
    .replace(/\\selectfont/gi, '');

  // 5. Clean math-mode delimiters ($|$, $\vert$, $\cdot$, $\bullet$) to clean dots
  body = body
    .replace(/\$\s*(?:\\vert|\||\\mid|\\cdot|\\bullet)\s*\$/g, ' · ')
    .replace(/\\(?:vert|cdot|bullet)\b/g, ' · ')
    .replace(/\$\s*\|\s*\$/g, ' · ')
    .replace(/\$\s*\$/g, ' · ')
    .replace(/(?<!\d)\$(?!\d)/g, ' '); // remove orphan math delimiters while protecting actual money like $100

  // 6. Hyperlinks: \href{url}{text} -> text, \url{url} -> url
  body = body.replace(/\\href\{[^}]*\}\{([^}]*)\}/gi, '$1');
  body = body.replace(/\\url\{([^}]*)\}/gi, '$1');

  // 7. Multi-pass unwrap of font and text formatting macros to eliminate nested braces
  // This allows macros like \resumeSubheading and \resumeProjectHeading to match cleanly
  for (let pass = 0; pass < 5; pass++) {
    body = body
      .replace(/\\(?:textbf|textit|textnormal|emph|underline|textsc|textmd|textsf|textrm|texttt|mbox|small|footnotesize|tiny|large|Large|Huge)\{([^{}]*)\}/gi, '$1')
      .replace(/\{\\(?:bfseries|itshape|em|scshape|sf|rm|tt|small|footnotesize|tiny|large|Large|Huge)\s+([^{}]*)\}/gi, '$1');
  }

  // 8. Section headings: extract cleanly without inserting artificial --- or —
  body = body.replace(/\\(?:cv)?section\*?(?:\[[^\]]*\])?\{([^}]+)\}/gi, (_match, inner) => {
    if (inner.includes('\\hfill')) {
      const parts = inner.split(/\\hfill/i).map((p: string) => p.trim());
      return `\n\n${parts[0]} | ${parts[1]}\n`;
    }
    return `\n\n${inner.trim()}\n`;
  });
  body = body.replace(/\\(?:cv)?subsection\*?(?:\[[^\]]*\])?\{([^}]+)\}/gi, '\n$1\n');

  // 9. Multi-argument resume macros (Jake's Resume, Overleaf, ModernCV)
  body = body.replace(/\\resumeSubheading\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}/gi, '\n$1 | $2\n$3 | $4\n');
  body = body.replace(/\\resumeProjectHeading\s*\{([^}]*)\}\s*\{([^}]*)\}/gi, '\n$1 | $2\n');
  body = body.replace(/\\cventry\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}\s*\{([^}]*)\}/gi, '\n$2 | $3 | $1 | $4\n$6\n');
  body = body.replace(/\\resumeItem\s*\{([^}]*)\}/gi, '\n• $1\n');

  // 10. Items and Technical skills list format: \item \textbf{Category}{: items}
  body = body.replace(/\{:\s*([^\}]*)\}/g, ': $1');
  body = body.replace(/\\item(?:\s*\[[^\]]*\])?\s*/gi, '\n• ');

  // 11. Environments and spacing commands
  body = body
    .replace(/\\begin\{[^}]+\}(?:\[[^\]]*\])?/gi, '')
    .replace(/\\end\{[^}]+\}/gi, '')
    .replace(/\\hline/gi, '')
    .replace(/\\hrulefill/gi, '')
    .replace(/\\hrule/gi, '')
    .replace(/\\vspace\*?\{[^}]*\}/gi, '\n')
    .replace(/\\hspace\*?\{[^}]*\}/gi, ' ');

  // 12. Strip remaining backslash command names without eating braces
  body = body.replace(/\\[a-zA-Z]+(?:\*|\[[^\]]*\])?/g, ' ');

  // 13. Tabular line breaks and separators
  body = body
    .replace(/\\\\(?:\s*\[[^\]]*\])?/g, '\n')
    .replace(/&/g, ' ')
    .replace(/\|/g, ' | ');

  // 14. Restore protected literal characters and ligatures
  body = body
    .replace(/___AMP___/g, '&')
    .replace(/___PCT___/g, '%')
    .replace(/___DLR___/g, '$')
    .replace(/___HSH___/g, '#')
    .replace(/___UND___/g, '_')
    .replace(/___LBR___/g, '{')
    .replace(/___RBR___/g, '}')
    .replace(/---/g, '—')
    .replace(/--/g, '–')
    .replace(/``|''/g, '"')
    .replace(/`|'/g, "'")
    .replace(/~/g, ' ')
    .replace(/\\textbackslash/g, '\\')
    .replace(/[\{\}]/g, ''); // strip orphan curly braces

  // 15. Standardize bullet characters to •
  body = body.replace(/^[ \t]*[·●▪▫◦■‣\-*]\s+/gm, '• ');

  // 16. Pass through cleanCrampedResumeText to normalize whitespace and headers
  const cleaned = cleanCrampedResumeText(body);

  // 17. Clean up top contact header: ensure all details (location, phone, email, links)
  // before the first section header are joined into a single clean line with ' · '
  const lines = cleaned.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length <= 1) return cleaned;

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
  ];

  const firstLine = lines[0];
  const isFirstLineHeader = standardSections.some((s) => firstLine.toUpperCase().startsWith(s));
  if (isFirstLineHeader) return cleaned;

  let firstSectionIdx = -1;
  for (let i = 1; i < lines.length; i++) {
    if (standardSections.some((s) => lines[i].toUpperCase().startsWith(s))) {
      firstSectionIdx = i;
      break;
    }
  }

  if (firstSectionIdx > 1) {
    const contactParts: string[] = [];
    for (let i = 1; i < firstSectionIdx; i++) {
      const parts = lines[i].split(/[|·•]/).map((p) => p.trim()).filter(Boolean);
      contactParts.push(...parts);
    }
    const singleContactLine = contactParts.join(' · ');
    return [firstLine, singleContactLine, ...lines.slice(firstSectionIdx)].join('\n\n');
  }

  return cleaned;
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

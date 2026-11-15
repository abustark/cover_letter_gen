/**
 * Typographic Editorial PDF Export Service
 *
 * Implements a dual-engine architecture:
 * 1. Primary: Rust WebAssembly (WASM) vector PDF layout engine (crates/pdf_engine).
 * 2. Fallback: Dynamic jsPDF layout engine configured with matching editorial margins and typography.
 */

export interface EditorialPdfOptions {
  content: string;
  companyName?: string;
  candidateName?: string;
  dateStr?: string;
}

let wasmModulePromise: Promise<unknown> | null = null;

async function getPdfWasmModule(): Promise<any> {
  if (typeof window === 'undefined') return null;
  if (!wasmModulePromise) {
    wasmModulePromise = (async () => {
      try {
        const response = await fetch('/wasm/pdf_engine_bg.wasm', { method: 'HEAD' });
        if (response.ok) {
          const wasm = await import(/* @vite-ignore */ '/wasm/pdf_engine.js');
          await wasm.default();
          return wasm;
        }
      } catch {
        // Fallback to jsPDF
      }
      return null;
    })();
  }
  return wasmModulePromise;
}

/**
 * Generates an editorial PDF Blob using either the Rust WASM engine or jsPDF
 */
export async function generateEditorialPdfBlob(options: EditorialPdfOptions): Promise<Blob> {
  const { content, companyName, candidateName, dateStr } = options;

  // Try Rust WebAssembly first
  try {
    const wasm = await getPdfWasmModule();
    if (wasm && typeof wasm.generate_editorial_pdf_wasm === 'function') {
      const config = {
        content,
        recipient_company: companyName || undefined,
        candidate_name: candidateName || undefined,
        date_str: dateStr || undefined,
        font_size_pt: 11.0,
        line_height_pt: 16.5,
        margin_pt: 54.0,
      };

      const uint8Array = wasm.generate_editorial_pdf_wasm(JSON.stringify(config));
      return new Blob([uint8Array], { type: 'application/pdf' });
    }
  } catch {
    // Graceful fallback to client jsPDF engine
  }

  // High-fidelity fallback via jsPDF with editorial layout
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const margin = 54; // 0.75 in
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const printableWidth = pageWidth - margin * 2;

  let y = margin;

  // Header banner if company is provided
  if (companyName && companyName.trim()) {
    doc.setFont('times', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(120, 80, 20); // Warm bronze
    doc.text(`APPLICATION FOR: ${companyName.trim().toUpperCase()}`, margin, y);
    y += 24;
  }

  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30); // Charcoal

  const paragraphs = content.split('\n');

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) {
      y += 14;
      continue;
    }

    const lines = doc.splitTextToSize(trimmed, printableWidth);

    for (const line of lines) {
      if (y > pageHeight - margin - 15) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 16.5; // Typographic line height
    }

    y += 8; // Paragraph spacing
  }

  return doc.output('blob');
}

/**
 * Downloads the editorial PDF file directly to the user's browser
 */
export async function downloadEditorialPdf(
  content: string,
  companyName?: string
): Promise<void> {
  if (!content) return;

  const blob = await generateEditorialPdfBlob({ content, companyName });
  const url = URL.createObjectURL(blob);
  const sanitized = (companyName || '').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = sanitized ? `Cover_Letter_${sanitized}.pdf` : 'Cover_Letter.pdf';

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

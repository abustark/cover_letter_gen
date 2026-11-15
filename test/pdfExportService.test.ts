import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateEditorialPdfBlob } from '../services/pdfExportService';

describe('pdfExportService (Typographic Editorial PDF Engine)', () => {
  it('generates a valid PDF blob from cover letter text', async () => {
    const content = `
    Dear Hiring Team at Stripe,

    I am writing to express my strong interest in the Senior Full-Stack Engineer role.
    Over the past five years, I have architected high-throughput financial pipelines,
    reducing latency by 45% and ensuring 99.99% uptime.

    Sincerely,
    Alex Mercer
    `;

    const blob = await generateEditorialPdfBlob({
      content,
      companyName: 'Stripe',
      candidateName: 'Alex Mercer',
    });

    assert.ok(blob instanceof Blob);
    assert.strictEqual(blob.type, 'application/pdf');
    assert.ok(blob.size > 500, `Expected PDF blob size > 500 bytes, got ${blob.size}`);
  });

  it('handles multi-paragraph documents with proper pagination', async () => {
    const longContent = Array(20)
      .fill('This is an extensive paragraph discussing distributed systems design and verifiable security.')
      .join('\n\n');

    const blob = await generateEditorialPdfBlob({
      content: longContent,
      companyName: 'Linear',
    });

    assert.ok(blob instanceof Blob);
    assert.ok(blob.size > 1000);
  });
});

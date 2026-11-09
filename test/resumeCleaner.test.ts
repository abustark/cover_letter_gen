import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanCrampedResumeText } from '../services/resumeCleaner';

describe('cleanCrampedResumeText', () => {
  it('returns empty string for empty input', () => {
    assert.strictEqual(cleanCrampedResumeText(''), '');
    assert.strictEqual(cleanCrampedResumeText('   '), '');
  });

  it('separates cramped section headers with double newlines', () => {
    const cramped =
      'John Doe Software Engineer SUMMARY Experienced full-stack developer with 5 years experience. EXPERIENCE Senior Developer at TechCorp 2020 - Present EDUCATION BS Computer Science SKILLS React, TypeScript, Node.js';
    const cleaned = cleanCrampedResumeText(cramped);

    assert.ok(cleaned.includes('\n\nSUMMARY\n'));
    assert.ok(cleaned.includes('\n\nEXPERIENCE\n'));
    assert.ok(cleaned.includes('\n\nEDUCATION\n'));
    assert.ok(cleaned.includes('\n\nSKILLS\n'));
  });

  it('puts inline bullet points onto distinct new lines', () => {
    const cramped =
      'Senior Developer TechCorp • Built high-throughput microservices • Reduced latency by 40% ● Mentored 4 junior engineers';
    const cleaned = cleanCrampedResumeText(cramped);

    assert.ok(cleaned.includes('\n• Built high-throughput microservices'));
    assert.ok(cleaned.includes('\n• Reduced latency by 40%'));
    assert.ok(cleaned.includes('\n• Mentored 4 junior engineers'));
  });

  it('does not corrupt email addresses that contain section words like contact@', () => {
    const text = 'Jane Doe contact@example.com phone: 123-456-7890';
    const cleaned = cleanCrampedResumeText(text);

    assert.ok(cleaned.includes('contact@example.com'));
  });

  it('normalizes carriage returns and multiple consecutive spaces', () => {
    const messy = 'Line 1   with   spaces\r\n\r\n\r\nLine 2';
    const cleaned = cleanCrampedResumeText(messy);

    assert.strictEqual(cleaned, 'Line 1 with spaces\n\nLine 2');
  });
});

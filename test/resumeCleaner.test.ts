import { describe, expect, it } from 'bun:test';
import { cleanCrampedResumeText } from '../services/resumeCleaner';

describe('cleanCrampedResumeText', () => {
  it('returns empty string for empty input', () => {
    expect(cleanCrampedResumeText('')).toBe('');
    expect(cleanCrampedResumeText('   ')).toBe('');
  });

  it('separates cramped section headers with double newlines', () => {
    const cramped =
      'John Doe Software Engineer SUMMARY Experienced full-stack developer with 5 years experience. EXPERIENCE Senior Developer at TechCorp 2020 - Present EDUCATION BS Computer Science SKILLS React, TypeScript, Node.js';
    const cleaned = cleanCrampedResumeText(cramped);

    expect(cleaned).toContain('\n\nSUMMARY\n');
    expect(cleaned).toContain('\n\nEXPERIENCE\n');
    expect(cleaned).toContain('\n\nEDUCATION\n');
    expect(cleaned).toContain('\n\nSKILLS\n');
  });

  it('puts inline bullet points onto distinct new lines', () => {
    const cramped =
      'Senior Developer TechCorp • Built high-throughput microservices • Reduced latency by 40% ● Mentored 4 junior engineers';
    const cleaned = cleanCrampedResumeText(cramped);

    expect(cleaned).toContain('\n• Built high-throughput microservices');
    expect(cleaned).toContain('\n• Reduced latency by 40%');
    expect(cleaned).toContain('\n• Mentored 4 junior engineers');
  });

  it('does not corrupt email addresses that contain section words like contact@', () => {
    const text = 'Jane Doe contact@example.com phone: 123-456-7890';
    const cleaned = cleanCrampedResumeText(text);

    expect(cleaned).toContain('contact@example.com');
  });

  it('normalizes carriage returns and multiple consecutive spaces', () => {
    const messy = 'Line 1   with   spaces\r\n\r\n\r\nLine 2';
    const cleaned = cleanCrampedResumeText(messy);

    expect(cleaned).toBe('Line 1 with spaces\n\nLine 2');
  });
});

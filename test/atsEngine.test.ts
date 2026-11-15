import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractKeywords,
  extractQuantifiableMetrics,
  detectSectionHeaders,
  analyzeAtsSync,
} from '../services/atsEngine';

describe('atsEngine (Rust AST & Keyword Intelligence)', () => {
  it('extracts technical keywords and ignores stop words', () => {
    const text = 'Senior React and TypeScript engineer working with Docker, Kubernetes, and AWS.';
    const keywords = extractKeywords(text);

    assert.ok(keywords.has('react'));
    assert.ok(keywords.has('typescript'));
    assert.ok(keywords.has('docker'));
    assert.ok(keywords.has('kubernetes'));
    assert.ok(keywords.has('aws'));
    assert.ok(!keywords.has('and'));
    assert.ok(!keywords.has('with'));
  });

  it('detects quantifiable metrics in text snippets', () => {
    const text = 'Increased conversion by 35% and scaled cluster to 10M events while cutting spend by $40k.';
    const metrics = extractQuantifiableMetrics(text);

    assert.ok(metrics.length >= 2);
    assert.ok(metrics.some((m) => m.includes('35%')));
    assert.ok(metrics.some((m) => m.includes('$40k')));
  });

  it('detects standard resume section headers', () => {
    const text = `
    JOHN DOE
    SUMMARY
    Experienced systems engineer.
    EXPERIENCE
    Staff Engineer at Stripe
    EDUCATION
    BS Computer Science
    SKILLS
    Rust, TypeScript, React, Go
    `;
    const headers = detectSectionHeaders(text);

    assert.ok(headers.includes('SUMMARY'));
    assert.ok(headers.includes('EXPERIENCE'));
    assert.ok(headers.includes('EDUCATION'));
    assert.ok(headers.includes('SKILLS'));
  });

  it('returns empty result for empty inputs', () => {
    const result = analyzeAtsSync('', '');
    assert.strictEqual(result.score, 0);
    assert.strictEqual(result.match_grade, 'Incomplete Input');
    assert.strictEqual(result.matched_keywords.length, 0);
  });

  it('calculates accurate alignment score and identifies missing keywords', () => {
    const resume = `
    Jane Smith - Senior Software Engineer
    EXPERIENCE
    TechCorp 2021 - Present
    • Built real-time streaming pipelines using React, TypeScript, and Node.js
    • Improved page speed by 45% and reduced latency by 30%
    EDUCATION
    BS in Computer Science
    SKILLS
    React, TypeScript, Node.js, GraphQL, Docker
    `;

    const job = `
    We are seeking a Senior Frontend Engineer proficient in React, TypeScript, Node.js, and Python.
    Experience with AWS cloud infrastructure and CI/CD pipelines is preferred.
    `;

    const result = analyzeAtsSync(resume, job);

    assert.ok(result.score >= 50, `Expected score >= 50, got ${result.score}`);
    assert.ok(result.matched_keywords.includes('react'));
    assert.ok(result.matched_keywords.includes('typescript'));
    assert.ok(result.matched_keywords.includes('node.js'));
    assert.ok(result.missing_keywords.includes('python') || result.missing_keywords.includes('aws'));
    assert.ok(result.quantifiable_metrics_count >= 1);
  });
});

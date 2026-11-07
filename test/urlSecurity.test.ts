import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateUrlSyntax,
  isPrivateOrBlockedIp,
  extractPageText,
  MAX_JOB_URL_TEXT_LENGTH,
} from '../api/utils/urlSecurity';

describe('Job URL Security & SSRF Defense', () => {
  describe('validateUrlSyntax', () => {
    it('accepts valid HTTPS URLs with standard port', () => {
      const parsed = validateUrlSyntax('https://careers.example.com/job/12345');
      assert.equal(parsed.hostname, 'careers.example.com');
      assert.equal(parsed.protocol, 'https:');
    });

    it('rejects unencrypted HTTP scheme', () => {
      assert.throws(() => validateUrlSyntax('http://example.com/job'), /Only HTTPS URLs/);
    });

    it('rejects dangerous schemes: file, ftp, javascript, data', () => {
      assert.throws(() => validateUrlSyntax('file:///etc/passwd'), /Only HTTPS URLs/);
      assert.throws(() => validateUrlSyntax('ftp://files.example.com/job'), /Only HTTPS URLs/);
      assert.throws(() => validateUrlSyntax('javascript:alert(1)'), /Only HTTPS URLs/);
      assert.throws(() => validateUrlSyntax('data:text/html,test'), /Only HTTPS URLs/);
    });

    it('rejects credentials in URL', () => {
      assert.throws(
        () => validateUrlSyntax('https://user:password@example.com/job'),
        /credentials/
      );
    });

    it('rejects non-standard ports', () => {
      assert.throws(() => validateUrlSyntax('https://example.com:8080/job'), /ports/);
      assert.throws(() => validateUrlSyntax('https://example.com:22/job'), /ports/);
      assert.throws(() => validateUrlSyntax('https://example.com:3000/job'), /ports/);
    });

    it('rejects local and metadata hostnames', () => {
      assert.throws(() => validateUrlSyntax('https://localhost/job'), /local or private/);
      assert.throws(() => validateUrlSyntax('https://app.localhost/job'), /local or private/);
      assert.throws(() => validateUrlSyntax('https://server.local/job'), /local or private/);
      assert.throws(() => validateUrlSyntax('https://internal.lan/job'), /local or private/);
      assert.throws(() => validateUrlSyntax('https://service.internal/job'), /local or private/);
      assert.throws(() => validateUrlSyntax('https://metadata.google.internal/job'), /local or private/);
      assert.throws(() => validateUrlSyntax('https://instance-data/job'), /local or private/);
    });
  });

  describe('isPrivateOrBlockedIp', () => {
    it('blocks IPv4 loopback (127.0.0.0/8)', () => {
      assert.equal(isPrivateOrBlockedIp('127.0.0.1'), true);
      assert.equal(isPrivateOrBlockedIp('127.0.1.1'), true);
      assert.equal(isPrivateOrBlockedIp('127.255.255.255'), true);
    });

    it('blocks IPv4 private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16)', () => {
      assert.equal(isPrivateOrBlockedIp('10.0.0.1'), true);
      assert.equal(isPrivateOrBlockedIp('10.255.0.1'), true);
      assert.equal(isPrivateOrBlockedIp('172.16.0.1'), true);
      assert.equal(isPrivateOrBlockedIp('172.24.5.1'), true);
      assert.equal(isPrivateOrBlockedIp('172.31.255.255'), true);
      assert.equal(isPrivateOrBlockedIp('192.168.0.1'), true);
      assert.equal(isPrivateOrBlockedIp('192.168.100.50'), true);
    });

    it('blocks cloud metadata IP (169.254.169.254) and link-local', () => {
      assert.equal(isPrivateOrBlockedIp('169.254.169.254'), true);
      assert.equal(isPrivateOrBlockedIp('169.254.0.1'), true);
      assert.equal(isPrivateOrBlockedIp('169.254.255.254'), true);
    });

    it('blocks carrier-grade NAT and reserved/multicast IPv4', () => {
      assert.equal(isPrivateOrBlockedIp('0.0.0.0'), true);
      assert.equal(isPrivateOrBlockedIp('100.64.0.1'), true);
      assert.equal(isPrivateOrBlockedIp('224.0.0.1'), true); // Multicast
      assert.equal(isPrivateOrBlockedIp('240.0.0.1'), true); // Reserved
    });

    it('blocks IPv6 loopback, link-local, and unique local addresses', () => {
      assert.equal(isPrivateOrBlockedIp('::1'), true);
      assert.equal(isPrivateOrBlockedIp('::'), true);
      assert.equal(isPrivateOrBlockedIp('fe80::1'), true);
      assert.equal(isPrivateOrBlockedIp('fc00::1'), true);
      assert.equal(isPrivateOrBlockedIp('fd00::1'), true);
    });

    it('blocks IPv4-mapped IPv6 loopback and metadata addresses', () => {
      assert.equal(isPrivateOrBlockedIp('::ffff:127.0.0.1'), true);
      assert.equal(isPrivateOrBlockedIp('::ffff:169.254.169.254'), true);
      assert.equal(isPrivateOrBlockedIp('::ffff:10.0.0.1'), true);
    });

    it('allows genuine public IPv4 addresses', () => {
      assert.equal(isPrivateOrBlockedIp('8.8.8.8'), false);
      assert.equal(isPrivateOrBlockedIp('1.1.1.1'), false);
      assert.equal(isPrivateOrBlockedIp('142.250.190.46'), false);
    });
  });

  describe('extractPageText', () => {
    it('removes script, style, nav, and footer tags', () => {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>body { font-size: 14px; }</style>
            <script>alert("tracker");</script>
          </head>
          <body>
            <header>Company Nav Header</header>
            <nav><a href="/">Home</a><a href="/jobs">Jobs</a></nav>
            <main>
              <h1>Senior Software Engineer</h1>
              <p>We are looking for an experienced engineer to join our team.</p>
              <ul>
                <li>5+ years of React experience</li>
                <li>TypeScript proficiency</li>
              </ul>
            </main>
            <aside>Cookie banner and advertisements</aside>
            <footer>Copyright 2026 Corporation</footer>
          </body>
        </html>
      `;

      const text = extractPageText(html);
      assert.ok(!text.includes('tracker'));
      assert.ok(!text.includes('font-size'));
      assert.ok(!text.includes('Cookie banner'));
      assert.ok(text.includes('Senior Software Engineer'));
      assert.ok(text.includes('5+ years of React experience'));
      assert.ok(text.includes('TypeScript proficiency'));
    });

    it('decodes HTML entities and normalizes whitespace', () => {
      const html = '<p>Rock &amp; Roll &bull; &quot;Lead&quot; &lt;Engineer&gt; &copy; 2026</p>';
      const text = extractPageText(html);
      assert.ok(text.includes('Rock & Roll'));
      assert.ok(text.includes('"Lead"'));
      assert.ok(text.includes('<Engineer>'));
    });

    it('strictly caps extracted text length at 12,000 characters', () => {
      const longContent = 'A'.repeat(20000);
      const html = `<div>${longContent}</div>`;
      const text = extractPageText(html);
      assert.equal(text.length, MAX_JOB_URL_TEXT_LENGTH);
    });
  });
});

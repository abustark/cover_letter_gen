import dns from 'dns';
import net from 'net';

export const MAX_JOB_URL_TEXT_LENGTH = 12000;
export const MAX_RESPONSE_BYTES = 2 * 1024 * 1024; // 2 MB
export const MAX_REDIRECTS = 3;
export const FETCH_TIMEOUT_MS = 8000; // 8 seconds

export interface SafeFetchResult {
  text: string;
  url: string;
}

/**
 * Validate URL syntax, scheme, credentials, and port.
 */
export function validateUrlSyntax(inputUrl: string): URL {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('A valid job posting URL is required.');
  }

  const trimmed = inputUrl.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error('Malformed URL format.');
  }

  // Enforce HTTPS
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed for security.');
  }

  // Reject credentials in URL
  if (parsed.username || parsed.password) {
    throw new Error('URLs containing credentials are not permitted.');
  }

  // Reject non-standard ports
  if (parsed.port && parsed.port !== '443') {
    throw new Error('Non-standard network ports are not permitted.');
  }

  const hostname = parsed.hostname.toLowerCase();

  // Hostname blocklist
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname.endsWith('.lan') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'instance-data'
  ) {
    throw new Error('Access to local or private network hostnames is prohibited.');
  }

  return parsed;
}

/**
 * Check if an IPv4 address is in private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map((p) => parseInt(p, 10));
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return true; // Malformed IP, block it
  }

  const [b0, b1] = parts;

  // 0.0.0.0/8 (Current network)
  if (b0 === 0) return true;

  // 10.0.0.0/8 (Private network)
  if (b0 === 10) return true;

  // 127.0.0.0/8 (Loopback)
  if (b0 === 127) return true;

  // 169.254.0.0/16 (Link-local, cloud metadata service 169.254.169.254)
  if (b0 === 169 && b1 === 254) return true;

  // 172.16.0.0/12 (Private network: 172.16.0.0 - 172.31.255.255)
  if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;

  // 192.168.0.0/16 (Private network)
  if (b0 === 192 && b1 === 168) return true;

  // 100.64.0.0/10 (Carrier-grade NAT: 100.64.0.0 - 100.127.255.255)
  if (b0 === 100 && b1 >= 64 && b1 <= 127) return true;

  // 192.0.0.0/24 (IETF Protocol Assignments)
  if (b0 === 192 && b1 === 0 && parts[2] === 0) return true;

  // 192.0.2.0/24 (TEST-NET-1)
  if (b0 === 192 && b1 === 0 && parts[2] === 2) return true;

  // 198.51.100.0/24 (TEST-NET-2)
  if (b0 === 198 && b1 === 51 && parts[2] === 100) return true;

  // 203.0.113.0/24 (TEST-NET-3)
  if (b0 === 203 && b1 === 0 && parts[2] === 113) return true;

  // 198.18.0.0/15 (Benchmarking)
  if (b0 === 198 && (b1 === 18 || b1 === 19)) return true;

  // 224.0.0.0/4 (Multicast: 224.0.0.0 - 239.255.255.255)
  if (b0 >= 224 && b0 <= 239) return true;

  // 240.0.0.0/4 (Reserved / Future use: 240.0.0.0 - 255.255.255.254)
  if (b0 >= 240) return true;

  return false;
}

/**
 * Check if an IPv6 address is in private, loopback, link-local, or reserved ranges.
 */
function isPrivateIPv6(ip: string): boolean {
  const normalized = ip.toLowerCase();

  // Loopback (::1) and unspecified (::)
  if (normalized === '::1' || normalized === '::') return true;

  // IPv4-mapped IPv6 (::ffff:192.0.2.128 or ::ffff:7f00:1)
  if (normalized.startsWith('::ffff:')) {
    const rest = normalized.slice(7);
    if (net.isIPv4(rest)) {
      return isPrivateIPv4(rest);
    }
  }

  // Link-local: fe80::/10 (fe80 to febf)
  if (/^fe[89ab]/i.test(normalized)) return true;

  // Unique local address: fc00::/7 (fc00 to fdff)
  if (/^f[cd]/i.test(normalized)) return true;

  // Discard prefix: 100::/64
  if (normalized.startsWith('100:')) return true;

  // Documentation: 2001:db8::/32
  if (normalized.startsWith('2001:db8:') || normalized === '2001:db8') return true;

  return false;
}

/**
 * Check if an IP address string is private, loopback, or reserved.
 */
export function isPrivateOrBlockedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    return isPrivateIPv4(ip);
  }
  if (family === 6) {
    return isPrivateIPv6(ip);
  }
  return true; // Non-standard or unparseable IP: block it
}

/**
 * Resolve hostname via DNS and ensure no resolved address points to private or reserved IPs.
 */
export async function assertPublicDnsHost(hostname: string): Promise<string[]> {
  // If the hostname itself is an IP literal
  if (net.isIP(hostname)) {
    if (isPrivateOrBlockedIp(hostname)) {
      throw new Error('Access to private or local network addresses is prohibited.');
    }
    return [hostname];
  }

  try {
    const records = await dns.promises.lookup(hostname, { all: true });
    if (!records || records.length === 0) {
      throw new Error('Could not resolve hostname.');
    }

    const resolvedIps = records.map((r) => r.address);
    for (const ip of resolvedIps) {
      if (isPrivateOrBlockedIp(ip)) {
        throw new Error('Destination host resolves to a private or restricted network address.');
      }
    }

    return resolvedIps;
  } catch (err) {
    if (err instanceof Error && err.message.includes('Destination host resolves to a private')) {
      throw err;
    }
    throw new Error('Failed to resolve job posting host.');
  }
}

/**
 * Tolerant HTML text extraction. Removes scripts, styles, boilerplates, and collapses whitespace.
 */
export function extractPageText(html: string): string {
  const text = html
    // Strip non-content and layout boilerplate tags
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<header[\s\S]*?<\/header>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<aside[\s\S]*?<\/aside>/gi, ' ')
    .replace(/<template[\s\S]*?<\/template>/gi, ' ')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
    // Strip all remaining HTML tags
    .replace(/<[^>]+>/g, ' ')
    // Decode common HTML entities
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x27;/gi, "'")
    // Collapse excess whitespace
    .replace(/\s+/g, ' ')
    .trim();

  return text.slice(0, MAX_JOB_URL_TEXT_LENGTH);
}

/**
 * Safely fetch a job-posting URL with SSRF protections, manual redirect validation,
 * timeouts, content-type checks, and streaming byte limits.
 */
export async function safeFetchJobPosting(initialUrl: string): Promise<SafeFetchResult> {
  let currentUrl = validateUrlSyntax(initialUrl);
  const visitedUrls = new Set<string>();

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const urlString = currentUrl.toString();
    if (visitedUrls.has(urlString)) {
      throw new Error('Redirect loop detected.');
    }
    visitedUrls.add(urlString);

    // Validate DNS of current URL
    await assertPublicDnsHost(currentUrl.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(currentUrl.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'CoverCraft/1.0 (+https://covercraft.app)',
          Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'manual',
        signal: controller.signal,
      });

      // Handle redirects manually
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) {
          throw new Error('Received redirect response without Location header.');
        }

        if (redirectCount >= MAX_REDIRECTS) {
          throw new Error('Too many redirects while accessing job posting.');
        }

        // Resolve relative redirects against current URL
        const nextUrl = new URL(location, currentUrl);
        currentUrl = validateUrlSyntax(nextUrl.toString());
        continue;
      }

      if (!response.ok) {
        throw new Error(`Job posting page returned status ${response.status}.`);
      }

      // Check Content-Type
      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw new Error('The URL did not return an HTML web page.');
      }

      // Stream response body with byte limit
      if (!response.body) {
        throw new Error('Empty response body received from server.');
      }

      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let totalBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          totalBytes += value.length;
          if (totalBytes > MAX_RESPONSE_BYTES) {
            reader.cancel();
            throw new Error('Page size exceeded maximum allowed limit (2 MB).');
          }
          chunks.push(value);
        }
      }

      const fullBuffer = Buffer.concat(chunks);
      const htmlText = fullBuffer.toString('utf8');
      const extractedText = extractPageText(htmlText);

      if (!extractedText || extractedText.length < 50) {
        throw new Error('Could not find readable job description content on that page.');
      }

      return {
        text: extractedText,
        url: currentUrl.toString(),
      };
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          throw new Error('Request timed out while reading the job posting.');
        }
        throw err;
      }
      throw new Error('Failed to fetch job posting content.');
    } finally {
      clearTimeout(timer);
    }
  }

  throw new Error('Too many redirects.');
}

# `fetch_url` (Rust High-Performance SSRF Scraper)

Ultra-low-latency, memory-safe job posting web reader and HTML plain-text extractor written in Rust.

## Purpose & Security Boundary

This crate serves as a production-grade systems security reference and standalone backend service for reading job posting URLs safely:
1. **SSRF Defense Matrix:** Enforces `https:` scheme only, standard port 443 only, and strict disallowal of credentials in URLs.
2. **DNS & IP Blacklisting:** Resolves target hostnames asynchronously with Tokio DNS lookup and blocks:
   - Loopback (`127.0.0.0/8`, `::1`)
   - RFC 1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Cloud metadata endpoints (`169.254.169.254` AWS/GCP instance metadata)
   - Carrier-grade NAT (`100.64.0.0/10`)
   - IPv6 unique-local (`fc00::/7`) and link-local (`fe80::/10`)
3. **Bounded Manual Redirects:** Re-validates target host and IP at each hop (maximum 3 redirects) to prevent redirect smuggling.
4. **Streaming Byte Cap & Timeout:** Enforces an 8-second hard timeout and 2 MB maximum transfer ceiling.
5. **Fast HTML Text Extraction:** Strips scripts, styles, navs, footers, headers, and SVGs, collapsing plain text to a bounded 12,000-character payload.

## Building and Running

```bash
cargo build --release
./target/release/fetch_url "https://jobs.lever.co/company/job-id"
```

## Running Rust Tests

```bash
cargo test
```

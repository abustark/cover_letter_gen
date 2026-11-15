use futures_util::StreamExt;
use reqwest::header::{HeaderMap, HeaderValue, USER_AGENT};
use serde::{Deserialize, Serialize};
use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};
use std::time::Duration;
use url::Url;

pub const MAX_JOB_URL_TEXT_LENGTH: usize = 12000;
pub const MAX_RESPONSE_BYTES: usize = 2 * 1024 * 1024; // 2 MB
pub const MAX_REDIRECTS: usize = 3;
pub const FETCH_TIMEOUT: Duration = Duration::from_secs(8);

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct FetchJobRequest {
    pub url: String,
}

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct FetchJobResponse {
    pub text: String,
    pub original_url: String,
    pub final_url: String,
    pub bytes_read: usize,
    pub execution_engine: String,
}

#[derive(Debug, PartialEq)]
pub enum SsrfError {
    MalformedUrl,
    NonHttpsScheme,
    CredentialsNotAllowed,
    NonStandardPort,
    BlockedHostname,
    DnsResolutionFailed,
    BlockedIpAddress(String),
    TooManyRedirects,
    RequestTimeout,
    ByteLimitExceeded,
    HttpError(u16),
    ExtractionFailed(String),
}

impl std::fmt::Display for SsrfError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SsrfError::MalformedUrl => write!(f, "A valid job posting URL is required."),
            SsrfError::NonHttpsScheme => write!(f, "Only HTTPS URLs are allowed for security."),
            SsrfError::CredentialsNotAllowed => write!(f, "URLs containing credentials are not permitted."),
            SsrfError::NonStandardPort => write!(f, "Non-standard network ports are not permitted."),
            SsrfError::BlockedHostname => write!(f, "Access to local or private network hostnames is prohibited."),
            SsrfError::DnsResolutionFailed => write!(f, "Could not resolve destination hostname."),
            SsrfError::BlockedIpAddress(ip) => {
                write!(f, "Access to private or local network IP addresses ({}) is prohibited.", ip)
            }
            SsrfError::TooManyRedirects => write!(f, "Too many redirects encountered while reading the job posting."),
            SsrfError::RequestTimeout => write!(f, "Connection timed out while fetching the job posting."),
            SsrfError::ByteLimitExceeded => write!(f, "Web page exceeded the maximum permitted size of 2 MB."),
            SsrfError::HttpError(status) => write!(f, "Target career website returned HTTP error: {}", status),
            SsrfError::ExtractionFailed(msg) => write!(f, "Failed to extract plain text: {}", msg),
        }
    }
}

impl std::error::Error for SsrfError {}

/// Strict URL syntax and protocol verification
pub fn validate_url_syntax(input_url: &str) -> Result<Url, SsrfError> {
    let trimmed = input_url.trim();
    if trimmed.is_empty() {
        return Err(SsrfError::MalformedUrl);
    }

    let parsed = Url::parse(trimmed).map_err(|_| SsrfError::MalformedUrl)?;

    if parsed.scheme() != "https" {
        return Err(SsrfError::NonHttpsScheme);
    }

    if !parsed.username().is_empty() || parsed.password().is_some() {
        return Err(SsrfError::CredentialsNotAllowed);
    }

    if let Some(port) = parsed.port() {
        if port != 443 {
            return Err(SsrfError::NonStandardPort);
        }
    }

    let host_str = match parsed.host_str() {
        Some(h) => h.to_lowercase(),
        None => return Err(SsrfError::MalformedUrl),
    };

    if host_str == "localhost"
        || host_str.ends_with(".localhost")
        || host_str.ends_with(".local")
        || host_str.ends_with(".internal")
        || host_str.ends_with(".lan")
        || host_str == "metadata.google.internal"
        || host_str == "instance-data"
    {
        return Err(SsrfError::BlockedHostname);
    }

    Ok(parsed)
}

/// Validates whether an IPv4 address belongs to private, loopback, or cloud metadata CIDRs
pub fn is_private_ipv4(ip: Ipv4Addr) -> bool {
    let octets = ip.octets();
    let b0 = octets[0];
    let b1 = octets[1];

    // Loopback (127.0.0.0/8), Current network (0.0.0.0/8)
    if b0 == 0 || b0 == 127 {
        return true;
    }

    // Private RFC 1918: 10.0.0.0/8
    if b0 == 10 {
        return true;
    }

    // Link-local & Cloud Metadata: 169.254.0.0/16 (includes 169.254.169.254)
    if b0 == 169 && b1 == 254 {
        return true;
    }

    // Private RFC 1918: 172.16.0.0/12
    if b0 == 172 && (16..=31).contains(&b1) {
        return true;
    }

    // Private RFC 1918: 192.168.0.0/16
    if b0 == 192 && b1 == 168 {
        return true;
    }

    // Carrier-Grade NAT: 100.64.0.0/10
    if b0 == 100 && (64..=127).contains(&b1) {
        return true;
    }

    // Documentation / TEST-NET (192.0.2.0/24, 198.51.100.0/24, 203.0.113.0/24)
    if (b0 == 192 && b1 == 0 && octets[2] == 2)
        || (b0 == 198 && b1 == 51 && octets[2] == 100)
        || (b0 == 203 && b1 == 0 && octets[2] == 113)
    {
        return true;
    }

    // Multicast & Broadcast: 224.0.0.0/4 and above
    if b0 >= 224 {
        return true;
    }

    false
}

/// Validates whether an IPv6 address is loopback, unique-local, or link-local
pub fn is_private_ipv6(ip: Ipv6Addr) -> bool {
    if ip.is_loopback() || ip.is_unspecified() {
        return true;
    }

    let segments = ip.segments();
    let first = segments[0];

    // Unique-local (fc00::/7)
    if (first & 0xfe00) == 0xfc00 {
        return true;
    }

    // Link-local (fe80::/10)
    if (first & 0xffc0) == 0xfe80 {
        return true;
    }

    // IPv4-mapped IPv6 (::ffff:0:0/96)
    if let Some(ipv4) = ip.to_ipv4_mapped() {
        return is_private_ipv4(ipv4);
    }

    false
}

/// Resolves DNS and guarantees every returned IP address is public and non-malicious
pub async fn verify_destination_ip(host: &str) -> Result<IpAddr, SsrfError> {
    // Check if host is direct IP
    if let Ok(ip) = host.parse::<IpAddr>() {
        match ip {
            IpAddr::V4(v4) if is_private_ipv4(v4) => return Err(SsrfError::BlockedIpAddress(v4.to_string())),
            IpAddr::V6(v6) if is_private_ipv6(v6) => return Err(SsrfError::BlockedIpAddress(v6.to_string())),
            _ => return Ok(ip),
        }
    }

    let socket_addrs = tokio::net::lookup_host(format!("{}:443", host))
        .await
        .map_err(|_| SsrfError::DnsResolutionFailed)?;

    let mut first_valid_ip: Option<IpAddr> = None;

    for addr in socket_addrs {
        let ip = addr.ip();
        match ip {
            IpAddr::V4(v4) if is_private_ipv4(v4) => {
                return Err(SsrfError::BlockedIpAddress(v4.to_string()));
            }
            IpAddr::V6(v6) if is_private_ipv6(v6) => {
                return Err(SsrfError::BlockedIpAddress(v6.to_string()));
            }
            _ => {
                if first_valid_ip.is_none() {
                    first_valid_ip = Some(ip);
                }
            }
        }
    }

    first_valid_ip.ok_or(SsrfError::DnsResolutionFailed)
}

/// High-performance HTML stripping and plain text normalization
pub fn extract_page_text(html: &str) -> String {
    let re_script = regex::Regex::new(r"(?is)<script\b[^<]*(?:(?!</script>)<[^<]*)*</script>").unwrap();
    let re_style = regex::Regex::new(r"(?is)<style\b[^<]*(?:(?!</style>)<[^<]*)*</style>").unwrap();
    let re_nav = regex::Regex::new(r"(?is)<nav\b[^<]*(?:(?!</nav>)<[^<]*)*</nav>").unwrap();
    let re_footer = regex::Regex::new(r"(?is)<footer\b[^<]*(?:(?!</footer>)<[^<]*)*</footer>").unwrap();
    let re_header = regex::Regex::new(r"(?is)<header\b[^<]*(?:(?!</header>)<[^<]*)*</header>").unwrap();
    let re_svg = regex::Regex::new(r"(?is)<svg\b[^<]*(?:(?!</svg>)<[^<]*)*</svg>").unwrap();
    let re_br = regex::Regex::new(r"(?i)<br\s*/?>").unwrap();
    let re_blocks = regex::Regex::new(r"(?i)</(p|div|li|h[1-6]|tr|article|section)>").unwrap();
    let re_tags = regex::Regex::new(r"<[^>]+>").unwrap();
    let re_spaces = regex::Regex::new(r"\s+").unwrap();

    let mut cleaned = re_script.replace_all(html, " ").into_owned();
    cleaned = re_style.replace_all(&cleaned, " ").into_owned();
    cleaned = re_nav.replace_all(&cleaned, " ").into_owned();
    cleaned = re_footer.replace_all(&cleaned, " ").into_owned();
    cleaned = re_header.replace_all(&cleaned, " ").into_owned();
    cleaned = re_svg.replace_all(&cleaned, " ").into_owned();

    cleaned = re_br.replace_all(&cleaned, "\n").into_owned();
    cleaned = re_blocks.replace_all(&cleaned, "\n").into_owned();
    cleaned = re_tags.replace_all(&cleaned, " ").into_owned();

    cleaned = cleaned
        .replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&quot;", "\"")
        .replace("&#39;", "'");

    let mut lines = Vec::new();
    for line in cleaned.lines() {
        let trimmed = re_spaces.replace_all(line.trim(), " ");
        if !trimmed.is_empty() {
            lines.push(trimmed.into_owned());
        }
    }

    let mut result = lines.join("\n");
    if result.len() > MAX_JOB_URL_TEXT_LENGTH {
        result.truncate(MAX_JOB_URL_TEXT_LENGTH);
    }

    result.trim().to_string()
}

/// Securely fetches the target job posting with manual bounded redirects & streaming byte caps
pub async fn safe_fetch_job_posting(initial_url: &str) -> Result<FetchJobResponse, SsrfError> {
    let mut current_url = initial_url.to_string();
    let mut redirects_count = 0;

    let client = reqwest::Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .timeout(FETCH_TIMEOUT)
        .build()
        .map_err(|_| SsrfError::RequestTimeout)?;

    while redirects_count <= MAX_REDIRECTS {
        let parsed = validate_url_syntax(&current_url)?;
        let host = parsed.host_str().ok_or(SsrfError::MalformedUrl)?;

        verify_destination_ip(host).await?;

        let mut headers = HeaderMap::new();
        headers.insert(
            USER_AGENT,
            HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 CoverCraft/2.1"),
        );

        let response = client
            .get(&current_url)
            .headers(headers)
            .send()
            .await
            .map_err(|e| {
                if e.is_timeout() {
                    SsrfError::RequestTimeout
                } else {
                    SsrfError::HttpError(502)
                }
            })?;

        let status = response.status();

        // Handle redirects manually to re-verify host and IP at each hop
        if status.is_redirection() {
            redirects_count += 1;
            if redirects_count > MAX_REDIRECTS {
                return Err(SsrfError::TooManyRedirects);
            }

            let location = response
                .headers()
                .get(reqwest::header::LOCATION)
                .and_then(|l| l.to_str().ok())
                .ok_or(SsrfError::MalformedUrl)?;

            let resolved_location = parsed
                .join(location)
                .map_err(|_| SsrfError::MalformedUrl)?
                .to_string();

            current_url = resolved_location;
            continue;
        }

        if !status.is_success() {
            return Err(SsrfError::HttpError(status.as_u16()));
        }

        // Stream body with strict byte limit
        let mut stream = response.bytes_stream();
        let mut body_bytes = Vec::new();

        while let Some(chunk_res) = stream.next().await {
            let chunk = chunk_res.map_err(|_| SsrfError::HttpError(502))?;
            if body_bytes.len() + chunk.len() > MAX_RESPONSE_BYTES {
                return Err(SsrfError::ByteLimitExceeded);
            }
            body_bytes.extend_from_slice(&chunk);
        }

        let raw_html = String::from_utf8_lossy(&body_bytes);
        let cleaned_text = extract_page_text(&raw_html);

        return Ok(FetchJobResponse {
            text: cleaned_text,
            original_url: initial_url.to_string(),
            final_url: current_url,
            bytes_read: body_bytes.len(),
            execution_engine: "Rust (Native Tokio/Reqwest)".to_string(),
        });
    }

    Err(SsrfError::TooManyRedirects)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_validate_url_syntax() {
        assert!(validate_url_syntax("https://jobs.lever.co/stripe/software-engineer").is_ok());
        assert_eq!(
            validate_url_syntax("http://insecure.example.com"),
            Err(SsrfError::NonHttpsScheme)
        );
        assert_eq!(
            validate_url_syntax("https://user:pass@example.com"),
            Err(SsrfError::CredentialsNotAllowed)
        );
        assert_eq!(
            validate_url_syntax("https://localhost:443/admin"),
            Err(SsrfError::BlockedHostname)
        );
        assert_eq!(
            validate_url_syntax("https://example.com:8080/job"),
            Err(SsrfError::NonStandardPort)
        );
    }

    #[test]
    fn test_is_private_ipv4() {
        assert!(is_private_ipv4("127.0.0.1".parse().unwrap()));
        assert!(is_private_ipv4("10.0.0.1".parse().unwrap()));
        assert!(is_private_ipv4("192.168.1.1".parse().unwrap()));
        assert!(is_private_ipv4("172.20.0.1".parse().unwrap()));
        assert!(is_private_ipv4("169.254.169.254".parse().unwrap())); // AWS/GCP metadata
        assert!(!is_private_ipv4("8.8.8.8".parse().unwrap()));
        assert!(!is_private_ipv4("104.16.132.229".parse().unwrap()));
    }

    #[test]
    fn test_extract_page_text() {
        let html = r#"
            <html>
                <head>
                    <title>Job Posting</title>
                    <script>alert('malicious')</script>
                    <style>.hidden { display: none; }</style>
                </head>
                <body>
                    <nav><a href="/">Home</a></nav>
                    <h1>Senior Rust Engineer</h1>
                    <p>We are seeking an engineer to build <b>high-throughput</b> distributed pipelines.</p>
                    <footer>Copyright 2026</footer>
                </body>
            </html>
        "#;

        let extracted = extract_page_text(html);
        assert!(extracted.contains("Senior Rust Engineer"));
        assert!(extracted.contains("We are seeking an engineer"));
        assert!(!extracted.contains("alert"));
        assert!(!extracted.contains(".hidden"));
        assert!(!extracted.contains("Copyright 2026"));
    }
}

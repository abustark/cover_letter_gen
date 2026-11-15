use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub struct AtsAnalysisResult {
    pub score: u32,
    pub match_grade: String,
    pub matched_keywords: Vec<String>,
    pub missing_keywords: Vec<String>,
    pub quantifiable_metrics_count: usize,
    pub sample_metrics: Vec<String>,
    pub word_count_resume: usize,
    pub word_count_job: usize,
    pub section_headers_detected: Vec<String>,
    pub execution_mode: String,
}

const COMMON_STOP_WORDS: &[&str] = &[
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are",
    "aren't", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both",
    "but", "by", "can", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't",
    "doing", "don't", "down", "during", "each", "few", "for", "from", "further", "had", "hadn't",
    "has", "hasn't", "have", "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here",
    "here's", "hers", "herself", "him", "himself", "his", "how", "how's", "i", "i'd", "i'll",
    "i'm", "i've", "if", "in", "into", "is", "isn't", "it", "it's", "its", "itself", "let's",
    "me", "more", "most", "mustn't", "my", "myself", "no", "nor", "not", "of", "off", "on",
    "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own",
    "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then",
    "there", "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this",
    "those", "through", "to", "too", "under", "until", "up", "very", "was", "wasn't", "we",
    "we'd", "we'll", "we're", "we've", "were", "weren't", "what", "what's", "when", "when's",
    "where", "where's", "which", "while", "who", "who's", "whom", "why", "why's", "with",
    "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're", "you've", "your", "yours",
    "yourself", "yourselves", "will", "shall", "responsibilities", "qualifications", "requirements",
    "experience", "years", "work", "job", "role", "team", "company", "looking", "working", "must",
    "preferred", "plus", "ability", "strong", "skills", "knowledge", "using", "including",
];

const STANDARD_SECTION_HEADERS: &[&str] = &[
    "EXPERIENCE",
    "WORK EXPERIENCE",
    "EMPLOYMENT HISTORY",
    "EDUCATION",
    "SKILLS",
    "TECHNICAL SKILLS",
    "SUMMARY",
    "PROFESSIONAL SUMMARY",
    "PROJECTS",
    "PERSONAL PROJECTS",
    "CERTIFICATIONS",
    "PUBLICATIONS",
    "AWARDS",
    "VOLUNTEERING",
];

/// Extracts normalized tokens from plain text while filtering out common stopwords
pub fn extract_keywords(text: &str) -> HashMap<String, usize> {
    let stop_words: HashSet<&'static str> = COMMON_STOP_WORDS.iter().cloned().collect();
    let mut counts: HashMap<String, usize> = HashMap::new();

    let clean = text
        .replace(['/', '\\', ',', ';', ':', '(', ')', '[', ']', '{', '}', '"', '\'', '`', '!', '?'], " ")
        .replace(['•', '●', '▪', '–', '—', '*', '|'], " ");

    for raw_word in clean.split_whitespace() {
        let mut trimmed = raw_word
            .trim_matches(|c: char| !c.is_alphanumeric() && c != '.' && c != '+' && c != '#' && c != '-')
            .to_lowercase();

        trimmed = trimmed.trim_end_matches('.').to_string();

        if trimmed.len() < 2 || trimmed.len() > 30 {
            continue;
        }

        if stop_words.contains(trimmed.as_str()) {
            continue;
        }

        // Must contain at least one ASCII letter
        if !trimmed.chars().any(|c| c.is_alphabetic()) {
            continue;
        }

        *counts.entry(trimmed).or_insert(0) += 1;
    }

    counts
}

/// Detects quantifiable metrics like "40%", "$500k", "10x", "5 years", "100k+ users"
pub fn extract_quantifiable_metrics(text: &str) -> Vec<String> {
    let mut metrics = Vec::new();
    let words: Vec<&str> = text.split_whitespace().collect();

    for (i, word) in words.iter().enumerate() {
        let clean = word.trim_matches(|c: char| !c.is_alphanumeric() && c != '%' && c != '$' && c != '+' && c != 'x' && c != 'X');
        
        let is_metric = clean.contains('%')
            || clean.starts_with('$')
            || (clean.ends_with('x') || clean.ends_with('X')) && clean.len() > 1 && clean[..clean.len()-1].chars().all(|c| c.is_numeric() || c == '.')
            || clean.ends_with('+') && clean[..clean.len()-1].chars().any(|c| c.is_numeric())
            || (clean.ends_with('k') || clean.ends_with('K') || clean.ends_with('M') || clean.ends_with('B')) && clean.chars().any(|c| c.is_numeric());

        if is_metric {
            // Build a short 3-word snippet for context
            let start = if i > 0 { i - 1 } else { i };
            let end = std::cmp::min(words.len(), i + 2);
            let snippet = words[start..end].join(" ");
            if !metrics.contains(&snippet) && metrics.len() < 8 {
                metrics.push(snippet);
            }
        }
    }

    metrics
}

/// Identifies standard resume section headers present in the document
pub fn detect_section_headers(text: &str) -> Vec<String> {
    let uppercase_text = text.to_uppercase();
    let mut detected = Vec::new();

    for header in STANDARD_SECTION_HEADERS {
        if uppercase_text.contains(header) && !detected.contains(&header.to_string()) {
            detected.push(header.to_string());
        }
    }

    detected
}

/// Core deterministic ATS analysis matching resume credentials to job description
pub fn analyze_ats(resume_text: &str, job_text: &str) -> AtsAnalysisResult {
    let word_count_resume = resume_text.split_whitespace().count();
    let word_count_job = job_text.split_whitespace().count();

    if word_count_resume == 0 || word_count_job == 0 {
        return AtsAnalysisResult {
            score: 0,
            match_grade: "Incomplete Input".to_string(),
            matched_keywords: Vec::new(),
            missing_keywords: Vec::new(),
            quantifiable_metrics_count: 0,
            sample_metrics: Vec::new(),
            word_count_resume,
            word_count_job,
            section_headers_detected: Vec::new(),
            execution_mode: "Rust (Core)".to_string(),
        };
    }

    let resume_keywords = extract_keywords(resume_text);
    let job_keywords = extract_keywords(job_text);

    // Rank job keywords by frequency
    let mut job_ranked: Vec<(&String, &usize)> = job_keywords.iter().collect();
    job_ranked.sort_by(|a, b| b.1.cmp(a.1).then_with(|| a.0.cmp(b.0)));

    let mut matched: Vec<String> = Vec::new();
    let mut missing: Vec<String> = Vec::new();

    for (word, _) in job_ranked.iter() {
        if resume_keywords.contains_key(*word) {
            matched.push((*word).clone());
        } else {
            missing.push((*word).clone());
        }
    }

    // Calculate score
    let total_job_keywords = job_keywords.len().max(1);
    let base_match_ratio = (matched.len() as f64) / (total_job_keywords as f64);

    let metrics = extract_quantifiable_metrics(resume_text);
    let metrics_bonus = ((metrics.len() as f64) * 4.0).min(15.0);

    let section_headers = detect_section_headers(resume_text);
    let structure_bonus = ((section_headers.len() as f64) * 3.0).min(15.0);

    let keyword_score = (base_match_ratio * 120.0).min(70.0);
    let raw_score = keyword_score + metrics_bonus + structure_bonus;
    let clamped_score = (raw_score.round() as u32).min(100).max(10);

    let match_grade = match clamped_score {
        85..=100 => "Exceptional Alignment",
        70..=84 => "Strong Match",
        50..=69 => "Moderate Match",
        _ => "Needs Keyword Enrichment",
    }
    .to_string();

    AtsAnalysisResult {
        score: clamped_score,
        match_grade,
        matched_keywords: matched.into_iter().take(12).collect(),
        missing_keywords: missing.into_iter().take(10).collect(),
        quantifiable_metrics_count: metrics.len(),
        sample_metrics: metrics,
        word_count_resume,
        word_count_job,
        section_headers_detected: section_headers,
        execution_mode: "Rust (WASM Accelerated)".to_string(),
    }
}

/// WebAssembly entry point callable directly from JavaScript / TypeScript
#[wasm_bindgen]
pub fn analyze_resume_and_job_wasm(resume_text: &str, job_text: &str) -> Result<JsValue, JsValue> {
    let result = analyze_ats(resume_text, job_text);
    serde_wasm_bindgen::to_value(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialization error: {}", e)))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_extract_keywords() {
        let text = "Experienced React and TypeScript engineer building high-performance web systems.";
        let keywords = extract_keywords(text);
        assert!(keywords.contains_key("react"));
        assert!(keywords.contains_key("typescript"));
        assert!(keywords.contains_key("engineer"));
        assert!(!keywords.contains_key("and"));
    }

    #[test]
    fn test_extract_quantifiable_metrics() {
        let text = "Reduced latency by 45% and scaled microservices to 10M requests while cutting costs by $50k.";
        let metrics = extract_quantifiable_metrics(text);
        assert!(!metrics.is_empty());
        assert!(metrics.iter().any(|m| m.contains("45%")));
        assert!(metrics.iter().any(|m| m.contains("$50k")));
    }

    #[test]
    fn test_ats_analysis() {
        let resume = "Senior Engineer with React, TypeScript, Rust, Docker, and PostgreSQL. Reduced query time by 60%. EXPERIENCE EDUCATION SKILLS";
        let job = "Looking for a Senior Engineer proficient in React, TypeScript, Rust, and AWS cloud.";
        let result = analyze_ats(resume, job);
        assert!(result.score >= 50);
        assert!(result.matched_keywords.contains(&"react".to_string()));
        assert!(result.matched_keywords.contains(&"typescript".to_string()));
        assert!(result.missing_keywords.contains(&"aws".to_string()));
    }
}

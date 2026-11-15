use serde::{Deserialize, Serialize};
use std::fmt::Write as FmtWrite;
use wasm_bindgen::prelude::*;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EditorialPdfConfig {
    pub content: String,
    pub candidate_name: Option<String>,
    pub recipient_company: Option<String>,
    pub date_str: Option<String>,
    pub font_size_pt: Option<f32>,
    pub line_height_pt: Option<f32>,
    pub margin_pt: Option<f32>,
}

const A4_WIDTH_PT: f32 = 595.28;
const A4_HEIGHT_PT: f32 = 841.89;
const DEFAULT_MARGIN_PT: f32 = 54.0; // 0.75 in
const DEFAULT_FONT_SIZE_PT: f32 = 11.0;
const DEFAULT_LINE_HEIGHT_PT: f32 = 16.5;

/// Estimates average character width in Times-Roman for wrapping
fn estimate_char_width(c: char, font_size: f32) -> f32 {
    let factor = match c {
        'i' | 'l' | 'j' | 'f' | 't' | 'r' | ' ' | '.' | ',' | '\'' | '!' | ';' | ':' => 0.28,
        'm' | 'w' | 'M' | 'W' => 0.85,
        'A'..='Z' => 0.65,
        _ => 0.48,
    };
    font_size * factor
}

/// Splits a paragraph into wrapped lines fitted to printable_width
pub fn wrap_paragraph_to_lines(text: &str, max_width_pt: f32, font_size_pt: f32) -> Vec<String> {
    let mut lines = Vec::new();
    let words = text.split_whitespace();

    let mut current_line = String::new();
    let mut current_width = 0.0;

    for word in words {
        let mut word_width = 0.0;
        for c in word.chars() {
            word_width += estimate_char_width(c, font_size_pt);
        }

        let space_width = estimate_char_width(' ', font_size_pt);

        if current_line.is_empty() {
            current_line.push_str(word);
            current_width = word_width;
        } else if current_width + space_width + word_width <= max_width_pt {
            current_line.push(' ');
            current_line.push_str(word);
            current_width += space_width + word_width;
        } else {
            lines.push(current_line);
            current_line = word.to_string();
            current_width = word_width;
        }
    }

    if !current_line.is_empty() {
        lines.push(current_line);
    }

    lines
}

/// Escapes special PDF text string characters
fn escape_pdf_string(s: &str) -> String {
    let mut out = String::new();
    for c in s.chars() {
        match c {
            '(' => out.push_str("\\("),
            ')' => out.push_str("\\)"),
            '\\' => out.push_str("\\\\"),
            _ if (c as u32) < 128 => out.push(c),
            _ => out.push(' '), // ASCII normalize
        }
    }
    out
}

/// Generates a valid, self-contained PDF 1.4 byte buffer from configuration
pub fn render_editorial_pdf_bytes(config: &EditorialPdfConfig) -> Vec<u8> {
    let margin = config.margin_pt.unwrap_or(DEFAULT_MARGIN_PT);
    let font_size = config.font_size_pt.unwrap_or(DEFAULT_FONT_SIZE_PT);
    let line_height = config.line_height_pt.unwrap_or(DEFAULT_LINE_HEIGHT_PT);
    let printable_width = A4_WIDTH_PT - (margin * 2.0);

    // Group content into lines
    let mut all_lines: Vec<String> = Vec::new();

    // Optional header banner
    if let Some(ref comp) = config.recipient_company {
        if !comp.trim().is_empty() {
            all_lines.push(format!("APPLICATION FOR: {}", comp.trim().to_uppercase()));
            all_lines.push("".to_string());
        }
    }

    for raw_para in config.content.split('\n') {
        let trimmed = raw_para.trim();
        if trimmed.is_empty() {
            all_lines.push("".to_string());
        } else {
            let wrapped = wrap_paragraph_to_lines(trimmed, printable_width, font_size);
            for w in wrapped {
                all_lines.push(w);
            }
        }
    }

    // Paginate lines
    let lines_per_page = ((A4_HEIGHT_PT - (margin * 2.0)) / line_height).floor() as usize;
    let mut pages_lines: Vec<Vec<String>> = Vec::new();
    let mut current_page: Vec<String> = Vec::new();

    for line in all_lines {
        if current_page.len() >= lines_per_page {
            pages_lines.push(current_page);
            current_page = Vec::new();
        }
        current_page.push(line);
    }
    if !current_page.is_empty() {
        pages_lines.push(current_page);
    }
    if pages_lines.is_empty() {
        pages_lines.push(vec!["".to_string()]);
    }

    let num_pages = pages_lines.len();

    // Build PDF structures
    let mut pdf = Vec::new();
    pdf.extend_from_slice(b"%PDF-1.4\n%\xe2\xe3\xcf\xd3\n");

    let mut xref_offsets: Vec<usize> = Vec::new();
    xref_offsets.push(0); // 0 is null entry

    // Object 1: Catalog
    xref_offsets.push(pdf.len());
    pdf.extend_from_slice(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

    // Object 2: Pages
    let mut kids_str = String::new();
    for i in 0..num_pages {
        let page_obj_id = 4 + (i * 2);
        let _ = write!(kids_str, "{} 0 R ", page_obj_id);
    }

    xref_offsets.push(pdf.len());
    let pages_obj = format!(
        "2 0 obj\n<< /Type /Pages /Kids [{}] /Count {} >>\nendobj\n",
        kids_str.trim(),
        num_pages
    );
    pdf.extend_from_slice(pages_obj.as_bytes());

    // Object 3: Font (Times-Roman)
    xref_offsets.push(pdf.len());
    pdf.extend_from_slice(
        b"3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman /Encoding /WinAnsiEncoding >>\nendobj\n",
    );

    // Generate Page and Content Stream objects
    for (page_idx, p_lines) in pages_lines.iter().enumerate() {
        let page_obj_id = 4 + (page_idx * 2);
        let stream_obj_id = page_obj_id + 1;

        // Content Stream
        let mut stream_data = String::new();
        stream_data.push_str("BT\n");
        let _ = writeln!(stream_data, "/F1 {:.1} Tf", font_size);
        let _ = writeln!(
            stream_data,
            "1 0 0 1 {:.2} {:.2} Tm",
            margin,
            A4_HEIGHT_PT - margin - font_size
        );
        let _ = writeln!(stream_data, "{:.1} TL", line_height);

        for (line_idx, line) in p_lines.iter().enumerate() {
            if line_idx > 0 {
                stream_data.push_str("T*\n");
            }
            if !line.is_empty() {
                let escaped = escape_pdf_string(line);
                let _ = writeln!(stream_data, "({}) Tj", escaped);
            }
        }
        stream_data.push_str("ET\n");

        // Page Object
        xref_offsets.push(pdf.len());
        let page_obj = format!(
            "{} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {:.2} {:.2}] /Contents {} 0 R /Resources << /Font << /F1 3 0 R >> >> >>\nendobj\n",
            page_obj_id, A4_WIDTH_PT, A4_HEIGHT_PT, stream_obj_id
        );
        pdf.extend_from_slice(page_obj.as_bytes());

        // Stream Object
        xref_offsets.push(pdf.len());
        let stream_obj = format!(
            "{} 0 obj\n<< /Length {} >>\nstream\n{}endstream\nendobj\n",
            stream_obj_id,
            stream_data.len(),
            stream_data
        );
        pdf.extend_from_slice(stream_obj.as_bytes());
    }

    // Cross-reference table
    let xref_start = pdf.len();
    let total_objects = xref_offsets.len();

    let mut xref = format!("xref\n0 {}\n0000000000 65535 f \n", total_objects);
    for offset in &xref_offsets[1..] {
        let _ = writeln!(xref, "{:010} 00000 n ", offset);
    }
    pdf.extend_from_slice(xref.as_bytes());

    // Trailer
    let trailer = format!(
        "trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{}\n%%EOF\n",
        total_objects, xref_start
    );
    pdf.extend_from_slice(trailer.as_bytes());

    pdf
}

/// WebAssembly entry point callable from JavaScript / TypeScript
#[wasm_bindgen]
pub fn generate_editorial_pdf_wasm(config_json: &str) -> Result<Vec<u8>, JsValue> {
    let config: EditorialPdfConfig = serde_json::from_str(config_json)
        .map_err(|e| JsValue::from_str(&format!("JSON Parse Error: {}", e)))?;

    let pdf_bytes = render_editorial_pdf_bytes(&config);
    Ok(pdf_bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_wrap_paragraph_to_lines() {
        let text = "This is a long sentence that should be wrapped into multiple lines based on printable page width.";
        let lines = wrap_paragraph_to_lines(text, 150.0, 11.0);
        assert!(lines.len() >= 2);
    }

    #[test]
    fn test_render_editorial_pdf_bytes() {
        let config = EditorialPdfConfig {
            content: "Dear Hiring Team,\n\nI am writing to express my strong enthusiasm for the role.\n\nSincerely,\nCandidate".to_string(),
            candidate_name: Some("Jane Doe".to_string()),
            recipient_company: Some("TechCorp".to_string()),
            date_str: Some("November 2026".to_string()),
            font_size_pt: Some(11.0),
            line_height_pt: Some(16.5),
            margin_pt: Some(54.0),
        };

        let bytes = render_editorial_pdf_bytes(&config);
        assert!(bytes.starts_with(b"%PDF-1.4"));
        assert!(bytes.ends_with(b"%%EOF\n"));
    }
}

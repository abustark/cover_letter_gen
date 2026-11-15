# `ats_engine` (Rust WebAssembly ATS & Resume Intelligence)

High-performance, memory-safe ATS resume tokenizer, keyword gap analyzer, and quantifiable metrics extraction engine written in Rust and compiled to WebAssembly (WASM).

## Architecture

This crate provides:
1. **Keyword Extraction & Stop Word Filtering:** Fast zero-allocation token normalization.
2. **Deterministic ATS Match Scoring:** Jaccard similarity weighted by frequency, section structure, and quantifiable metrics bonus.
3. **Keyword Gap Analysis:** Extracts highest-frequency requirement keywords present in the target job description but missing from the resume.
4. **Metric Density Linter:** Flags quantifiable metrics (`%`, `$`, multipliers, and scale numbers) in the candidate profile.
5. **WebAssembly Bindings:** `wasm-bindgen` export `analyze_resume_and_job_wasm` callable directly from React/TypeScript.

## Local Compilation to WebAssembly

Prerequisites:
- Rust toolchain (`rustup`)
- `wasm-pack` (`cargo install wasm-pack`)

```bash
cd crates/ats_engine
wasm-pack build --target web --release --out-dir ../../public/wasm
```

## Running Rust Tests

```bash
cargo test
```

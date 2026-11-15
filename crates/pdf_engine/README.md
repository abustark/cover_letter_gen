# `pdf_engine` (Rust Typographic Editorial PDF Engine)

High-performance, publication-grade vector PDF generator and typographical layout engine written in Rust and compiled to WebAssembly (WASM).

## Architecture

This crate provides:
1. **Self-Contained PDF 1.4 Generation:** Pure vector PDF generation with zero external C dependencies, compiling cleanly to `wasm32-unknown-unknown`.
2. **Typographic Layout & Line Breaker:** Word-boundary paragraph wrapping and balanced margins calibrated for 0.75-inch letterpress margins.
3. **Multi-Page Pagination:** Automatic overflow calculation and multi-page tree generation.
4. **Clean Byte Stream:** Emits raw PDF buffers in `< 10 ms` directly to browser memory.
5. **WebAssembly Binding:** `wasm-bindgen` export `generate_editorial_pdf_wasm(config_json)`.

## Local Compilation to WebAssembly

Prerequisites:
- Rust toolchain (`rustup`)
- `wasm-pack` (`cargo install wasm-pack`)

```bash
cd crates/pdf_engine
wasm-pack build --target web --release --out-dir ../../public/wasm
```

## Running Rust Tests

```bash
cargo test
```

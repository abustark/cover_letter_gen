import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Prefer .env.local over any OPENROUTER_API_KEY set at the OS/process level.
// Vite's loadEnv merges process.env over .env files, so a stale machine-level
// key can silently override the project key. This reads .env.local directly
// and uses it as the source of truth.
const readEnvLocal = (): Record<string, string> => {
  const out: Record<string, string> = {};
  try {
    const raw = fs.readFileSync('.env.local', 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx === -1) continue;
      out[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
    }
  } catch {
    // .env.local missing — fall back to loadEnv below.
  }
  return out;
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const local = readEnvLocal();
    const apiKey = local.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY || env.GEMINI_API_KEY;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), tailwindcss()],
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.OPENROUTER_API_KEY': JSON.stringify(local.OPENROUTER_API_KEY || env.OPENROUTER_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});

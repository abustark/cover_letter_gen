import path from 'path';
import fs from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';
import { defineConfig, loadEnv, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { VercelRequest, VercelResponse } from '@vercel/node';

// Prefer .env.local over any machine-level environment variables
const loadLocalEnvConfig = (): Record<string, string> => {
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
    // .env.local missing
  }
  return out;
};

/**
 * Vite dev plugin that routes `/api/*` requests through the same server handlers as Vercel.
 * This guarantees complete development-to-production parity without leaking any API keys
 * into the client bundle or having CORS failures in local development.
 */
function apiDevPlugin(envVars: Record<string, string>): Plugin {
  return {
    name: 'covercraft-api-dev',
    configureServer(server) {
      // Set server-side environment variables for local dev
      for (const [k, v] of Object.entries(envVars)) {
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }

      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = (req.url || '').split('?')[0];

        if (url !== '/api/openrouter' && url !== '/api/fetch-url') {
          return next();
        }

        const chunks: Buffer[] = [];
        req.on('data', (chunk: Buffer) => chunks.push(chunk));
        req.on('end', async () => {
          try {
            const rawBody = Buffer.concat(chunks).toString('utf8');
            let body: unknown = {};
            if (rawBody.trim()) {
              try {
                body = JSON.parse(rawBody);
              } catch {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Malformed JSON payload.' }));
                return;
              }
            }

            const vercelReq = req as unknown as VercelRequest;
            vercelReq.body = body;

            const vercelRes = res as unknown as VercelResponse;
            vercelRes.status = (statusCode: number) => {
              res.statusCode = statusCode;
              return vercelRes;
            };
            vercelRes.json = (data: unknown) => {
              if (!res.headersSent) {
                res.setHeader('Content-Type', 'application/json');
              }
              res.end(JSON.stringify(data));
              return vercelRes;
            };
            vercelRes.send = (data: unknown) => {
              res.end(data as string | Buffer);
              return vercelRes;
            };

            if (url === '/api/openrouter') {
              const mod = await server.ssrLoadModule('./api/openrouter.ts');
              await mod.default(vercelReq, vercelRes);
            } else if (url === '/api/fetch-url') {
              const mod = await server.ssrLoadModule('./api/fetch-url.ts');
              await mod.default(vercelReq, vercelRes);
            }
          } catch (handlerErr) {
            console.error('API dev middleware error:', handlerErr);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Internal server error in dev API handler.' }));
            }
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const local = loadLocalEnvConfig();
  const mergedEnv = { ...env, ...local };

  // Sync keys to process.env for server-side endpoints in dev
  for (const [k, v] of Object.entries(mergedEnv)) {
    if (v && !process.env[k]) {
      process.env[k] = v;
    }
  }

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    // The client bundle NEVER receives the OpenRouter API key in either mode
    define: {},
    plugins: [
      react(),
      tailwindcss(),
      apiDevPlugin(mergedEnv),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
          },
        },
      },
    },
  };
});

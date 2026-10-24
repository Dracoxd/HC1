import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'vite';
import path from 'path';
import {defineConfig} from 'vite';
import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

function appointmentsApiDevPlugin(): Plugin {
  return {
    name: 'appointments-api-dev',
    configureServer(server) {
      const healthApiMiddleware = async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
        void next;
        try {
          const apiRequest = request as typeof request & { body?: unknown; headers: IncomingHttpHeaders };
          if (request.method === 'POST') {
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            apiRequest.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          }
          const apiResponse = response as typeof response & { status: (code: number) => typeof response; json: (body: unknown) => void };
          apiResponse.status = (code) => { response.statusCode = code; return response; };
          apiResponse.json = (body) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(body)); };
          const { default: handler } = await server.ssrLoadModule('/api/health-data.ts');
          await handler(apiRequest, apiResponse);
        } catch {
          response.statusCode = 400;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: 'Invalid request.' }));
        }
      };
      const adminApiMiddleware = async (request: IncomingMessage, response: ServerResponse, next: () => void) => {
        void next;
        try {
          const apiRequest = request as typeof request & { body?: unknown; headers: IncomingHttpHeaders };
          if (request.method === 'POST') {
            const chunks: Buffer[] = [];
            for await (const chunk of request) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
            apiRequest.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          }
          const apiResponse = response as typeof response & { status: (code: number) => typeof response; json: (body: unknown) => void };
          apiResponse.status = (code) => { response.statusCode = code; return response; };
          apiResponse.json = (body) => { response.setHeader('Content-Type', 'application/json'); response.end(JSON.stringify(body)); };
          const { default: handler } = await server.ssrLoadModule('/api/admin.ts');
          await handler(apiRequest, apiResponse);
        } catch {
          response.statusCode = 400;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: 'Invalid request.' }));
        }
      };
      server.middlewares.use('/api/admin', adminApiMiddleware);
      server.middlewares.use('/api/health-data', healthApiMiddleware);
      server.middlewares.use('/api/appointments', async (request, response, next) => {
        try {
          const apiRequest = request as typeof request & { body?: unknown };
          if (request.method === 'POST') {
            const chunks: Buffer[] = [];
            let size = 0;
            for await (const chunk of request) {
              const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
              size += buffer.length;
              if (size > 16_384) {
                response.statusCode = 413;
                response.end(JSON.stringify({ error: 'Request is too large.' }));
                return;
              }
              chunks.push(buffer);
            }
            apiRequest.body = JSON.parse(Buffer.concat(chunks).toString('utf8'));
          }
          const apiResponse = response as typeof response & {
            status: (code: number) => typeof response;
            json: (body: unknown) => void;
          };
          apiResponse.status = (code) => {
            response.statusCode = code;
            return response;
          };
          apiResponse.json = (body) => {
            response.setHeader('Content-Type', 'application/json');
            response.end(JSON.stringify(body));
          };

          const { default: handler } = await server.ssrLoadModule('/api/appointments.ts');
          await handler(apiRequest, apiResponse);
        } catch {
          response.statusCode = 400;
          response.setHeader('Content-Type', 'application/json');
          response.end(JSON.stringify({ error: 'Invalid request body.' }));
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), appointmentsApiDevPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

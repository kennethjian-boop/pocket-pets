#!/usr/bin/env node
/**
 * Local fake Supabase for visual QA and browser tests (Node HTTP wrapper around
 * lib/demo-backend/core.mjs). NEVER point QA runs at the real family project.
 *
 *   node scripts/qa/mock-supabase.mjs            # listens on :54399
 *   POST /__mock/reset?scenario=default|fresh|victory|rich
 *   GET  /__mock/state
 */
import http from 'node:http';
import { handleRequest } from '../../lib/demo-backend/core.mjs';

const PORT = Number(process.env.MOCK_SUPABASE_PORT ?? 54399);

function readBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : null);
      } catch {
        resolve(null);
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PATCH,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    });
    return res.end();
  }
  const body = await readBody(req);
  const out = handleRequest({ method: req.method, url: `http://localhost:${PORT}${req.url}`, headers: req.headers, body });
  res.writeHead(out.status, out.headers);
  res.end(out.body);
});

server.listen(PORT, () => {
  console.log(`[mock-supabase] listening on http://localhost:${PORT}`);
});

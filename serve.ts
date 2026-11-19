// Vice Panel Studio dev server: serves app/ on http://localhost:8080.
// Node 22 standard library only. Run from the repository root:
//
//   node serve.ts
//
// Serves only files under app/, with a small content-type table. No network
// requests are made by the app itself; this server is only for trying it
// locally in a desktop browser.

import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const PORT = 8080;
const APP_DIR = join(process.cwd(), 'app');

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  let path = url.pathname === '/' ? '/index.html' : url.pathname;
  const file = join(APP_DIR, normalize(path).replace(/^(\.\.[/\\])+/, ''));
  if (!file.startsWith(APP_DIR)) {
    res.writeHead(403, { 'content-type': 'text/plain' });
    res.end('forbidden');
    return;
  }
  try {
    if (!statSync(file).isFile()) throw new Error('not a file');
    const body = readFileSync(file);
    res.writeHead(200, {
      'content-type': CONTENT_TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream',
      'content-length': body.length,
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found');
  }
});

server.listen(PORT, () => {
  console.log(`Vice Panel Studio at http://localhost:${PORT}/`);
});

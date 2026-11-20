// Vice Heat — a tiny static server for local development only.
// Serves app/ at / and screenshots/ at /screenshots/ on port 8080.
// Run: node serve.ts, then open http://localhost:8080.

import { createServer } from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const PORT = 8080;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const path = decodeURIComponent(url.pathname);
  const roots = path.startsWith('/screenshots/') ? [join(here, 'screenshots')] : [join(here, 'app')];
  const rel = path.startsWith('/screenshots/') ? path.slice('/screenshots/'.length) : path.replace(/^\//, '');
  const file = join(roots[0], rel === '' ? 'index.html' : rel);
  if (!file.startsWith(roots[0]) || !existsSync(file)) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(PORT, () => {
  console.log(`serve.ts: Vice Heat at http://localhost:${PORT}`);
});

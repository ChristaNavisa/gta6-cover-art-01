// Vice Panel Studio — tiny static server for local work (gta6-cover-art-01).
//
// Serves app/ at the site root (so /index.html, /style.css, /src/*.js,
// /fonts/*.ttf and /samples/*.jpg all resolve) and screenshots/ under
// /screenshots/. Used by the screenshot script to load the app in a headless
// browser; the shipped app itself needs no server at all.
//
//   node serve.ts [--port 8123] [--root /path/to/repo]
//
// Paths are resolved inside the repository root and never climb out of it.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
};

function argValue(flag: string, fallback: string): string {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] !== undefined ? String(process.argv[i + 1]) : fallback;
}

/** Map a request path to a file inside the repo root, or null. */
function fileFor(root: string, urlPath: string): string | null {
  const clean = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  // '/' is the app's page; anything else is a path under app/ (or under
  // screenshots/ when it starts with that segment).
  const rel = clean === '/' ? 'index.html' : clean.replace(/^\//, '');
  const parts = rel.split('/');
  if (parts[0] === 'screenshots') {
    const target = resolve(root, ...parts);
    if (!target.startsWith(root + sep)) return null;
    return target;
  }
  const target = resolve(root, 'app', ...parts);
  if (!target.startsWith(join(root, 'app') + sep) && target !== join(root, 'app')) return null;
  return target;
}

const repoRoot = resolve(argValue('--root', dirname(fileURLToPath(import.meta.url))));
const port = Number(process.env.PORT ?? argValue('--port', '8123'));

const server = createServer((req, res) => {
  const file = fileFor(repoRoot, req.url ?? '/');
  if (file === null || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found\n');
    return;
  }
  const type = MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
  res.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
  res.end(readFileSync(file));
});

server.listen(port, () => {
  console.log(`serving ${repoRoot} on http://127.0.0.1:${port}/`);
});

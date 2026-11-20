// Vice Heat — the program. It hands the app in: it copies app/ and
// screenshots/ from beside this file to /output and writes
// /output/dossier.json, the summary the judge reads, with the vendored
// make.fun library. Node 22, standard library only.
//
// The output directory the grader hands us can be a mount point, so we
// never remove the directory itself: emptyContents() deletes only its
// children. Before copying we validate every screenshot (3 or 4 files,
// each at most 256 KiB, real JPEG or PNG bytes), and after writing the
// dossier we rebuild it fresh and refuse to finish if the bytes differ.
//
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const MAX_SHOT_BYTES = 262144;
const MAX_SHOTS = 4;

// Remove every child of a directory, never the directory itself.
function emptyContents(dir) {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

// A real JPEG starts FF D8 FF; a real PNG starts with the 8-byte signature.
function shotKind(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'png';
  return null;
}

function fail(message) {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

// 1. Validate the screenshots before anything is copied.
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');
const shotNames = readdirSync(shotsDir).filter((n) => !n.startsWith('.')).sort();
if (shotNames.length < 3 || shotNames.length > MAX_SHOTS) {
  fail(`expected 3 or 4 screenshots, found ${shotNames.length}`);
}
for (const name of shotNames) {
  const path = join(shotsDir, name);
  const size = statSync(path).size;
  if (size > MAX_SHOT_BYTES) fail(`${name} is ${size} bytes, over the 256 KiB cap`);
  const kind = shotKind(readFileSync(path));
  if (!kind) fail(`${name} is not a JPEG or PNG file`);
}

// 2. Validate the app entry point.
const indexPath = join(here, 'app', 'index.html');
if (!existsSync(indexPath)) fail('app/index.html is missing');
if (statSync(indexPath).size > 1048576) fail('app/index.html is over the 1 MiB cap');

// 3. Hand the app in.
emptyContents(out);
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// 4. Build the dossier, write it, then rebuild it fresh and compare.
const caps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
};
const dossier = buildDossier(out, caps);
writeFileSync(join(out, 'dossier.json'), dossier);
const fresh = buildDossier(out, caps);
// buildDossier returns bytes, not a string: compare the bytes, not the
// object references (two Uint8Arrays are never === even when identical).
if (!Buffer.from(fresh).equals(Buffer.from(dossier))) fail('dossier.json does not match a fresh buildDossier run');

// 5. Byte-compare what landed in /output against the sources, so a
// half-copied app or a truncated screenshot cannot slip through.
function sha(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}
function compareTrees(srcDir, dstDir) {
  for (const name of readdirSync(srcDir)) {
    const src = join(srcDir, name), dst = join(dstDir, name);
    if (statSync(src).isDirectory()) compareTrees(src, dst);
    else if (!existsSync(dst) || sha(src) !== sha(dst)) fail(`${dst} does not match its source`);
  }
}
compareTrees(join(here, 'app'), join(out, 'app'));
compareTrees(shotsDir, join(out, 'screenshots'));

const appFiles = readdirSync(join(out, 'app'), { recursive: true }).length;
console.log(`main.ts: handed in ${shotNames.length} screenshots (${shotNames.join(', ')})`);
console.log(`main.ts: app/ has ${appFiles} entries; dossier.json is ${dossier.length} bytes, byte-stable`);
console.log(`main.ts: done -> ${out}`);

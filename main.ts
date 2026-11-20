// Vice Panel Studio — entry program for gta6-cover-art-01.
//
// Copies app/ and screenshots/ into MAKEFUN_OUTPUT_DIR and writes
// /output/dossier.json with the kit's buildDossier, then verifies the
// dossier round-trips byte-identical. Run with `node main.ts` (Node 22).
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const REPO = dirname(fileURLToPath(import.meta.url));

const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function sha256(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// Empty a directory's children without removing the directory itself: the
// grader hands /output over as a mount point, and rmSync on the directory
// itself throws EBUSY there. Children are removed one by one instead.
function emptyContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
  // A failed clear must never mix stale files with the new entry: confirm
  // the directory is empty before anything is copied into it.
  const left = readdirSync(dir);
  if (left.length > 0) {
    throw new Error(`output directory did not empty: still holds ${left.join(', ')}`);
  }
}

function copyTree(src: string, dst: string): number {
  let count = 0;
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src)) {
    const from = join(src, name);
    const to = join(dst, name);
    if (statSync(from).isDirectory()) count += copyTree(from, to);
    else {
      cpSync(from, to);
      count++;
    }
  }
  return count;
}

// A copied screenshot must be a JPEG or PNG within the gate's byte cap:
// a truncated copy must fail here, not surface later as a dossier error.
function verifyScreenshots(dir: string): void {
  const JPEG = [0xff, 0xd8, 0xff];
  const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  const names = readdirSync(dir).filter((n) => !n.startsWith('.')).sort();
  if (names.length === 0) throw new Error('screenshots/: no images copied');
  for (const name of names) {
    const bytes = readFileSync(join(dir, name));
    const isJpeg = JPEG.every((b, i) => bytes[i] === b);
    const isPng = PNG.every((b, i) => bytes[i] === b);
    if (!isJpeg && !isPng) throw new Error(`screenshots/${name}: not a JPEG or PNG`);
    if (bytes.length > 262144) throw new Error(`screenshots/${name}: ${bytes.length} bytes, over the 262144 allowed`);
  }
}

function main(): void {
  const out = process.env.MAKEFUN_OUTPUT_DIR;
  if (!out) throw new Error('MAKEFUN_OUTPUT_DIR is not set');
  const appDir = join(REPO, 'app');
  const shotsDir = join(REPO, 'screenshots');
  if (!existsSync(appDir)) throw new Error('app/: no such directory');
  if (!existsSync(shotsDir)) throw new Error('screenshots/: no such directory');
  emptyContents(out);
  const appFiles = copyTree(appDir, join(out, 'app'));
  const shotFiles = copyTree(shotsDir, join(out, 'screenshots'));
  verifyScreenshots(join(out, 'screenshots'));
  const dossier = buildDossier(out, DOSSIER_CAPS);
  writeFileSync(join(out, 'dossier.json'), dossier);
  // Verify the dossier round-trips: rebuild from what we just wrote and
  // require byte-identical output, so a stale or partial dossier can never
  // be handed in silently.
  const again = buildDossier(out, DOSSIER_CAPS);
  if (!Buffer.from(again).equals(Buffer.from(dossier))) {
    throw new Error('dossier.json does not round-trip byte-identical');
  }
  const readBack = readFileSync(join(out, 'dossier.json'));
  console.log(`app files copied: ${appFiles}`);
  console.log(`screenshots copied: ${shotFiles}`);
  console.log(`dossier.json: ${readBack.length} bytes sha256 ${sha256(readBack)}`);
  console.log('OK');
}

main();

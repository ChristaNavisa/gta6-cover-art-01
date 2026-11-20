// Vice Panel Studio — entrypoint (gta6-cover-art-01).
//
// Hands the app in: copies app/ and screenshots/ from this repository into
// the output directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-app.ts (the kit's copy, unchanged). Outside the grader,
// MAKEFUN_OUTPUT_DIR stands in for /output.
//
// Mount-safe: the output directory itself is never removed — only its
// children are cleared (the grader may hand us a mount point, and rmSync on
// it throws EBUSY). After writing the dossier it rebuilds it in memory and
// refuses to finish when the two disagree, so a run that exits 0 always
// leaves a dossier byte-identical to what the scorer rebuilds.

import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
} as const;

const sha256 = (bytes: Uint8Array): string => createHash('sha256').update(bytes).digest('hex');

/** A screenshot's pixel size from its PNG or JPEG header (no decoder needed). */
function imageDimensions(bytes: Uint8Array): { w: number; h: number } {
  // PNG: width/height are big-endian uint32 at offsets 16 and 20.
  if (bytes.length >= 24 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return { w: view.getUint32(16), h: view.getUint32(20) };
  }
  // JPEG: walk the markers to the first SOF0/SOF2 frame header.
  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) { i++; continue; }
      const marker = bytes[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = (bytes[i + 2] << 8) | bytes[i + 3];
      if (marker === 0xc0 || marker === 0xc2) {
        const h = (bytes[i + 5] << 8) | bytes[i + 6];
        const w = (bytes[i + 7] << 8) | bytes[i + 8];
        return { w, h };
      }
      i += 2 + len;
    }
  }
  throw new Error('main.ts: a screenshot is neither PNG nor JPEG');
}

/** Refuse a screenshot the gate would refuse, with the reason in the open. */
function validateScreenshots(shotsDir: string): void {
  const files = readdirSync(shotsDir).filter((f) => !f.startsWith('.')).sort();
  if (files.length < 3 || files.length > 4) {
    throw new Error(`main.ts: screenshots/ holds ${files.length} images, the gate wants 3 or 4`);
  }
  for (const file of files) {
    const path = join(shotsDir, file);
    const bytes = readFileSync(path);
    if (bytes.length > 262144) {
      throw new Error(`main.ts: screenshots/${file} is ${bytes.length} bytes, over the 256 KiB gate cap`);
    }
    const { w, h } = imageDimensions(bytes);
    const long = Math.max(w, h);
    const short = Math.min(w, h);
    if (long > 1280 || short < 480) {
      throw new Error(`main.ts: screenshots/${file} is ${w}x${h}, the gate wants long side at most 1280 and short side at least 480`);
    }
  }
}

/** Clear a directory's children only — never the directory itself. */
function emptyContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

/** Copy a directory tree of plain files (directories recursed, files copied). */
function copyTree(src: string, dst: string): { files: number; bytes: number } {
  mkdirSync(dst, { recursive: true });
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dst, entry.name);
    if (entry.isDirectory()) {
      const sub = copyTree(from, to);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      copyFileSync(from, to);
      files++;
      bytes += statSync(from).size;
    } else {
      throw new Error(`main.ts: ${from} is not a plain file or directory`);
    }
  }
  return { files, bytes };
}

function main(): void {
  const repoRoot = dirname(fileURLToPath(import.meta.url));
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? process.argv[2];
  if (!outDir || outDir.trim() === '') {
    throw new Error('main.ts: set MAKEFUN_OUTPUT_DIR (or pass the output directory as the first argument)');
  }
  const appDir = join(repoRoot, 'app');
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(join(appDir, 'index.html'))) {
    throw new Error('main.ts: app/index.html is missing');
  }
  if (!existsSync(shotsDir)) {
    throw new Error('main.ts: screenshots/ is missing');
  }
  validateScreenshots(shotsDir);

  emptyContents(outDir);
  const appCopied = copyTree(appDir, join(outDir, 'app'));
  const shotsCopied = copyTree(shotsDir, join(outDir, 'screenshots'));

  const dossier = buildDossier(outDir, CAPS);
  const dossierPath = join(outDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);

  // Verify: the dossier must be exactly what the scorer rebuilds from the
  // same directory, or this run has not handed in a valid entry.
  const rebuilt = buildDossier(outDir, CAPS);
  if (!Buffer.from(dossier).equals(Buffer.from(rebuilt))) {
    throw new Error('main.ts: dossier.json is not byte-identical to a fresh buildDossier run');
  }

  console.log(`copied app/: ${appCopied.files} files (${appCopied.bytes} bytes)`);
  console.log(`copied screenshots/: ${shotsCopied.files} files (${shotsCopied.bytes} bytes)`);
  console.log(`wrote dossier.json (${dossier.length} bytes, sha256 ${sha256(dossier)})`);
  console.log('verify: dossier rebuild matches');
}

main();

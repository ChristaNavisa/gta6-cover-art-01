// Vice Panel Studio — entrypoint: hands app/ and screenshots/ to the output
// directory and writes dossier.json with buildDossier from vendor/makefun-app.ts.
// Runs on Node 22, standard library only. MAKEFUN_OUTPUT_DIR stands in for
// /output outside the grader.
import { buildDossier } from './vendor/makefun-app.ts';
import {
  cpSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : '/output';

// Clears only the contents of a directory, never the directory itself.
// rmSync on the output directory itself throws EBUSY when the grader hands it
// in as a mount point, so the directory is emptied child by child instead.
function emptyContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

// Copies a directory tree of plain files, counting the files it copies.
function copyTree(src: string, dst: string): number {
  let files = 0;
  mkdirSync(dst, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const from = join(src, entry.name);
    const to = join(dst, entry.name);
    if (entry.isDirectory()) files += copyTree(from, to);
    else if (entry.isFile()) {
      cpSync(from, to);
      files += 1;
    }
  }
  return files;
}

emptyContents(OUTPUT_DIR);
const appFiles = copyTree(join(REPO_ROOT, 'app'), join(OUTPUT_DIR, 'app'));
const shotFiles = copyTree(
  join(REPO_ROOT, 'screenshots'),
  join(OUTPUT_DIR, 'screenshots'),
);
const dossier = buildDossier(OUTPUT_DIR, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000,
});
writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);

// Round-trip check: the bytes on disk must be exactly the bytes buildDossier
// returned, so the grader's rebuild matches this run byte for byte.
const written = readFileSync(join(OUTPUT_DIR, 'dossier.json'));
if (!written.equals(Buffer.from(dossier))) {
  throw new Error('dossier verification failed: bytes on disk differ from the built dossier');
}

// Post-build verification: read the dossier back and check it before reporting.
const dossierText = new TextDecoder('utf-8').decode(written);
if (!dossierText.includes('makefun/dossier/v1')) {
  throw new Error('dossier verification failed: schema makefun/dossier/v1 not found');
}
if (written.length > 1572864) {
  throw new Error(`dossier verification failed: ${written.length} bytes over the 1.5 MiB cap`);
}
const shotCount = readdirSync(join(OUTPUT_DIR, 'screenshots')).filter(
  (n) => !n.startsWith('.'),
).length;
if (shotCount < 3 || shotCount > 4) {
  throw new Error(`dossier verification failed: ${shotCount} screenshots, need 3 or 4`);
}
console.log(
  `verified: dossier ${written.length} bytes, schema makefun/dossier/v1, ${shotCount} screenshots, ${appFiles} app files`,
);
console.log(
  `dossier OK: ${shotFiles} screenshots, ${appFiles} app files, ${dossier.length} bytes -> ${OUTPUT_DIR}/dossier.json`,
);

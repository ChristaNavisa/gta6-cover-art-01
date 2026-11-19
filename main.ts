// Vice Panel Studio's hand-in program (gta6-cover-art-01).
// Copies app/ and screenshots/ from this repository into the output
// directory and writes output/dossier.json with buildDossier from
// vendor/makefun-app.ts. Outside the grader, MAKEFUN_OUTPUT_DIR stands in
// for /output; inside it the program writes to /output itself.
//
// The output directory is NEVER removed. The grader hands it in as a
// mounted volume, and removing a mount point fails with EBUSY -- that is
// what killed round 1. Only the directory's CONTENTS are cleared, child by
// child, and the directory itself is created if it does not exist yet.

import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Clear a directory's contents without ever removing the directory itself:
// readdir + rmSync per child works on a bind-mounted volume, where
// rmSync(dir, { recursive: true }) on the mount point throws EBUSY.
function emptyContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir).sort()) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

// Copy a whole tree, files and subdirectories, in sorted order so both of
// the grader's runs write the same bytes in the same order.
function copyTree(src: string, dst: string): void {
  mkdirSync(dst, { recursive: true });
  for (const name of readdirSync(src).sort()) {
    const from = join(src, name);
    const to = join(dst, name);
    if (statSync(from).isDirectory()) copyTree(from, to);
    else copyFileSync(from, to);
  }
}

emptyContents(outputDir);
copyTree(join(repoRoot, 'app'), join(outputDir, 'app'));
copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// gta6-cover-art-01 entrypoint (Node 22, standard library only).
//
// The entry hands the app in: it copies app/ and screenshots/ from the
// repository into /output and writes /output/dossier.json with buildDossier
// from vendor/makefun-app.ts, as the kit's starter does. Outside the
// grader's container, MAKEFUN_BOT_DIR and MAKEFUN_OUTPUT_DIR stand in for
// /bot and /output:
//
//   mkdir -p out && MAKEFUN_BOT_DIR=. MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The output directory is a bind-mounted volume in the grader, so this file
// NEVER removes the output directory itself: rmSync on a mount point throws
// EBUSY and the run fails. It clears only the directory's CONTENTS, then
// copies the entry in, in sorted order, so two runs write identical bytes.

import { buildDossier } from './vendor/makefun-app.ts';
import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

const botDir = process.env.MAKEFUN_BOT_DIR ?? '/bot';
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

/** Remove every child of `dir`, never `dir` itself (it may be a mount point). */
function emptyContents(dir: string): void {
  mkdirSync(dir, { recursive: true });
  for (const name of readdirSync(dir)) {
    rmSync(join(dir, name), { recursive: true, force: true });
  }
}

/** Copy a directory tree, children in sorted order, directories included. */
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
copyTree(join(botDir, 'app'), join(outputDir, 'app'));
copyTree(join(botDir, 'screenshots'), join(outputDir, 'screenshots'));
const dossierPath = join(outputDir, 'dossier.json');
writeFileSync(
  dossierPath,
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);

// Verify what was written before reporting success: the dossier must be
// the schema buildDossier writes and fit the gate's 1.5 MiB cap, and the
// screenshots must all be present. A run that hands in a broken dossier
// fails loudly here instead of at grading.
const dossier = JSON.parse(readFileSync(dossierPath, 'utf8'));
if (dossier.schema !== 'makefun/dossier/v1') {
  throw new Error(`dossier.json: unexpected schema ${String(dossier.schema)}`);
}
const dossierBytes = statSync(dossierPath).size;
if (dossierBytes > 1572864) {
  throw new Error(`dossier.json: ${dossierBytes} bytes, over the 1.5 MiB cap`);
}
const shots = readdirSync(join(outputDir, 'screenshots')).sort();
if (shots.length < 3 || shots.length > 4) {
  throw new Error(`screenshots/: ${shots.length} images, need 3 or 4`);
}
console.log(
  `Vice Panel Studio: app/ + ${shots.length} screenshots -> ${outputDir} ` +
    `(dossier.json ${dossierBytes} bytes)`,
);

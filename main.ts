// Neon Coast Cover Studio — entry program for gta6-cover-art-01.
// Node 22, standard library only. It hands the app in: it copies this
// repository's app/ and screenshots/ into the output directory and writes
// /output/dossier.json with buildDossier from the kit's vendored library
// (vendor/makefun-app.ts, unchanged).
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildDossier } from "./vendor/makefun-app.ts";

// The repository root: the directory this file lives in.
const repoRoot = fileURLToPath(new URL(".", import.meta.url));
// The grader writes to /output; a local run uses MAKEFUN_OUTPUT_DIR instead.
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";

// Gate caps from the kit's reference/gate.json, so a local run refuses an
// entry the sealed scorer would refuse instead of handing in bad bytes.
const DOSSIER_TEXT_MAX_BYTES = 163840;
const SCREENSHOTS_MAX = 4;
const SCREENSHOT_MAX_BYTES = 262144;
const APP_MAX_FILES = 993;
const APP_MAX_BYTES = 50331648;
const APP_PATH_MAX_BYTES = 1000;

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function main() {
  // Start from a clean output directory so stale files never leak in.
  rmSync(outputDir, { recursive: true, force: true });
  mkdirSync(outputDir, { recursive: true });

  const appSource = join(repoRoot, "app");
  const shotsSource = join(repoRoot, "screenshots");
  copyTree(appSource, join(outputDir, "app"));
  if (existsSync(shotsSource)) {
    copyTree(shotsSource, join(outputDir, "screenshots"));
  } else {
    mkdirSync(join(outputDir, "screenshots"), { recursive: true });
  }

  const dossier = buildDossier(outputDir, {
    text_max_bytes: DOSSIER_TEXT_MAX_BYTES,
    screenshots: { max: SCREENSHOTS_MAX, max_bytes: SCREENSHOT_MAX_BYTES },
    app_max_files: APP_MAX_FILES,
    app_max_bytes: APP_MAX_BYTES,
    app_path_max_bytes: APP_PATH_MAX_BYTES,
  });
  writeFileSync(join(outputDir, "dossier.json"), dossier);
}

main();

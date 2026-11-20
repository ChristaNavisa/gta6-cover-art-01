# Vice Panel Studio — GTA 6-style cover art maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo and caption into GTA 6-style cover
art — the multi-panel poster look with bold lettering and a Vice City
sunset or neon grade — and exports it as a PNG to share. Photos never
leave the machine.

## What it does

- **4 layouts**: Vice Grid (5 panels), **Pop-Out Seven** (7 panels — the
  hero cut-out breaks out of its frame, white-edged and tilted), Full Bleed
  (one photo edge to edge), Tilted Snap (four tilted snapshots).
- **4 grades**: Neon Sunset, Vice Gold, Palm Teal, Retro Chrome — each a
  panel wash, a chrome title palette, neon subtitle and vignette.
- **Striped retro-chrome title**: the caption is lettered in Bungee with a
  chrome gradient and pale stripes clipped to the letters; the subtitle
  glows in Monoton neon.
- **Cast role tags**: name + role pills on the cover (LUCIA · DRIVER,
  JASON · GETAWAY…), editable, up to four.
- **Callouts + seal**: WANTED / VICE CITY chips above the title and a
  circular "VICE PANEL STUDIO · EST. 2026" seal stamp.
- **People-first photo flow**: one click fills every panel with the people
  sample photos, cropped to faces; per-panel drag to move, scroll to zoom,
  or upload your own photo per panel.
- **5-star heat meter** in a gold-rim pill, grain + vignette, undo/redo.
- **3 post sizes, one click each**: 1080 × 1080, 1080 × 1350, 1920 × 1080
  — or "Export all 3 sizes" at once.
- **Self-test**: open `?selftest=1` to run the built-in checks
  (`window.__coverStudio.selftest`); `?shot=cover&size=1920x1080` draws
  the cover full-frame for screenshots.

## Run it

```sh
node serve.ts            # serves app/ on http://127.0.0.1:8123/
```

Open http://127.0.0.1:8123/ in desktop Chrome. No network, no upload,
no build step — the app is static files under `app/`.

## How it is built

- `main.ts` — entrypoint: copies `app/` and `screenshots/` to the output
  directory and writes `dossier.json` with `buildDossier` from
  `vendor/makefun-app.ts`. It clears only the output directory's children
  (never the directory itself, so a mount point is safe) and refuses to
  finish unless a fresh rebuild of the dossier matches byte for byte.
- `app/src/state.js` — cover state + undo/redo history.
- `app/src/grades.js` — the four colour grades.
- `app/src/layouts.js` — the four panel layouts.
- `app/src/render.js` — the canvas cover renderer (panels, pop-out hero,
  chrome title, stars, tags, callouts, seal, grain, vignette).
- `app/src/app.js` — editor wiring, `?shot=cover`, `?selftest=1`,
  `window.__coverStudio`.
- Fonts are Bungee, Monoton and Racing Sans One under the SIL Open Font
  License (see `app/fonts/OFL.txt`). No Rockstar Games logo, artwork or
  font is used anywhere.

## License

MIT — see `LICENSE` (SPDX-License-Identifier: MIT).

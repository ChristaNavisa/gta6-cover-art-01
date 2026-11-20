# Vice Panel Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Panel Studio** turns any photo and a caption into GTA 6-style cover art:
a multi-panel poster with bold caption lettering and a Vice City sunset or
neon colour grade, exported as a PNG to share. It runs offline in a desktop
browser from its own static files — photos never leave the machine.

## What it does

- **3 layouts** — Vice Grid (5 panels, hero + 4), Sunset Strip (4 panels),
  Neon Trio (3 panels).
- **4 grades** — Vice Sunset, Neon Nights, Palm Noir, Bubblegum: gradient-map
  colour grades baked onto the photo in the canvas.
- **Any photo** — load your own photos, or fill every panel from one photo;
  drag to pan and use the zoom slider or mouse wheel to crop each panel.
- **Caption** — a big Anton title with a Pacifico script subtitle, and a
  5-star heat meter on a dark pill so it stays readable over bright photos.
- **Export** — one click to a PNG in 1080×1080, 1080×1350 or 1920×1080, or
  export all three sizes at once.
- **Polish** — seeded deterministic grain, a vignette, undo/redo (Ctrl+Z /
  Ctrl+Shift+Z), and a live preview.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

Load a photo (or use the two sample photos), pick a layout and a grade,
type a title, then export. `?shot=cover` draws the cover full-frame for a
screenshot; `?selftest=1` exports all three sizes and reports SELFTEST OK.

## Files

- `app/index.html`, `app/style.css` — the editor page.
- `app/src/state.js` — the cover state and undo/redo history.
- `app/src/layouts.js` — the three panel layouts.
- `app/src/grades.js` — the four colour grades.
- `app/src/render.js` — the canvas cover renderer.
- `app/src/app.js` — UI wiring, photo loading, export, selftest.
- `main.ts` — hands `app/` and `screenshots/` to the output directory and
  writes `dossier.json`.
- `screenshots/` — the cover and the editor at work.
- `app/fonts/` — Anton, Bebas Neue and Pacifico under the SIL Open Font
  License (`app/fonts/OFL.txt`).

Built for the [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)
bounty on [make.fun](https://make.fun). No Rockstar Games logo, artwork or
font is used anywhere in this app.

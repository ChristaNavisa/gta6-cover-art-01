# Vice Panel Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

An offline web app that turns any photo and a caption into GTA 6-style cover art: the multi-panel poster look with bold caption lettering and a Vice City sunset or neon colour grade, exported as a PNG to share. It runs entirely in the browser from its own static files — photos never leave the machine.

## What it does

- **3 layouts** — Vice Grid (5 panels, hero + four), Sunset Strip (4 panels), Neon Trio (3 panels, hero + two).
- **4 colour grades** — Vice Sunset, Neon Nights, Palm Noir, Bubblegum: a gradient wash and tint over every panel.
- **Any photo, per panel** — load your own photo into any panel, drag to pan it, scroll or slide to zoom; or fill all panels with one photo. Two sample photos ship with the app.
- **Caption editing** — a bold Anton title, a Pacifico subtitle, and a 5-star heat meter.
- **3 post sizes** — export a PNG at 1080 × 1080, 1080 × 1350 or 1920 × 1080, one size at a time or all three at once.
- **Polish** — film grain and a vignette on every export, undo/redo (Ctrl+Z / Ctrl+Shift+Z), a live preview that is the cover itself.

## Try it

```sh
node serve.ts
# open http://localhost:8080/
```

No build step, no network requests: `app/index.html` opens in desktop Chrome from any static server.

## How it is built

- `main.ts` — the entrypoint: copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with `buildDossier`. It never removes the output directory itself (the grader mounts it), only its contents.
- `app/index.html` + `app/style.css` — the editor page and theme.
- `app/src/layouts.js` — the three panel layouts (panel rects per cover size).
- `app/src/grades.js` — the four colour grades.
- `app/src/state.js` — cover state and the undo/redo history.
- `app/src/render.js` — the canvas renderer: cover-fit photos, grade wash, title block, stars, grain, vignette, PNG export.
- `app/src/app.js` — editor wiring: pointer pan/zoom, file loading, controls, `?shot=cover` and `?selftest=1` modes, `window.__coverStudio`.
- `app/fonts/` — Anton, Bebas Neue and Pacifico under the SIL Open Font License (`OFL.txt`).
- `app/samples/` — two sample photos made with an image model, free to use.

Everything is original: no Rockstar Games logo, artwork or font.

## License

MIT — see `LICENSE`.

# Vice Panel Studio — GTA-style cover maker

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Panel Studio turns any photo into GTA-style cover art, in the browser, offline. Load one photo or several, crop and position each panel, pick a layout and a colour grade, letter the caption, and export a PNG to share.

## What it does

- **5-panel, 4-panel and 3-panel covers** — Vice Grid (hero + 2×2), Sunset Strip (hero + film strip), Neon Trio (three tall frames).
- **4 colour grades** — Vice Sunset, Neon Nights, Palm Noir, Bubblegum, each a hand-tuned canvas wash.
- **3 post sizes, one step** — Square 1080×1080, Portrait 1080×1350, Landscape 1920×1080, exported as PNG, one at a time or all three at once.
- **Any photo** — load your own per panel, fill all panels with one photo, drag to pan, scroll or slide to zoom. Two bundled sample photos get you started.
- **Lettering** — bold Anton title with a Pacifico script subtitle, a five-star heat meter, film grain and a vignette, all baked into the export.
- **Undo / redo** — every layout, grade, caption and photo change can be stepped back (Ctrl+Z / Ctrl+Shift+Z).
- **Offline** — static files under `app/`, no build step, no network request. Photos never leave your machine. Fonts are the bundled SIL Open Font License faces. No Rockstar artwork, logos or fonts.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` into the output directory and writes `dossier.json` with the kit's `buildDossier`. It clears only the output directory's contents, never the directory itself, so it runs clean on a bind-mounted output volume too.

## License

MIT. See LICENSE.

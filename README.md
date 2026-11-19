[![Make.fun bounty](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Rank](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![Reward](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Neon Coast Cover Studio

A free offline web app that turns any photo and caption into GTA-style cover art — the multi-panel poster look with bold caption lettering and a Vice City sunset or neon colour grade — exported as a PNG to share. Built for the [Make GTA 6 Cover Art bounty on make.fun](https://make.fun/bounty/gta6-cover-art-01).

## What it does

- **Any photo:** load photos from your machine (never uploaded), or try the two built-in samples. Crop and position each photo by dragging it inside its panel and scrolling to zoom.
- **Multi-panel layouts:** Hero + Three, Full Bleed, Grid 4, Grid 6, Grid 9, Split Duo, and Tilted Snapshots (polaroid-style). One photo can fill every panel, or each panel can hold its own.
- **Colour grades:** six gradient-map grades — Vice Sunset, Neon Nights, Golden Hour, Miami Pink, Teal Noir, Mono Pop — plus an optional poster-ink mode that bands panels into flat poster tones.
- **Lettering:** Anton title (white, sunset-gradient, neon-glow, or halftone-block styles), Pacifico script subtitle with a neon glow, badge ribbon, and a 5-star heat meter.
- **Finish:** film grain, vignette, poster frame, halftone dots.
- **Fast and easy:** pick a photo, pick a layout, export. One click exports a PNG in 1080 × 1080, 1080 × 1350, 1920 × 1080, or 1080 × 1920 (Story) — or all four at once.
- **Undo / redo** for every edit, including panel drags.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

No build step, no network: `app/index.html` opens in desktop Chrome and works fully offline. Every script, font and sample image is a file under `app/`. Fonts are Anton, Pacifico and Bebas Neue under the SIL Open Font License (see `app/fonts/OFL.txt`). All art is original — no game logos, artwork or fonts.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node <kit>/cli/makefun.mjs check --kit <kit> --repo .
```

`main.ts` (Node 22, standard library only) copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with `buildDossier` from `vendor/makefun-app.ts`.

## License

MIT — see [LICENSE](LICENSE).

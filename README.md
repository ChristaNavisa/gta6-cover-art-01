[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Panel Studio — GTA 6 Cover Art

An offline browser app that turns a photo and a caption into GTA 6-style
cover art: the multi-panel poster look with a Vice City neon-sunset grade,
exported as a PNG to share. Built for the
[Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01) bounty on
[make.fun](https://make.fun).

## What it does

- **5-panel covers** — a hero panel plus four supporting panels (Vice Grid),
  or 3-panel Sunset Strip and Neon Trio layouts.
- **4 grades** — Vice Sunset, Neon Nights, Bubblegum, and Mono Gold, each a
  gradient-map wash over the photos with grain and vignette.
- **3 post sizes** — 1080 × 1080, 1080 × 1350, and 1920 × 1080, exported as
  PNG in one click.
- **Per-panel photo, drag, and zoom** — every panel takes either sample photo
  or a photo you upload, and you drag to pan and slide to zoom each one.
- **Bold caption lettering** — Archivo Black capitals with a gold-rimmed
  5-star heat meter, plus a Righteous accent line.
- **Undo / redo** — every edit is a step you can walk back.
- **Offline** — no network requests; fonts and photos are vendored in `app/`.

## Use it

Open `app/index.html` in a browser (or run `node serve.ts` and open
http://localhost:8080). Pick a layout, a grade, and a size, type a caption,
drag the panels into place, and hit **Export PNG**.

`?shot=cover` renders the cover full-bleed (used for the screenshots);
`?selftest=1` runs the built-in self test and prints `SELFTEST OK`.

## Fonts

- Archivo Black — Copyright 2017 The Archivo Black Project Authors
- Alfa Slab One — Copyright 2016 The Alfa Slab One Project Authors
- Righteous — Copyright (c) 2011 by Brian J. Bonislawsky DBA Astigmatic

All three are licensed under the SIL Open Font License 1.1; see
`app/fonts/OFL.txt`. The sample photos are original illustrations made for
this app.

## License

MIT — see [LICENSE](LICENSE).

# Vice Heat — Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/ChristaNavisa/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

**Vice Heat** turns your photos into a framed crime-epic key art poster — the
way the winning covers do it: a person in every panel, a giant banded title,
a script subtitle, and the full furniture of a real poster.

## What it does

- **8 original cast members, each with a photoreal portrait** made for this
  app: Valeria Reyes (The Driver), Marcus Dale (The Fixer), Carmen Voss
  (The Mechanic), Eddie Solano (The Captain), Ty Banks (The Rider),
  Isabella Cruz (The Boss), Danny Okafor (The Lookout), Sofia Marlowe
  (The Getaway). No Rockstar artwork, logos or fonts are used anywhere.
- **9 layouts**: Pop-Out Hero, Hero Stack, Four Square, Nine Lives 3×3,
  Tilted Snaps, Full Bleed, Split Duo, Triptych, Spotlight.
- **9 grades**: Sunset, Vice Neon, Golden Hour, Teal & Orange, Bubblegum,
  Noir B&W, Smog, Heatwave, Palm Shade — every one a real canvas filter
  plus a tint and a banded title gradient.
- **Full cover furniture**: gold roundel seal, 18+ Leonida rating box,
  billing block that names only the cast actually on the cover, PS5 /
  Xbox / PC pills, barcode, 5-star heat meter, press quote and tagline.
- **A working editor**: click a panel to select it, drag to pan the photo,
  scroll to zoom, click a face in the cast strip to swap them in, fill-all
  and shuffle, undo/redo (Ctrl+Z / Ctrl+Y) that covers the caption and the
  furniture toggles too.
- **Your own photos**: upload any picture and it becomes a cast member —
  local only, nothing is sent anywhere.
- **3 post sizes**: 1080×1080, 1080×1350 and 1920×1080 PNG export.
- **Self-test**: open `?selftest=1` and the app checks its cast, layouts,
  grades, fonts, photos and PNG export, and prints the result on the page.

## Run it

```sh
node serve.ts        # then open http://localhost:8080
```

Hand it in (the program copies `app/` and `screenshots/` to `/output`
and writes `dossier.json`):

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots are taken from `shots.json`: the first by name is the cover.

## License

MIT — see [LICENSE](LICENSE). Fonts Anton and Pacifico are under the
SIL Open Font License 1.1 — see [app/fonts/OFL.txt](app/fonts/OFL.txt).

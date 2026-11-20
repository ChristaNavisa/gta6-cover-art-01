// Vice Panel Studio — panel layouts.
//
// A layout is where the panels sit on the poster (rects are fractions of the
// cover, 0..1), which panel is the hero, and whether the hero pops out of
// its frame. The caption band always sits at the bottom, over the panels.

export const LAYOUTS = [
  {
    id: 'vice-grid',
    name: 'Vice Grid',
    blurb: 'Five panels — one big hero, four around it.',
    panels: 5,
    hero: 0,
    popout: false,
    rects: [
      { x: 0.0, y: 0.0, w: 0.6, h: 0.62 },
      { x: 0.6, y: 0.0, w: 0.4, h: 0.31 },
      { x: 0.6, y: 0.31, w: 0.4, h: 0.31 },
      { x: 0.0, y: 0.62, w: 0.3, h: 0.18 },
      { x: 0.3, y: 0.62, w: 0.7, h: 0.18 },
    ],
    caption: { x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: 'popout-seven',
    name: 'Pop-Out Seven',
    blurb: 'Seven panels — the hero cut-out breaks out of its frame.',
    panels: 7,
    hero: 0,
    popout: true,
    rects: [
      { x: 0.28, y: 0.02, w: 0.44, h: 0.5 },
      { x: 0.0, y: 0.02, w: 0.28, h: 0.25 },
      { x: 0.72, y: 0.02, w: 0.28, h: 0.25 },
      { x: 0.0, y: 0.27, w: 0.28, h: 0.25 },
      { x: 0.72, y: 0.27, w: 0.28, h: 0.25 },
      { x: 0.0, y: 0.52, w: 0.5, h: 0.28 },
      { x: 0.5, y: 0.52, w: 0.5, h: 0.28 },
    ],
    caption: { x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: 'full-bleed',
    name: 'Full Bleed',
    blurb: 'One photo, edge to edge, caption over the dusk.',
    panels: 1,
    hero: 0,
    popout: false,
    rects: [{ x: 0.0, y: 0.0, w: 1.0, h: 0.8 }],
    caption: { x: 0, y: 0.8, w: 1, h: 0.2 },
  },
  {
    id: 'tilted-snap',
    name: 'Tilted Snap',
    blurb: 'Four snapshots, tilted like prints on a table.',
    panels: 4,
    hero: 0,
    popout: false,
    rects: [
      { x: 0.06, y: 0.03, w: 0.52, h: 0.52, rot: -2 },
      { x: 0.6, y: 0.05, w: 0.36, h: 0.3, rot: 2.5 },
      { x: 0.62, y: 0.37, w: 0.34, h: 0.3, rot: -2.5 },
      { x: 0.08, y: 0.57, w: 0.84, h: 0.23, rot: 1 },
    ],
    caption: { x: 0, y: 0.8, w: 1, h: 0.2 },
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

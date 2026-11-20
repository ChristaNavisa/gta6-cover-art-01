// Vice Heat — the nine cover layouts. Every rect is in 0..1 cover space:
// x/y is the top-left corner, w/h the size. tilt is a panel rotation in
// degrees (Tilted Snaps only). title is where the giant title block sits.

export const LAYOUTS = [
  {
    id: 'popout',
    name: 'Pop-Out Hero',
    blurb: 'One hero face, huge, with the cast stacked on both sides.',
    panels: [
      { x: 0.015, y: 0.045, w: 0.27, h: 0.20 },
      { x: 0.015, y: 0.26, w: 0.27, h: 0.20 },
      { x: 0.015, y: 0.475, w: 0.27, h: 0.20 },
      { x: 0.305, y: 0.045, w: 0.39, h: 0.63 },
      { x: 0.715, y: 0.045, w: 0.27, h: 0.20 },
      { x: 0.715, y: 0.26, w: 0.27, h: 0.20 },
      { x: 0.715, y: 0.475, w: 0.27, h: 0.20 },
    ],
    hero: 3,
    title: { x: 0.02, y: 0.70, w: 0.96, h: 0.17, align: 'center' },
  },
  {
    id: 'herostack',
    name: 'Hero Stack',
    blurb: 'Hero on the left, two stacked panels right, a strip below.',
    panels: [
      { x: 0.015, y: 0.045, w: 0.56, h: 0.60 },
      { x: 0.59, y: 0.045, w: 0.395, h: 0.29 },
      { x: 0.59, y: 0.355, w: 0.395, h: 0.29 },
      { x: 0.015, y: 0.665, w: 0.315, h: 0.20 },
      { x: 0.345, y: 0.665, w: 0.315, h: 0.20 },
      { x: 0.675, y: 0.665, w: 0.31, h: 0.20 },
    ],
    hero: 0,
    title: { x: 0.02, y: 0.70, w: 0.96, h: 0.17, align: 'center' },
  },
  {
    id: 'foursquare',
    name: 'Four Square',
    blurb: 'Four even panels, title band across the middle.',
    panels: [
      { x: 0.015, y: 0.045, w: 0.48, h: 0.40 },
      { x: 0.505, y: 0.045, w: 0.48, h: 0.40 },
      { x: 0.015, y: 0.465, w: 0.48, h: 0.40 },
      { x: 0.505, y: 0.465, w: 0.48, h: 0.40 },
    ],
    hero: -1,
    title: { x: 0.02, y: 0.42, w: 0.96, h: 0.13, align: 'center' },
  },
  {
    id: 'ninelives',
    name: 'Nine Lives 3×3',
    blurb: 'The whole cast in a 3×3 grid, title in the centre cell.',
    panels: [
      { x: 0.015, y: 0.045, w: 0.315, h: 0.27 },
      { x: 0.342, y: 0.045, w: 0.315, h: 0.27 },
      { x: 0.67, y: 0.045, w: 0.315, h: 0.27 },
      { x: 0.015, y: 0.33, w: 0.315, h: 0.27 },
      { x: 0.67, y: 0.33, w: 0.315, h: 0.27 },
      { x: 0.015, y: 0.615, w: 0.315, h: 0.225 },
      { x: 0.342, y: 0.615, w: 0.315, h: 0.225 },
      { x: 0.67, y: 0.615, w: 0.315, h: 0.225 },
    ],
    hero: -1,
    title: { x: 0.342, y: 0.33, w: 0.315, h: 0.27, align: 'center', boxed: true },
  },
  {
    id: 'tilted',
    name: 'Tilted Snaps',
    blurb: 'Five overlapping snapshots, taped at an angle.',
    panels: [
      { x: 0.02, y: 0.06, w: 0.34, h: 0.46, tilt: -4 },
      { x: 0.33, y: 0.03, w: 0.34, h: 0.46, tilt: 3 },
      { x: 0.64, y: 0.06, w: 0.34, h: 0.46, tilt: -2 },
      { x: 0.10, y: 0.42, w: 0.36, h: 0.44, tilt: 4 },
      { x: 0.54, y: 0.42, w: 0.36, h: 0.44, tilt: -3 },
    ],
    hero: 1,
    title: { x: 0.02, y: 0.72, w: 0.96, h: 0.15, align: 'center' },
  },
  {
    id: 'fullbleed',
    name: 'Full Bleed',
    blurb: 'One photo edge to edge, title over the lower third.',
    panels: [{ x: 0.0, y: 0.0, w: 1.0, h: 1.0 }],
    hero: 0,
    title: { x: 0.02, y: 0.66, w: 0.96, h: 0.20, align: 'center' },
  },
  {
    id: 'splitduo',
    name: 'Split Duo',
    blurb: 'Two halves, one face each, title down the middle.',
    panels: [
      { x: 0.015, y: 0.045, w: 0.475, h: 0.82 },
      { x: 0.51, y: 0.045, w: 0.475, h: 0.82 },
    ],
    hero: -1,
    title: { x: 0.02, y: 0.40, w: 0.96, h: 0.16, align: 'center' },
  },
  {
    id: 'triptych',
    name: 'Triptych',
    blurb: 'Three tall panels, title riding the top.',
    panels: [
      { x: 0.015, y: 0.045, w: 0.315, h: 0.82 },
      { x: 0.342, y: 0.045, w: 0.315, h: 0.82 },
      { x: 0.67, y: 0.045, w: 0.315, h: 0.82 },
    ],
    hero: 1,
    title: { x: 0.02, y: 0.045, w: 0.96, h: 0.12, align: 'center' },
  },
  {
    id: 'spotlight',
    name: 'Spotlight',
    blurb: 'Hero on stage, two flanks below, title in between.',
    panels: [
      { x: 0.22, y: 0.045, w: 0.56, h: 0.50 },
      { x: 0.015, y: 0.565, w: 0.475, h: 0.30 },
      { x: 0.51, y: 0.565, w: 0.475, h: 0.30 },
    ],
    hero: 0,
    title: { x: 0.02, y: 0.70, w: 0.96, h: 0.17, align: 'center' },
  },
];

export const LAYOUT_BY_ID = Object.fromEntries(LAYOUTS.map((l) => [l.id, l]));

// The panel slot under a cover-space point (x, y in 0..1), or -1.
// Used to pick a panel by clicking the canvas.
export function panelAt(layout, px, py) {
  for (let i = layout.panels.length - 1; i >= 0; i--) {
    const r = layout.panels[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

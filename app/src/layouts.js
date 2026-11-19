// Panel layouts for Vice Panel Studio.
// A layout splits the cover into panels; each panel holds one photo, cropped
// and positioned by the maker. Rects are fractions of the cover (x, y, w, h),
// so the same layout works at every post size. Gutters are applied by the
// renderer, not baked into these numbers.

// 5 panels: one big hero on the left, four small frames in a 2x2 grid right.
const VICE_GRID = [
  { x: 0, y: 0, w: 0.62, h: 1 },
  { x: 0.62, y: 0, w: 0.19, h: 0.5 },
  { x: 0.81, y: 0, w: 0.19, h: 0.5 },
  { x: 0.62, y: 0.5, w: 0.19, h: 0.5 },
  { x: 0.81, y: 0.5, w: 0.19, h: 0.5 },
];

// 4 panels: a wide hero on top, three frames in a row along the bottom.
const SUNSET_STRIP = [
  { x: 0, y: 0, w: 1, h: 0.62 },
  { x: 0, y: 0.62, w: 1 / 3, h: 0.38 },
  { x: 1 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
  { x: 2 / 3, y: 0.62, w: 1 / 3, h: 0.38 },
];

// 3 panels: three tall vertical frames, side by side.
const NEON_TRIO = [
  { x: 0, y: 0, w: 1 / 3, h: 1 },
  { x: 1 / 3, y: 0, w: 1 / 3, h: 1 },
  { x: 2 / 3, y: 0, w: 1 / 3, h: 1 },
];

export const LAYOUTS = [
  {
    id: 'grid',
    name: 'Vice Grid',
    panels: 5,
    blurb: 'Hero left, four frames right. The classic five-panel poster.',
    rects: VICE_GRID,
  },
  {
    id: 'strip',
    name: 'Sunset Strip',
    panels: 4,
    blurb: 'Wide hero on top, a film strip of three below it.',
    rects: SUNSET_STRIP,
  },
  {
    id: 'trio',
    name: 'Neon Trio',
    panels: 3,
    blurb: 'Three tall frames, one story in three beats.',
    rects: NEON_TRIO,
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) ?? LAYOUTS[0];
}

// Panel rectangles in pixels for a cover of W by H. The rects the layout
// holds are fractions; this turns them into device pixels.
export function panelRects(layoutId, W, H) {
  const layout = layoutById(layoutId);
  return layout.rects.map((r) => ({
    x: r.x * W,
    y: r.y * H,
    w: r.w * W,
    h: r.h * H,
  }));
}

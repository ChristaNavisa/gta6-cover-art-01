// Panel layouts for Vice Panel Studio.
//
// Each layout names its panels as fractions of the cover (x, y, w, h in
// 0..1) plus a display name for the selected-panel label. The renderer
// insets every panel by the gutter so panels read as separate poster
// frames, the way GTA 6's multi-panel covers do.

export const GUTTER = 0.012;

export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid',
    panels: [
      { key: 'hero', name: 'Hero', x: 0, y: 0, w: 0.56, h: 1 },
      { key: 'p2', name: 'Panel 2', x: 0.56, y: 0, w: 0.22, h: 0.5 },
      { key: 'p3', name: 'Panel 3', x: 0.78, y: 0, w: 0.22, h: 0.5 },
      { key: 'p4', name: 'Panel 4', x: 0.56, y: 0.5, w: 0.22, h: 0.5 },
      { key: 'p5', name: 'Panel 5', x: 0.78, y: 0.5, w: 0.22, h: 0.5 },
    ],
  },
  'sunset-strip': {
    label: 'Sunset Strip',
    panels: [
      { key: 'p1', name: 'Panel 1', x: 0, y: 0, w: 0.5, h: 0.5 },
      { key: 'p2', name: 'Panel 2', x: 0.5, y: 0, w: 0.5, h: 0.5 },
      { key: 'p3', name: 'Panel 3', x: 0, y: 0.5, w: 0.5, h: 0.5 },
      { key: 'p4', name: 'Panel 4', x: 0.5, y: 0.5, w: 0.5, h: 0.5 },
    ],
  },
  'neon-trio': {
    label: 'Neon Trio',
    panels: [
      { key: 'hero', name: 'Hero', x: 0, y: 0, w: 1, h: 0.62 },
      { key: 'p2', name: 'Panel 2', x: 0, y: 0.62, w: 0.5, h: 0.38 },
      { key: 'p3', name: 'Panel 3', x: 0.5, y: 0.62, w: 0.5, h: 0.38 },
    ],
  },
};

/** The layout ids, in the order the editor shows them. */
export const LAYOUT_IDS = Object.keys(LAYOUTS);

/** Panel rects of a layout in pixels for a cover of W x H, gutter applied. */
export function panelRects(layoutId, W, H) {
  const layout = LAYOUTS[layoutId] ?? LAYOUTS['vice-grid'];
  const g = GUTTER * Math.min(W, H);
  return layout.panels.map((p) => ({
    key: p.key,
    name: p.name,
    x: p.x * W + g / 2,
    y: p.y * H + g / 2,
    w: p.w * W - g,
    h: p.h * H - g,
  }));
}

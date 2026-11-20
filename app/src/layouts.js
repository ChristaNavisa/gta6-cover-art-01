// Layouts for Vice Panel Studio: panel rectangles as fractions of the cover,
// plus the title band the caption sits in (fractions of the cover height).
// A layout's panels are used in order; state.panels holds five, and layouts
// with fewer panels simply use the first ones.
export const LAYOUTS = {
  'vice-grid': {
    label: 'Vice Grid · 5 panels',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.58 },
      { x: 0, y: 0.58, w: 0.25, h: 0.28 },
      { x: 0.25, y: 0.58, w: 0.25, h: 0.28 },
      { x: 0.5, y: 0.58, w: 0.25, h: 0.28 },
      { x: 0.75, y: 0.58, w: 0.25, h: 0.28 },
    ],
    title: { x: 0, y: 0.86, w: 1, h: 0.14 },
  },
  'sunset-strip': {
    label: 'Sunset Strip · 3 bands',
    panels: [
      { x: 0, y: 0, w: 1, h: 0.3 },
      { x: 0, y: 0.3, w: 1, h: 0.3 },
      { x: 0, y: 0.6, w: 1, h: 0.26 },
    ],
    title: { x: 0, y: 0.86, w: 1, h: 0.14 },
  },
  'neon-trio': {
    label: 'Neon Trio · 3 columns',
    panels: [
      { x: 0, y: 0, w: 1 / 3, h: 0.86 },
      { x: 1 / 3, y: 0, w: 1 / 3, h: 0.86 },
      { x: 2 / 3, y: 0, w: 1 / 3, h: 0.86 },
    ],
    title: { x: 0, y: 0.86, w: 1, h: 0.14 },
  },
};

export function layoutOf(id) {
  return LAYOUTS[id] ?? LAYOUTS['vice-grid'];
}

export function panelCount(id) {
  return layoutOf(id).panels.length;
}

// State for Vice Panel Studio: the cover's data plus undo/redo.
//
// A panel points at a photo by index into the loaded images and holds its
// crop: x/y are the crop centre (0..1, 0.5 is centred) and zoom the scale
// over the cover fit. The active panel is the one the editor drags.
export const LAYOUT_IDS = ['vice-grid', 'sunset-strip', 'neon-trio'];
export const GRADE_IDS = ['vice-sunset', 'neon-nights', 'bubblegum', 'mono-gold'];

export const SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'story', label: '1920 × 1080', w: 1920, h: 1080 },
];

export const PHOTOS = ['samples/boulevard.jpg', 'samples/pier.jpg'];

export function sizeOf(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

export function defaultState() {
  return {
    caption: 'NEON SHORE',
    subcaption: 'Vice City Nights',
    layout: 'vice-grid',
    grade: 'vice-sunset',
    size: 'square',
    stars: 5,
    grain: true,
    vignette: true,
    panels: [
      { photo: 0, x: 0.5, y: 0.45, zoom: 1.15 },
      { photo: 1, x: 0.5, y: 0.5, zoom: 1.1 },
      { photo: 0, x: 0.5, y: 0.55, zoom: 1.2 },
      { photo: 1, x: 0.5, y: 0.45, zoom: 1.05 },
      { photo: 0, x: 0.5, y: 0.5, zoom: 1.1 },
    ],
    activePanel: 0,
  };
}

export function snapshot(state) {
  return JSON.stringify(state);
}

export function restore(text) {
  const parsed = JSON.parse(text);
  if (!parsed || typeof parsed !== 'object') throw new Error('bad snapshot');
  return parsed;
}

/** A capped undo/redo stack of state snapshots. */
export class History {
  constructor(limit = 50) {
    this.past = [];
    this.future = [];
    this.limit = limit;
  }

  push(text) {
    this.past.push(text);
    if (this.past.length > this.limit) this.past.shift();
    this.future.length = 0;
  }

  undo(current) {
    if (this.past.length === 0) return null;
    this.future.push(current);
    return this.past.pop();
  }

  redo(current) {
    if (this.future.length === 0) return null;
    this.past.push(current);
    return this.future.pop();
  }

  canUndo() {
    return this.past.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }
}

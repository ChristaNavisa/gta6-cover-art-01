// Cover state and history for Vice Panel Studio.
//
// The state is plain JSON (photo keys, not Image objects), so it can be
// snapshotted for undo/redo and stored in localStorage. Panel transforms
// are per panel: `scale` zooms the photo inside its frame, `ox`/`oy` pan
// it as fractions of the panel.

import { LAYOUTS } from './layouts.js';

export const SIZES = ['1080x1080', '1080x1350', '1920x1080'];

export const SAMPLE_PHOTOS = {
  boulevard: 'samples/boulevard.jpg',
  pier: 'samples/pier.jpg',
};

/** The sample photos, dealt across the panels in order. */
function defaultPanels(layoutId) {
  const keys = Object.keys(SAMPLE_PHOTOS);
  return LAYOUTS[layoutId].panels.map((p, i) => ({
    key: p.key,
    photo: keys[i % keys.length],
    scale: 1,
    ox: 0,
    oy: 0,
  }));
}

/** A fresh cover state for a layout. */
export function freshState(layoutId = 'vice-grid') {
  return {
    layout: layoutId,
    grade: 'vice-sunset',
    size: '1080x1080',
    title: 'NEON SHORE',
    subtitle: 'golden hour in the city',
    stars: 3,
    selected: 0,
    panels: defaultPanels(layoutId),
  };
}

/** A deep copy of a state (JSON round-trip; state holds no functions). */
export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

/** Resize a state's panels to a new layout, keeping photos where they fit. */
export function reLayout(state, layoutId) {
  const next = cloneState(state);
  next.layout = layoutId;
  const old = next.panels;
  next.panels = LAYOUTS[layoutId].panels.map((p, i) => {
    const keep = old[i] ?? old[0];
    return { key: p.key, photo: keep.photo, scale: keep.scale, ox: 0, oy: 0 };
  });
  next.selected = 0;
  return next;
}

/** A bounded undo/redo history over JSON snapshots. */
export function createHistory(limit = 50) {
  const past = [];
  const future = [];
  return {
    push(state) {
      past.push(JSON.stringify(state));
      if (past.length > limit) past.shift();
      future.length = 0;
    },
    undo(state) {
      if (past.length === 0) return null;
      future.push(JSON.stringify(state));
      return JSON.parse(past.pop());
    },
    redo(state) {
      if (future.length === 0) return null;
      past.push(JSON.stringify(state));
      return JSON.parse(future.pop());
    },
    canUndo() {
      return past.length > 0;
    },
    canRedo() {
      return future.length > 0;
    },
  };
}

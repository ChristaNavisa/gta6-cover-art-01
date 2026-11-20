// Vice Panel Studio — the cover state and its undo/redo history.
// A cover is a layout, a grade, a caption, a heat-meter rating and one photo
// slot per panel, each with its own crop (zoom + pan offsets).
export const LAYOUTS = ['vice-grid', 'sunset-strip', 'neon-trio'];
export const GRADES = ['vice-sunset', 'neon-nights', 'palm-noir', 'bubblegum'];
export const PANEL_COUNT = { 'vice-grid': 5, 'sunset-strip': 4, 'neon-trio': 3 };
export const SAMPLE_PHOTOS = ['samples/boulevard.jpg', 'samples/pier.jpg'];

// One panel's photo: a source (a sample path or an object URL from a file
// the user loaded) plus the crop that positions it inside the panel.
export function blankPanel(photo) {
  return { photo: photo ?? null, scale: 1, ox: 0, oy: 0 };
}

export function blankState() {
  return {
    layout: 'vice-grid',
    grade: 'vice-sunset',
    title: 'NEON SHORE',
    subtitle: 'golden hour in the city',
    stars: 3,
    panels: [
      blankPanel('samples/boulevard.jpg'),
      blankPanel('samples/pier.jpg'),
      blankPanel('samples/boulevard.jpg'),
      blankPanel('samples/pier.jpg'),
      blankPanel('samples/boulevard.jpg'),
    ],
  };
}

// A deep copy of a state, for the history stack.
export function snapshot(state) {
  return JSON.parse(JSON.stringify(state));
}

// Undo/redo history: every committed change pushes the previous state.
export function createHistory(initial) {
  const past = [];
  const future = [];
  let current = snapshot(initial);
  return {
    get() {
      return current;
    },
    commit(next) {
      past.push(current);
      if (past.length > 60) past.shift();
      future.length = 0;
      current = snapshot(next);
    },
    undo() {
      if (past.length === 0) return false;
      future.push(current);
      current = past.pop();
      return true;
    },
    redo() {
      if (future.length === 0) return false;
      past.push(current);
      current = future.pop();
      return true;
    },
    canUndo() {
      return past.length > 0;
    },
    canRedo() {
      return future.length > 0;
    },
  };
}

// Resize the panel list when the layout changes, keeping the photos that fit.
export function panelsForLayout(state) {
  const count = PANEL_COUNT[state.layout];
  const panels = state.panels.slice(0, count);
  while (panels.length < count) {
    const photo = SAMPLE_PHOTOS[panels.length % SAMPLE_PHOTOS.length];
    panels.push(blankPanel(photo));
  }
  return panels;
}

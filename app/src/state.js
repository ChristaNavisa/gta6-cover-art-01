// Vice Panel Studio — cover state and history.
//
// One plain object describes a whole cover: its caption, its layout, its
// grade, its post size, its cast role tags, its callouts and seal, and one
// slot per panel (photo, zoom and focal point). Every edit goes through the
// History stack, so undo and redo always work.

/** The sample photos the app ships (people-first: both are people shots). */
export const PHOTOS = [
  { id: 'boulevard', src: 'samples/boulevard.jpg', label: 'Boulevard', people: true },
  { id: 'pier', src: 'samples/pier.jpg', label: 'Pier', people: true },
];

/** The post sizes a cover exports to. */
export const SIZES = [
  { id: '1080x1080', w: 1080, h: 1080, label: 'Square · 1080 × 1080' },
  { id: '1080x1350', w: 1080, h: 1350, label: 'Portrait · 1080 × 1350' },
  { id: '1920x1080', w: 1920, h: 1080, label: 'Wide · 1920 × 1080' },
];

export function sizeById(id) {
  return SIZES.find((s) => s.id === id) ?? SIZES[0];
}

export function photoById(id) {
  return PHOTOS.find((p) => p.id === id) ?? null;
}

/** The cover a first-time visitor sees: seven-panel pop-out, neon grade. */
export function defaultState() {
  return {
    title: 'NEON SHORE',
    subtitle: 'VICE CITY · EST. 2026',
    caption: 'A Vice City story, told in seven panels.',
    layout: 'popout-seven',
    grade: 'neon-sunset',
    size: '1080x1080',
    heat: 5,
    seal: true,
    peopleFirst: true,
    callouts: ['WANTED ★★★★★', 'VICE CITY'],
    cast: [
      { name: 'LUCIA', role: 'DRIVER' },
      { name: 'JASON', role: 'GETAWAY' },
      { name: 'VICE CITY', role: 'SETTING' },
    ],
    panels: [
      { photo: 'boulevard', zoom: 1.18, x: 0.5, y: 0.4 },
      { photo: 'pier', zoom: 1.12, x: 0.5, y: 0.48 },
      { photo: 'boulevard', zoom: 1.35, x: 0.62, y: 0.38 },
      { photo: 'pier', zoom: 1.25, x: 0.38, y: 0.45 },
      { photo: 'boulevard', zoom: 1.2, x: 0.5, y: 0.55 },
      { photo: 'pier', zoom: 1.3, x: 0.55, y: 0.42 },
      { photo: 'boulevard', zoom: 1.15, x: 0.45, y: 0.5 },
    ],
  };
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

/** Undo/redo over whole cover states. */
export class History {
  constructor(state) {
    this.past = [];
    this.future = [];
    this.current = cloneState(state);
  }
  push(state) {
    this.past.push(this.current);
    if (this.past.length > 60) this.past.shift();
    this.future = [];
    this.current = cloneState(state);
  }
  undo() {
    if (this.past.length === 0) return null;
    this.future.push(this.current);
    this.current = this.past.pop();
    return cloneState(this.current);
  }
  redo() {
    if (this.future.length === 0) return null;
    this.past.push(this.current);
    this.current = this.future.pop();
    return cloneState(this.current);
  }
  canUndo() {
    return this.past.length > 0;
  }
  canRedo() {
    return this.future.length > 0;
  }
}

// Vice Heat — cover state: the cast, the post sizes, the cover document
// and its undo/redo history. Everything the renderer draws comes from here,
// so a snapshot of this state is a snapshot of the whole cover.

// The cast: eight original Leonida characters, each with a photoreal
// portrait generated fresh for this app. No Rockstar character, no stock
// photo — every face below is one of the eight sample portraits shipped
// under app/samples/.
export const CAST = [
  { id: 'valeria', name: 'VALERIA REYES', role: 'THE DRIVER', file: 'samples/valeria-driver.jpg', note: 'Red convertible, palm boulevard, golden hour.' },
  { id: 'marcus', name: 'MARCUS DALE', role: 'THE FIXER', file: 'samples/marcus-fixer.jpg', note: 'Rooftop at dusk, city skyline behind him.' },
  { id: 'carmen', name: 'CARMEN VOSS', role: 'THE MECHANIC', file: 'samples/carmen-mechanic.jpg', note: 'Garage doorway, pink and orange neon.' },
  { id: 'eddie', name: 'EDDIE SOLANO', role: 'THE CAPTAIN', file: 'samples/eddie-captain.jpg', note: 'Wooden pier, turquoise water, sunrise.' },
  { id: 'ty', name: 'TY BANKS', role: 'THE RIDER', file: 'samples/ty-rider.jpg', note: 'Motorcycle, wet neon street at night.' },
  { id: 'isabella', name: 'ISABELLA CRUZ', role: 'THE BOSS', file: 'samples/isabella-boss.jpg', note: 'Downtown garage, warm neon reflections.' },
  { id: 'danny', name: 'DANNY OKAFOR', role: 'THE LOOKOUT', file: 'samples/danny-lookout.jpg', note: 'Rooftop binoculars over a sunset skyline.' },
  { id: 'sofia', name: 'SOFIA MARLOWE', role: 'THE GETAWAY', file: 'samples/sofia-getaway.jpg', note: 'Speedboat over turquoise water at sunset.' },
];

export const CAST_BY_ID = Object.fromEntries(CAST.map((c) => [c.id, c]));

// The three common post sizes the bounty asks for.
export const SIZES = [
  { id: 'square', label: '1080 × 1080', w: 1080, h: 1080 },
  { id: 'portrait', label: '1080 × 1350', w: 1080, h: 1350 },
  { id: 'wide', label: '1920 × 1080', w: 1920, h: 1080 },
];

export const SIZE_BY_ID = Object.fromEntries(SIZES.map((s) => [s.id, s]));

// A panel assignment: which photo sits in a panel slot, and how it is
// cropped inside it. x/y pan the crop (-0.5..0.5), zoom scales it (1..3).
export function blankPanel(castId) {
  return { castId, x: 0, y: 0, zoom: 1 };
}

// The default cover: Pop-Out Hero in Sunset grade, portrait post size,
// the whole cast on the billing block, title and furniture on.
export function defaultState() {
  return {
    layoutId: 'popout',
    gradeId: 'sunset',
    sizeId: 'portrait',
    title: 'VICE HEAT',
    subtitle: 'Chasing the Last Light',
    tagline: "EVERYONE'S GOT A PRICE IN LEONIDA",
    quote: '“THE HEAT IS REAL” — LEONIDA LEDGER',
    heat: 5,
    showFurniture: true,
    showSeal: true,
    showBilling: true,
    showRating: true,
    showPlatforms: true,
    showBarcode: true,
    showQuote: true,
    // One slot per panel of the active layout; fillCast() assigns the cast.
    panels: CAST.map((c) => blankPanel(c.id)),
    selectedPanel: 0,
  };
}

// Fill every panel slot of a layout with the cast in order, wrapping if
// the layout has more slots than cast members.
export function fillCast(state, layout) {
  const slots = layout.panels.length;
  state.panels = Array.from({ length: slots }, (_, i) =>
    blankPanel(CAST[i % CAST.length].id));
  state.selectedPanel = 0;
  return state;
}

// Shuffle the cast across the panels (Fisher–Yates over the assignments).
export function shuffleCast(state, layout) {
  const ids = state.panels.map((p) => p.castId);
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  state.panels = ids.map((id) => blankPanel(id));
  return state;
}

// The cast actually visible on the cover right now — the billing block
// names exactly these people, never anyone who is not on the poster.
export function visibleCast(state, layout) {
  const seen = [];
  for (let i = 0; i < layout.panels.length; i++) {
    const p = state.panels[i];
    if (!p) continue;
    const member = CAST_BY_ID[p.castId];
    if (member && !seen.includes(member)) seen.push(member);
  }
  return seen;
}

export function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

// Undo/redo history over whole-state snapshots. Every mutating action
// commits first, so Ctrl+Z restores the caption, the furniture toggles
// and the panel crops together — not just the last drag.
export function createHistory(initial) {
  return { past: [], present: cloneState(initial), future: [] };
}

export function historyCommit(history, next) {
  history.past.push(history.present);
  if (history.past.length > 80) history.past.shift();
  history.present = cloneState(next);
  history.future = [];
  return history.present;
}

export function historyUndo(history) {
  if (!history.past.length) return history.present;
  history.future.push(history.present);
  history.present = history.past.pop();
  return history.present;
}

export function historyRedo(history) {
  if (!history.future.length) return history.present;
  history.past.push(history.present);
  history.present = history.future.pop();
  return history.present;
}

export function historyCanUndo(history) {
  return history.past.length > 0;
}

export function historyCanRedo(history) {
  return history.future.length > 0;
}

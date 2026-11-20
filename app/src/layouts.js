// Vice Panel Studio — the three panel layouts.
// Each layout returns its panels as rectangles in pixels for a canvas of the
// given width and height. The gap between panels is a dark frame that reads
// as the poster's inked borders.
export const GAP = 10;

function rect(x, y, w, h) {
  return { x, y, w, h };
}

// Vice Grid: one hero panel on the left, four small panels in a 2x2 grid right.
export function viceGrid(w, h) {
  const g = GAP;
  const heroW = Math.round(w * 0.58);
  const rightX = heroW + g;
  const colW = Math.round((w - rightX - g) / 2);
  const rowH = Math.round((h - g) / 2);
  return [
    rect(0, 0, heroW, h),
    rect(rightX, 0, colW, rowH),
    rect(rightX + colW + g, 0, colW, rowH),
    rect(rightX, rowH + g, colW, rowH),
    rect(rightX + colW + g, rowH + g, colW, rowH),
  ];
}

// Sunset Strip: a wide hero on top, three equal panels along the bottom.
export function sunsetStrip(w, h) {
  const g = GAP;
  const heroH = Math.round(h * 0.56);
  const bottomY = heroH + g;
  const bottomH = h - bottomY;
  const colW = Math.round((w - 2 * g) / 3);
  return [
    rect(0, 0, w, heroH),
    rect(0, bottomY, colW, bottomH),
    rect(colW + g, bottomY, colW, bottomH),
    rect(2 * (colW + g), bottomY, w - 2 * (colW + g), bottomH),
  ];
}

// Neon Trio: three equal vertical panels.
export function neonTrio(w, h) {
  const g = GAP;
  const colW = Math.round((w - 2 * g) / 3);
  return [
    rect(0, 0, colW, h),
    rect(colW + g, 0, colW, h),
    rect(2 * (colW + g), 0, w - 2 * (colW + g), h),
  ];
}

export const LAYOUT_FNS = {
  'vice-grid': viceGrid,
  'sunset-strip': sunsetStrip,
  'neon-trio': neonTrio,
};

export function panelsFor(state, w, h) {
  const fn = LAYOUT_FNS[state.layout] ?? viceGrid;
  return fn(w, h);
}

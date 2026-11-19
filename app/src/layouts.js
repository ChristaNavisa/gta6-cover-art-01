// Panel layouts for Neon Coast Cover Studio.
// Every rect is a fraction of the cover (x, y, w, h in 0..1). The title band
// is drawn over the bottom of the art, poster-style, so panels may run the
// full height. `rot` tilts a panel around its own centre, in degrees.

function rect(x, y, w, h, rot = 0) {
  return { x, y, w, h, rot };
}

export const LAYOUTS = [
  {
    id: "hero-three",
    name: "Hero + Three",
    desc: "One big hero, three stacked",
    panels: 4,
    panelNames: ["Hero", "Top", "Middle", "Bottom"],
    gap: 0.012,
    rects: () => [
      rect(0, 0, 0.62, 1),
      rect(0.632, 0, 0.368, 0.326),
      rect(0.632, 0.337, 0.368, 0.326),
      rect(0.632, 0.674, 0.368, 0.326),
    ],
  },
  {
    id: "full-bleed",
    name: "Full Bleed",
    desc: "One photo, edge to edge",
    panels: 1,
    panelNames: ["Full photo"],
    gap: 0,
    rects: () => [rect(0, 0, 1, 1)],
  },
  {
    id: "grid-4",
    name: "Grid Four",
    desc: "Classic 2 × 2 poster grid",
    panels: 4,
    panelNames: ["Top left", "Top right", "Bottom left", "Bottom right"],
    gap: 0.012,
    rects: () => [
      rect(0, 0, 0.494, 0.494),
      rect(0.506, 0, 0.494, 0.494),
      rect(0, 0.506, 0.494, 0.494),
      rect(0.506, 0.506, 0.494, 0.494),
    ],
  },
  {
    id: "grid-6",
    name: "Grid Six",
    desc: "Six-panel contact sheet",
    panels: 6,
    panelNames: ["1", "2", "3", "4", "5", "6"],
    gap: 0.01,
    rects: () => [
      rect(0, 0, 0.3267, 0.495),
      rect(0.3367, 0, 0.3267, 0.495),
      rect(0.6733, 0, 0.3267, 0.495),
      rect(0, 0.505, 0.3267, 0.495),
      rect(0.3367, 0.505, 0.3267, 0.495),
      rect(0.6733, 0.505, 0.3267, 0.495),
    ],
  },
  {
    id: "grid-9",
    name: "Grid Nine",
    desc: "Nine-panel cover grid",
    panels: 9,
    panelNames: ["1", "2", "3", "4", "5", "6", "7", "8", "9"],
    gap: 0.008,
    rects: () => {
      const out = [];
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          out.push(rect(c * 0.3367, r * 0.3367, 0.3267, 0.3267));
        }
      }
      return out;
    },
  },
  {
    id: "split-duo",
    name: "Split Duo",
    desc: "Two halves, one story",
    panels: 2,
    panelNames: ["Left", "Right"],
    gap: 0.012,
    rects: () => [
      rect(0, 0, 0.494, 1),
      rect(0.506, 0, 0.494, 1),
    ],
  },
  {
    id: "tilted",
    name: "Tilted Snapshots",
    desc: "Polaroid-style tilted snaps",
    panels: 3,
    panelNames: ["Backdrop", "Snapshot A", "Snapshot B"],
    gap: 0,
    rects: () => [
      rect(0, 0, 1, 1),
      rect(0.07, 0.10, 0.52, 0.52, -6),
      rect(0.44, 0.34, 0.5, 0.5, 5),
    ],
  },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

// Panel rectangles in pixels for a cover of width w and height h.
export function panelRects(layout, w, h) {
  const g = layout.gap * Math.min(w, h);
  return layout.rects().map((r) => ({
    x: r.x * w + (r.x > 0 ? g / 2 : 0),
    y: r.y * h + (r.y > 0 ? g / 2 : 0),
    w: r.w * w - (r.x > 0 ? g / 2 : 0) - (r.x + r.w < 1 ? g / 2 : 0),
    h: r.h * h - (r.y > 0 ? g / 2 : 0) - (r.y + r.h < 1 ? g / 2 : 0),
    rot: r.rot,
  }));
}

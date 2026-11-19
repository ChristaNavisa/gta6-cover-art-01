// Colour grades for Neon Coast Cover Studio.
// Each grade is a gradient map: a shadow colour, a mid colour and a highlight
// colour. The renderer builds a 256-entry lookup table from them and remaps
// every pixel's luminance through it, then adds the grade's tint wash and
// glow. All grades are the studio's own palette — no game artwork.

export const GRADES = [
  {
    id: "vice-sunset",
    name: "Vice Sunset",
    desc: "Magenta dusk into gold",
    swatch: "linear-gradient(135deg,#2b0f3f 0%,#ff2e88 45%,#ff7a18 75%,#ffc93c 100%)",
    stops: [
      [0.0, [26, 8, 48]],
      [0.35, [122, 22, 96]],
      [0.65, [255, 46, 136]],
      [0.85, [255, 122, 24]],
      [1.0, [255, 201, 60]],
    ],
    wash: "rgba(255,46,136,0.10)",
    glow: "rgba(255,122,24,0.22)",
    strength: 0.72,
  },
  {
    id: "neon-nights",
    name: "Neon Nights",
    desc: "Pink + teal night street",
    swatch: "linear-gradient(135deg,#050b1e 0%,#ff2e88 40%,#19e3d6 80%,#b8fff6 100%)",
    stops: [
      [0.0, [4, 8, 26]],
      [0.35, [58, 16, 96]],
      [0.62, [255, 46, 136]],
      [0.85, [25, 227, 214]],
      [1.0, [214, 255, 248]],
    ],
    wash: "rgba(25,227,214,0.08)",
    glow: "rgba(255,46,136,0.20)",
    strength: 0.78,
  },
  {
    id: "golden-hour",
    name: "Golden Hour",
    desc: "Warm amber afternoon",
    swatch: "linear-gradient(135deg,#1c0f04 0%,#b3541e 45%,#ff9a3c 75%,#ffe9a8 100%)",
    stops: [
      [0.0, [24, 12, 4]],
      [0.35, [96, 44, 16]],
      [0.65, [214, 110, 32]],
      [0.85, [255, 154, 60]],
      [1.0, [255, 233, 168]],
    ],
    wash: "rgba(255,154,60,0.10)",
    glow: "rgba(255,201,60,0.18)",
    strength: 0.7,
  },
  {
    id: "miami-pink",
    name: "Miami Pink",
    desc: "Bubblegum pastel pop",
    swatch: "linear-gradient(135deg,#3d0a2e 0%,#ff5da2 45%,#ff9ecf 75%,#fff0f7 100%)",
    stops: [
      [0.0, [48, 8, 40]],
      [0.35, [140, 28, 96]],
      [0.62, [255, 93, 162]],
      [0.85, [255, 158, 207]],
      [1.0, [255, 240, 247]],
    ],
    wash: "rgba(255,93,162,0.08)",
    glow: "rgba(255,158,207,0.16)",
    strength: 0.65,
  },
  {
    id: "teal-noir",
    name: "Teal Noir",
    desc: "Moody cyan shadows",
    swatch: "linear-gradient(135deg,#02141a 0%,#0a4d5c 45%,#19b8c9 75%,#d2fbff 100%)",
    stops: [
      [0.0, [2, 16, 22]],
      [0.35, [8, 64, 78]],
      [0.65, [16, 140, 158]],
      [0.85, [64, 200, 210]],
      [1.0, [220, 252, 255]],
    ],
    wash: "rgba(25,184,201,0.09)",
    glow: "rgba(25,227,214,0.16)",
    strength: 0.75,
  },
  {
    id: "mono-pop",
    name: "Mono Pop",
    desc: "High-contrast ink black",
    swatch: "linear-gradient(135deg,#000000 0%,#3a3a3a 45%,#c9c9c9 80%,#ffffff 100%)",
    stops: [
      [0.0, [0, 0, 0]],
      [0.3, [40, 40, 44]],
      [0.6, [120, 118, 128]],
      [0.85, [205, 203, 212]],
      [1.0, [255, 255, 255]],
    ],
    wash: "rgba(255,46,136,0.05)",
    glow: "rgba(255,255,255,0.10)",
    strength: 0.6,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

// Build a 256-entry RGB lookup table for a grade's gradient map.
export function buildGradeLut(grade) {
  const lut = new Uint8Array(256 * 3);
  const stops = grade.stops;
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0];
    let b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) {
        a = stops[s];
        b = stops[s + 1];
        break;
      }
    }
    const span = b[0] - a[0] || 1;
    const f = Math.min(1, Math.max(0, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) {
      lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * f);
    }
  }
  return lut;
}

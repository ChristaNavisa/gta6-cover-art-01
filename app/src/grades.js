// Grades for Vice Panel Studio: each grade is a gradient wash laid over the
// panels plus the lettering colours it pairs with. The wash is drawn with
// the named composite mode so the photos keep their detail; mono-gold also
// desaturates the panels themselves (see render.js).
export const GRADES = {
  'vice-sunset': {
    label: 'Vice Sunset',
    wash: [
      [0, 'rgba(255,126,95,0.22)'],
      [0.55, 'rgba(255,126,95,0.05)'],
      [1, 'rgba(43,16,85,0.30)'],
    ],
    blend: 'soft-light',
    caption: '#fff7e0',
    accent: '#ffd194',
    star: '#ffc93c',
  },
  'neon-nights': {
    label: 'Neon Nights',
    wash: [
      [0, 'rgba(255,0,128,0.24)'],
      [0.5, 'rgba(0,229,255,0.10)'],
      [1, 'rgba(20,0,40,0.34)'],
    ],
    blend: 'overlay',
    caption: '#ffffff',
    accent: '#ff5da2',
    star: '#ffe14d',
  },
  bubblegum: {
    label: 'Bubblegum',
    wash: [
      [0, 'rgba(255,105,180,0.22)'],
      [1, 'rgba(147,112,219,0.26)'],
    ],
    blend: 'soft-light',
    caption: '#fff0f6',
    accent: '#ff8fc7',
    star: '#ffd6ec',
  },
  'mono-gold': {
    label: 'Mono Gold',
    wash: [
      [0, 'rgba(60,50,35,0.30)'],
      [1, 'rgba(20,16,10,0.38)'],
    ],
    blend: 'soft-light',
    caption: '#f5d76e',
    accent: '#d4af37',
    star: '#f5d76e',
  },
};

export function gradeOf(id) {
  return GRADES[id] ?? GRADES['vice-sunset'];
}

export function gradeLabel(id) {
  return gradeOf(id).label;
}

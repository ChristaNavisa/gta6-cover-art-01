// Vice Panel Studio — the four colour grades.
// A grade is a stack of full-canvas overlays drawn over the photos: a tint
// gradient, a soft-light wash and a multiply shadow, each with its own
// colours and strength. No photo is ever modified; the grade is paint.
export const GRADES = {
  'vice-sunset': {
    label: 'Vice Sunset',
    tint: ['rgba(255,122,26,0.34)', 'rgba(255,45,120,0.22)', 'rgba(90,20,120,0.18)'],
    wash: 'rgba(255,180,80,0.20)',
    shadow: 'rgba(40,0,80,0.20)',
    title: '#ffffff',
    subtitle: '#ffd166',
  },
  'neon-nights': {
    label: 'Neon Nights',
    tint: ['rgba(255,0,128,0.30)', 'rgba(0,220,255,0.24)', 'rgba(120,0,255,0.20)'],
    wash: 'rgba(255,0,160,0.16)',
    shadow: 'rgba(0,10,60,0.26)',
    title: '#ffffff',
    subtitle: '#7df9ff',
  },
  'palm-noir': {
    label: 'Palm Noir',
    tint: ['rgba(0,0,0,0.42)', 'rgba(20,60,70,0.22)', 'rgba(255,255,255,0.06)'],
    wash: 'rgba(0,0,0,0.18)',
    shadow: 'rgba(0,0,0,0.30)',
    title: '#f5f0e6',
    subtitle: '#c8b98a',
  },
  bubblegum: {
    label: 'Bubblegum',
    tint: ['rgba(255,120,200,0.30)', 'rgba(150,80,255,0.22)', 'rgba(255,220,90,0.14)'],
    wash: 'rgba(255,160,220,0.18)',
    shadow: 'rgba(90,0,90,0.16)',
    title: '#ffffff',
    subtitle: '#ffe066',
  },
};

// Paints a grade's overlays over the whole canvas.
export function applyGrade(ctx, w, h, gradeId) {
  const grade = GRADES[gradeId] ?? GRADES['vice-sunset'];
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grade.tint.forEach((color, i) => {
    grad.addColorStop(i / Math.max(1, grade.tint.length - 1), color);
  });
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, w, h);
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = grade.shadow;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// A deterministic pseudo-random generator, so the grain is the same every run.
export function seededRandom(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Sprinkles deterministic film grain over the canvas.
export function applyGrain(ctx, w, h, amount) {
  const rand = seededRandom(20261119);
  const step = 3;
  ctx.save();
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const v = rand();
      if (v < 0.5) continue;
      ctx.fillStyle = v > 0.75 ? `rgba(255,255,255,${amount})` : `rgba(0,0,0,${amount})`;
      ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
}

// Darkens the corners so the caption and the panels sit forward.
export function applyVignette(ctx, w, h) {
  const grad = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

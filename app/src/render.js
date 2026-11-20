// Rendering for Vice Panel Studio: draws a cover onto a 2D canvas.
//
// Order: dark ground, panels (cover-fit photos with per-panel pan/zoom),
// the grade wash, film grain, vignette, then the title band with the
// caption, the accent line, and the gold-rimmed star pill.
import { gradeOf } from './grades.js';
import { layoutOf } from './layouts.js';

/** A tiny deterministic PRNG, so grain is identical on every export. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Draw one photo cover-fit into a rectangle, honouring pan/zoom. */
function drawPhoto(ctx, img, x, y, w, h, panel, desaturate) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  if (!img) {
    ctx.fillStyle = '#2a1630';
    ctx.fillRect(x, y, w, h);
    ctx.restore();
    return;
  }
  if (desaturate) ctx.filter = 'grayscale(0.85) sepia(0.25)';
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(w / iw, h / ih) * panel.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2 - (panel.x - 0.5) * (dw - w);
  const dy = y + (h - dh) / 2 - (panel.y - 0.5) * (dh - h);
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function drawStars(ctx, cx, cy, size, filled, total, color) {
  ctx.save();
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const gap = size * 1.15;
  const startX = cx - ((total - 1) * gap) / 2;
  for (let i = 0; i < total; i++) {
    ctx.fillStyle = i < filled ? color : 'rgba(255,255,255,0.25)';
    ctx.fillText('★', startX + i * gap, cy);
  }
  ctx.restore();
}

/** The 5-star heat meter: a dark pill with a gold rim, top right. */
export function drawStarPill(ctx, W, stars, color) {
  const pillW = Math.round(W * 0.24);
  const pillH = Math.round(W * 0.055);
  const x = W - pillW - Math.round(W * 0.025);
  const y = Math.round(W * 0.025);
  ctx.save();
  roundRect(ctx, x, y, pillW, pillH, pillH / 2);
  ctx.fillStyle = 'rgba(10,5,18,0.78)';
  ctx.fill();
  ctx.lineWidth = Math.max(2, W * 0.0025);
  ctx.strokeStyle = '#ffd700';
  ctx.stroke();
  drawStars(ctx, x + pillW / 2, y + pillH / 2 + 1, pillH * 0.62, stars, 5, color);
  ctx.restore();
}

function drawGrain(ctx, W, H, seed) {
  const rand = mulberry32(seed);
  const count = Math.floor((W * H) / 1400);
  ctx.save();
  for (let i = 0; i < count; i++) {
    const v = rand();
    ctx.fillStyle = v > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
    const s = 1 + Math.floor(rand() * 2);
    ctx.fillRect(rand() * W, rand() * H, s, s);
  }
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.38)');
  ctx.save();
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function fitCaption(ctx, text, maxWidth, startSize) {
  let size = startSize;
  ctx.font = `${size}px "Archivo Black", sans-serif`;
  while (size > 12 && ctx.measureText(text).width > maxWidth) {
    size = Math.floor(size * 0.92);
    ctx.font = `${size}px "Archivo Black", sans-serif`;
  }
  return size;
}

/**
 * Draw the whole cover. `images` is an array of loaded <img> (or null)
 * indexed by panel.photo; `state` is a cover state (see state.js).
 */
export function drawCover(ctx, W, H, state, images) {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#12081c';
  ctx.fillRect(0, 0, W, H);
  const layout = layoutOf(state.layout);
  const grade = gradeOf(state.grade);
  const gap = Math.max(3, Math.round(W * 0.008));
  const desaturate = state.grade === 'mono-gold';
  const n = layout.panels.length;
  for (let i = 0; i < n; i++) {
    const p = layout.panels[i];
    const panel = state.panels[i];
    const x = p.x * W;
    const y = p.y * H;
    const w = p.w * W;
    const h = p.h * H;
    drawPhoto(ctx, images[panel.photo] ?? null, x + gap / 2, y + gap / 2, w - gap, h - gap, panel, desaturate);
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = Math.max(2, W * 0.002);
    ctx.strokeRect(x + gap / 2, y + gap / 2, w - gap, h - gap);
  }
  // Grade wash over the panels.
  const wash = ctx.createLinearGradient(0, 0, 0, H);
  for (const [stop, color] of grade.wash) wash.addColorStop(stop, color);
  ctx.save();
  ctx.globalCompositeOperation = grade.blend;
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
  if (state.grain) drawGrain(ctx, W, H, 1337);
  if (state.vignette) drawVignette(ctx, W, H);
  // Title band.
  const t = layout.title;
  const bx = t.x * W;
  const by = t.y * H;
  const bw = t.w * W;
  const bh = t.h * H;
  ctx.save();
  ctx.fillStyle = 'rgba(10,5,18,0.86)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.fillStyle = grade.accent;
  ctx.fillRect(bx, by, bw, Math.max(2, H * 0.004));
  // Caption, fitted to the band.
  const caption = (state.caption || 'UNTITLED').toUpperCase();
  const capSize = fitCaption(ctx, caption, bw * 0.86, Math.round(bh * 0.52));
  ctx.font = `${capSize}px "Archivo Black", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(2, capSize / 10);
  ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeText(caption, bx + bw / 2, by + bh * 0.36);
  ctx.fillStyle = grade.caption;
  ctx.fillText(caption, bx + bw / 2, by + bh * 0.36);
  // A thin gold rule under the caption, exactly the caption's width.
  const capWidth = ctx.measureText(caption).width;
  ctx.fillStyle = grade.accent;
  ctx.fillRect(bx + (bw - capWidth) / 2, by + bh * 0.58, capWidth, Math.max(2, bh * 0.02));
  // Accent line in Righteous, fitted to the band like the caption.
  let subSize = Math.max(12, Math.round(bh * 0.2));
  ctx.font = `${subSize}px Righteous, cursive`;
  while (subSize > 10 && ctx.measureText(state.subcaption || '').width > bw * 0.86) {
    subSize = Math.floor(subSize * 0.92);
    ctx.font = `${subSize}px Righteous, cursive`;
  }
  ctx.fillStyle = grade.accent;
  ctx.fillText(state.subcaption || '', bx + bw / 2, by + bh * 0.76);
  ctx.restore();
  drawStarPill(ctx, W, clamp(state.stars, 0, 5), grade.star);
  ctx.restore();
}

/** Render a cover into a fresh canvas of the state's size and return it. */
export function renderCoverCanvas(state, images) {
  const { w, h } = sizeOfState(state);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  drawCover(canvas.getContext('2d'), w, h, state, images);
  return canvas;
}

export function sizeOfState(state) {
  const sizes = {
    square: { w: 1080, h: 1080 },
    portrait: { w: 1080, h: 1350 },
    story: { w: 1920, h: 1080 },
  };
  return sizes[state.size] ?? sizes.square;
}

/** True when a canvas holds anything but flat colour (self-test helper). */
export function canvasHasContent(canvas) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const data = ctx.getImageData(0, 0, w, h).data;
  let sum = 0;
  let seen = new Set();
  const step = Math.max(1, Math.floor((w * h) / 4000));
  for (let i = 0; i < data.length; i += 4 * step) {
    const key = ((data[i] >> 4) << 8) | ((data[i + 1] >> 4) << 4) | (data[i + 2] >> 4);
    seen.add(key);
    sum += data[i] + data[i + 1] + data[i + 2];
    if (seen.size > 24) return true;
  }
  return seen.size > 4 && sum > 0;
}

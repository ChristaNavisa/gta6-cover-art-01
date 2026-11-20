// Vice Panel Studio — the canvas cover renderer.
// drawCover paints a whole cover onto a canvas of the given size: the panels
// with their photos, the grade, grain and vignette, then the caption and the
// heat meter. drawPanelPhoto is the crop: cover-fit, scaled and panned.
import { panelsFor } from './layouts.js';
import { applyGrade, applyGrain, applyVignette, GRADES } from './grades.js';

const FRAME = '#0b0620';

// Draws one photo into its panel, cover-fit, with the panel's zoom and pan.
export function drawPanelPhoto(ctx, img, panel, crop) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(panel.w / iw, panel.h / ih);
  const scale = base * (crop.scale || 1);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = panel.x + (panel.w - dw) / 2 + (crop.ox || 0);
  const dy = panel.y + (panel.h - dh) / 2 + (crop.oy || 0);
  ctx.save();
  ctx.beginPath();
  ctx.rect(panel.x, panel.y, panel.w, panel.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// A placeholder panel when no photo is loaded yet: a sunset gradient.
export function drawPlaceholder(ctx, panel, index) {
  const grad = ctx.createLinearGradient(panel.x, panel.y, panel.x + panel.w, panel.y + panel.h);
  grad.addColorStop(0, index % 2 === 0 ? '#ff7a1a' : '#ff2d78');
  grad.addColorStop(1, index % 2 === 0 ? '#7a14ff' : '#1a6cff');
  ctx.save();
  ctx.fillStyle = grad;
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.font = `bold ${Math.max(14, Math.round(panel.w / 12))}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ADD PHOTO', panel.x + panel.w / 2, panel.y + panel.h / 2);
  ctx.restore();
}

// The 5-star heat meter, drawn on a dark pill so it reads over bright photos.
export function drawStarMeter(ctx, x, y, stars, size) {
  const pad = Math.round(size * 0.35);
  const starW = size * 1.15;
  const w = pad * 2 + starW * 5;
  const h = size + pad * 2;
  ctx.save();
  ctx.fillStyle = 'rgba(10,6,32,0.72)';
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fill();
  // A thin gold rim so the pill pops even over the brightest photo.
  ctx.strokeStyle = 'rgba(255,209,102,0.55)';
  ctx.lineWidth = Math.max(1, Math.round(size * 0.06));
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const cx = x + pad + starW * i + starW / 2;
    const cy = y + h / 2;
    drawStar(ctx, cx, cy, size * 0.52, size * 0.24, i < stars ? '#ffd166' : 'rgba(255,255,255,0.35)');
  }
  ctx.restore();
  return { w, h };
}

function drawStar(ctx, cx, cy, outer, inner, color) {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// The caption: a big Anton title with a Pacifico subtitle under it.
export function drawCaption(ctx, w, h, state, grade) {
  const margin = Math.round(w * 0.045);
  const titleSize = Math.round(w * 0.085);
  const subSize = Math.round(w * 0.032);
  const bottom = h - margin;
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'left';
  ctx.font = `${titleSize}px Anton, sans-serif`;
  ctx.lineWidth = Math.max(3, Math.round(titleSize / 12));
  ctx.strokeStyle = 'rgba(10,6,32,0.85)';
  ctx.lineJoin = 'round';
  const title = (state.title || 'NEON SHORE').toUpperCase();
  ctx.strokeText(title, margin, bottom - subSize - Math.round(titleSize * 0.25));
  ctx.fillStyle = grade.title;
  ctx.fillText(title, margin, bottom - subSize - Math.round(titleSize * 0.25));
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.fillStyle = grade.subtitle;
  ctx.fillText(state.subtitle || '', margin, bottom);
  ctx.restore();
}

// Paints the full cover onto `canvas` at its own pixel size.
export function drawCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] ?? GRADES['vice-sunset'];
  ctx.save();
  ctx.fillStyle = FRAME;
  ctx.fillRect(0, 0, w, h);
  const panels = panelsFor(state, w, h);
  panels.forEach((panel, i) => {
    const crop = state.panels[i] ?? { photo: null, scale: 1, ox: 0, oy: 0 };
    const img = crop.photo ? images.get(crop.photo) : null;
    if (img) drawPanelPhoto(ctx, img, panel, crop);
    else drawPlaceholder(ctx, panel, i);
  });
  applyGrade(ctx, w, h, state.grade);
  applyGrain(ctx, w, h, 0.05);
  applyVignette(ctx, w, h);
  const starSize = Math.round(w * 0.038);
  drawStarMeter(ctx, w - Math.round(w * 0.045) - (starSize * 1.15 * 5 + starSize * 0.7), Math.round(h * 0.04), state.stars, starSize);
  drawCaption(ctx, w, h, state, grade);
  ctx.restore();
  return canvas;
}

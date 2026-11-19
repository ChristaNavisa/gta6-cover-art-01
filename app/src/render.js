// Cover rendering for Vice Panel Studio.
//
// drawCover paints one cover on a canvas at any size: photos cover-fit
// into their panel frames with per-panel pan and zoom, the grade wash,
// the Anton title with its Pacifico subtitle, the star heat meter, film
// grain and a vignette. Grain uses a seeded generator so the same state
// always exports the same PNG bytes.

import { panelRects } from './layouts.js';
import { GRADES } from './grades.js';
import { SAMPLE_PHOTOS } from './state.js';

/** The loaded images, by photo key (a sample name or an upload id). */
const imageCache = new Map();

/** Load one image by key; sample keys resolve to app/samples/, uploads are data URLs. */
export function loadPhoto(key) {
  if (imageCache.has(key)) return Promise.resolve(imageCache.get(key));
  const src = SAMPLE_PHOTOS[key] ?? key;
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(key, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`cannot load photo ${key}`));
    img.src = src;
  });
}

/** Remember an uploaded image under an id, for state to name. */
export function cacheUpload(id, img) {
  imageCache.set(id, img);
}

/** Load every photo a state names (missing ones become null, never fatal). */
export async function ensurePhotos(state) {
  const out = [];
  for (const panel of state.panels) {
    try {
      out.push(await loadPhoto(panel.photo));
    } catch {
      out.push(null);
    }
  }
  return out;
}

/** A small seeded generator (mulberry32): stable grain per cover. */
export function seededRandom(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One five-pointed star path, centred at (x, y) with outer radius r. */
function starPath(ctx, x, y, r) {
  const inner = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const rad = i % 2 === 0 ? r : inner;
    const px = x + Math.cos(angle) * rad;
    const py = y + Math.sin(angle) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

/** Draw one panel's photo cover-fit, with its pan and zoom. */
function drawPanelPhoto(ctx, img, rect, panel) {
  if (!img) {
    ctx.fillStyle = '#241a3a';
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    return;
  }
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * panel.scale;
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + panel.ox * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + panel.oy * rect.h;
  ctx.drawImage(img, dx, dy, dw, dh);
}

/** Wash one panel rect with a grade's gradient and tint. */
function gradePanel(ctx, grade, rect) {
  const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
  grad.addColorStop(0, grade.top);
  grad.addColorStop(1, grade.bottom);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = grade.tintAlpha * 2;
  ctx.fillStyle = grade.tint;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

/** Paint the whole cover on `canvas` at W x H from a state and its images. */
export function drawCover(canvas, state, W, H, images) {
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  const grade = GRADES[state.grade] ?? GRADES['vice-sunset'];
  const rects = panelRects(state.layout, W, H);

  ctx.fillStyle = grade.frame;
  ctx.fillRect(0, 0, W, H);

  rects.forEach((rect, i) => {
    const panel = state.panels[i];
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    drawPanelPhoto(ctx, images[i] ?? null, rect, panel);
    gradePanel(ctx, grade, rect);
    ctx.restore();
    ctx.strokeStyle = grade.frame;
    ctx.lineWidth = Math.max(2, W * 0.004);
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  });

  // Title block: bold Anton title, Pacifico subtitle, bottom left.
  const titleSize = Math.round(H * 0.085);
  const subSize = Math.round(H * 0.032);
  const pad = Math.round(W * 0.03);
  ctx.save();
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = Math.round(H * 0.012);
  ctx.shadowOffsetY = Math.round(H * 0.004);
  ctx.fillStyle = grade.title;
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = Math.max(2, titleSize * 0.06);
  ctx.font = `${titleSize}px Anton, 'Bebas Neue', sans-serif`;
  const title = (state.title || 'UNTITLED').toUpperCase();
  const ty = H - pad - subSize - Math.round(H * 0.012);
  ctx.strokeText(title, pad, ty);
  ctx.fillText(title, pad, ty);
  ctx.shadowBlur = Math.round(H * 0.008);
  ctx.fillStyle = grade.subtitle;
  ctx.font = `${subSize}px Pacifico, cursive`;
  ctx.fillText(state.subtitle || '', pad, H - pad);
  ctx.restore();

  // Star heat meter, top right, on a dark pill so it reads over any photo.
  const starR = Math.round(H * 0.022);
  const gap = starR * 2.4;
  const total = gap * 4 + starR * 2;
  const pillX = W - pad - total - starR;
  const pillY = pad - starR * 0.4;
  const pillW = total + starR * 2;
  const pillH = starR * 2.8;
  ctx.save();
  ctx.fillStyle = 'rgba(10, 6, 20, 0.55)';
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.restore();
  let sx = W - pad - total + starR;
  const sy = pad + starR;
  for (let i = 0; i < 5; i++) {
    starPath(ctx, sx + i * gap, sy, starR);
    if (i < state.stars) {
      ctx.fillStyle = grade.star;
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.75)';
      ctx.lineWidth = Math.max(1.5, starR * 0.12);
      ctx.stroke();
    }
  }

  // Film grain (seeded, so exports are stable) and a vignette.
  const rand = seededRandom(20261119 + W * 7 + H * 13);
  const dots = Math.round((W * H) / 900);
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < dots; i++) {
    const x = rand() * W;
    const y = rand() * H;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  ctx.restore();
  const vig = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.45,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, W, H);
}

/** Render a cover offscreen at W x H and return its PNG blob. */
export async function exportCover(state, size) {
  const [w, h] = size.split('x').map(Number);
  const images = await ensurePhotos(state);
  const canvas = document.createElement('canvas');
  drawCover(canvas, state, w, h, images);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('export failed'));
    }, 'image/png');
  });
}

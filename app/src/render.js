// The cover renderer for Vice Panel Studio.
// drawCover paints one finished cover onto a 2D canvas: the layout's panels
// with their photos (cropped and positioned per panel), the colour grade,
// the bold title lettering with its script subtitle, the heat stars, grain
// and a vignette. Everything is drawn by hand on canvas -- the exported PNG
// is exactly what the preview shows, at any post size.

import { panelRects } from './layouts.js';
import { gradeById, applyGrade } from './grades.js';

// A small noise tile for the film grain, built once and reused.
let noiseTile = null;
function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const tile = document.createElement('canvas');
  tile.width = 128;
  tile.height = 128;
  const tctx = tile.getContext('2d');
  const img = tctx.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(Math.random() * 256);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  noiseTile = tile;
  return tile;
}

// Draw a five-pointed star path centred on (cx, cy) with outer radius r.
function starPath(ctx, cx, cy, r) {
  const inner = r * 0.42;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const px = cx + Math.cos(a) * rad;
    const py = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

// Draw one panel: the photo cover-fitted with its zoom and pan, the grade
// washed over it, and a white frame. ox/oy are fractions of the panel size.
function drawPanel(ctx, panel, rect, grade, gutter) {
  const x = rect.x + gutter;
  const y = rect.y + gutter;
  const w = rect.w - gutter * 2;
  const h = rect.h - gutter * 2;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.fillStyle = '#1a1626';
  ctx.fillRect(x, y, w, h);
  const img = panel.img;
  if (img && img.naturalWidth > 0) {
    const zoom = panel.zoom || 1;
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    // Clamp the pan so the photo always covers the panel.
    const maxOx = Math.max(0, (dw - w) / 2 / w);
    const maxOy = Math.max(0, (dh - h) / 2 / h);
    const ox = Math.max(-maxOx, Math.min(maxOx, panel.ox || 0));
    const oy = Math.max(-maxOy, Math.min(maxOy, panel.oy || 0));
    const dx = x + (w - dw) / 2 + ox * w;
    const dy = y + (h - dh) / 2 + oy * h;
    ctx.drawImage(img, dx, dy, dw, dh);
    applyGrade(ctx, grade, x, y, w, h);
  }
  ctx.restore();
  // White poster frame around the panel.
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, gutter * 0.9);
  ctx.strokeRect(x, y, w, h);
  ctx.restore();
}

// Fit the title across the cover: shrink the font until it fits 92% of the
// width, then draw it white with a dark outline, tilted a touch.
function drawTitle(ctx, cover, W, H) {
  const title = (cover.title || '').toUpperCase();
  if (!title) return;
  const bandH = H * 0.26;
  const bandY = H - bandH;
  // Dark scrim so the lettering reads over any photo.
  const scrim = ctx.createLinearGradient(0, bandY - H * 0.08, 0, H);
  scrim.addColorStop(0, 'rgba(5,4,10,0)');
  scrim.addColorStop(1, 'rgba(5,4,10,0.78)');
  ctx.fillStyle = scrim;
  ctx.fillRect(0, bandY - H * 0.08, W, H * 0.34);
  let size = H * 0.115;
  ctx.textBaseline = 'alphabetic';
  const setFont = (s) => {
    ctx.font = `400 ${Math.round(s)}px Anton, 'Arial Narrow', sans-serif`;
    try {
      ctx.letterSpacing = `${Math.round(s * 0.06)}px`;
    } catch (e) {
      /* older canvas: no letter spacing, the title still draws */
    }
  };
  setFont(size);
  while (ctx.measureText(title).width > W * 0.92 && size > H * 0.04) {
    size *= 0.92;
    setFont(size);
  }
  const tx = W * 0.04;
  const ty = H - H * 0.115;
  ctx.save();
  ctx.translate(tx, ty);
  ctx.rotate(-0.022);
  ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(10,6,16,0.9)';
  ctx.lineWidth = Math.max(3, size * 0.09);
  ctx.strokeText(title, 0, 0);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(title, 0, 0);
  ctx.restore();
  // Script subtitle under the title, in Pacifico pink-gold.
  const sub = (cover.subtitle || '').trim();
  if (sub) {
    const subSize = Math.max(14, H * 0.042);
    ctx.save();
    ctx.font = `400 ${Math.round(subSize)}px Pacifico, cursive`;
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = 'rgba(10,6,16,0.85)';
    ctx.lineWidth = Math.max(2, subSize * 0.1);
    const sx = W * 0.045;
    const sy = H - H * 0.045;
    ctx.strokeText(sub, sx, sy);
    ctx.fillText(sub, sx, sy);
    ctx.restore();
  }
  try {
    ctx.letterSpacing = '0px';
  } catch (e) {
    /* ignore */
  }
}

// Five heat stars at the top right: filled gold for the heat level, outlined
// for the rest. Pure decoration, drawn by hand.
function drawHeat(ctx, heat, W, H) {
  const r = Math.max(9, H * 0.022);
  const gap = r * 2.5;
  const total = gap * 4 + r * 2;
  let cx = W - W * 0.04 - total + r;
  const cy = H * 0.055;
  for (let i = 0; i < 5; i++) {
    starPath(ctx, cx, cy, r);
    if (i < heat) {
      ctx.fillStyle = '#ffd166';
      ctx.fill();
      ctx.strokeStyle = 'rgba(10,6,16,0.9)';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    cx += gap;
  }
}

// Paint the whole cover. cover = { layoutId, gradeId, title, subtitle,
// heat, grain, vignette, panels: [{ img, zoom, ox, oy }, ...] }.
export function drawCover(ctx, cover, W, H) {
  const grade = gradeById(cover.gradeId);
  const rects = panelRects(cover.layoutId, W, H);
  const gutter = Math.max(3, Math.min(W, H) * 0.006);
  ctx.save();
  ctx.fillStyle = '#0d0b12';
  ctx.fillRect(0, 0, W, H);
  rects.forEach((rect, i) => {
    const panel = cover.panels[i] || {};
    drawPanel(ctx, panel, rect, grade, gutter);
  });
  drawTitle(ctx, cover, W, H);
  drawHeat(ctx, cover.heat || 0, W, H);
  if (cover.grain) {
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = ctx.createPattern(getNoiseTile(), 'repeat');
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (cover.vignette) {
    const vg = ctx.createRadialGradient(
      W / 2, H / 2, Math.min(W, H) * 0.42,
      W / 2, H / 2, Math.max(W, H) * 0.75,
    );
    vg.addColorStop(0, 'rgba(0,0,0,0)');
    vg.addColorStop(1, 'rgba(0,0,0,0.38)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);
  }
  // Thin outer frame, the poster's edge.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, H * 0.005);
  ctx.strokeRect(0, 0, W, H);
  ctx.restore();
}

// A fresh canvas with the cover drawn at W by H.
export function coverCanvas(cover, W, H) {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  drawCover(canvas.getContext('2d'), cover, W, H);
  return canvas;
}

// The cover as a PNG blob at W by H.
export function exportCoverPNG(cover, W, H) {
  return new Promise((resolve) => {
    coverCanvas(cover, W, H).toBlob((blob) => resolve(blob), 'image/png');
  });
}

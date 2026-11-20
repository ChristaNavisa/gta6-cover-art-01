// Vice Panel Studio — the cover renderer.
//
// Draws a whole cover onto a 2D canvas at any post size: panels filled with
// photos (each cropped and positioned on its own), the pop-out hero cut-out,
// the striped retro-chrome title, the neon subtitle, the gold rule and heat
// stars, the cast role tags, the callout chips and the seal, then grain and
// vignette. Everything is drawn from the state object, so the editor preview
// and the exported PNG are the same picture.

import { gradeById } from './grades.js';
import { layoutById } from './layouts.js';
import { photoById, sizeById } from './state.js';

const TITLE_FONT = 'Bungee';
const NEON_FONT = 'Monoton';
const TAG_FONT = 'Racing Sans One';

const photoCache = new Map();

/** Load a photo (sample file or uploaded data URL) once, then reuse it. */
export function loadPhoto(src) {
  if (photoCache.has(src)) return photoCache.get(src);
  const done = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`cannot load photo ${src}`));
    img.src = src;
  });
  photoCache.set(src, done);
  return done;
}

function photoSrc(panel) {
  if (typeof panel.photo === 'string' && panel.photo.startsWith('data:')) return panel.photo;
  const known = photoById(panel.photo);
  return known ? known.src : 'samples/boulevard.jpg';
}

/** Load every photo a state needs, plus the three display fonts. */
export async function ensureAssets(state) {
  await Promise.all([
    document.fonts.load(`40px "${TITLE_FONT}"`),
    document.fonts.load(`40px "${NEON_FONT}"`),
    document.fonts.load(`40px "${TAG_FONT}"`),
    ...state.panels.map((p) => loadPhoto(photoSrc(p)).catch(() => null)),
  ]);
}

/** Deterministic pseudo-random: the same cover always grains the same way. */
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

function hashSeed(text) {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function starPath(ctx, cx, cy, rOuter, rInner, points = 5) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / points - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/**
 * Draw one photo into a rect, cover-fit, zoomed around its focal point
 * (panel.x / panel.y, 0..1) and graded with a two-colour wash.
 */
function drawPanelPhoto(ctx, img, rect, panel, grade, w, h) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const rw = rect.w * w;
  const rh = rect.h * h;
  const zoom = Math.max(0.5, panel.zoom || 1);
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  const sw = rw / scale;
  const sh = rh / scale;
  const sx = Math.min(Math.max((panel.x ?? 0.5) * iw - sw / 2, 0), Math.max(iw - sw, 0));
  const sy = Math.min(Math.max((panel.y ?? 0.5) * ih - sh / 2, 0), Math.max(ih - sh, 0));
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x * w, rect.y * h, rw, rh);
  ctx.clip();
  ctx.drawImage(img, sx, sy, sw, sh, rect.x * w, rect.y * h, rw, rh);
  const wash = ctx.createLinearGradient(rect.x * w, rect.y * h, rect.x * w, (rect.y + rect.h) * h);
  wash.addColorStop(0, grade.tintTop);
  wash.addColorStop(1, grade.tintBottom);
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillStyle = wash;
  ctx.fillRect(rect.x * w, rect.y * h, rw, rh);
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.92)';
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.strokeRect(rect.x * w, rect.y * h, rw, rh);
}

/** The hero cut-out: the same photo, bigger, tilted, white-edged, casting a shadow. */
function drawPopoutHero(ctx, img, rect, panel, grade, w, h) {
  const cx = (rect.x + rect.w / 2) * w;
  const cy = (rect.y + rect.h / 2) * h;
  const rw = rect.w * w * 1.09;
  const rh = rect.h * h * 1.09;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((-1.5 * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = w * 0.02;
  ctx.shadowOffsetY = h * 0.008;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(-rw / 2 - w * 0.006, -rh / 2 - w * 0.006, rw + w * 0.012, rh + h * 0.012);
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  ctx.rect(-rw / 2, -rh / 2, rw, rh);
  ctx.clip();
  const zoom = Math.max(0.5, panel.zoom || 1);
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.max(rw / iw, rh / ih) * zoom;
  const sw = rw / scale;
  const sh = rh / scale;
  const sx = Math.min(Math.max((panel.x ?? 0.5) * iw - sw / 2, 0), Math.max(iw - sw, 0));
  const sy = Math.min(Math.max((panel.y ?? 0.5) * ih - sh / 2, 0), Math.max(ih - sh, 0));
  ctx.drawImage(img, sx, sy, sw, sh, -rw / 2, -rh / 2, rw, rh);
  const wash = ctx.createLinearGradient(0, -rh / 2, 0, rh / 2);
  wash.addColorStop(0, grade.tintTop);
  wash.addColorStop(1, grade.tintBottom);
  ctx.globalAlpha = grade.tintAlpha;
  ctx.fillStyle = wash;
  ctx.fillRect(-rw / 2, -rh / 2, rw, rh);
  ctx.restore();
  ctx.globalAlpha = 1;
}

/** Title in striped retro-chrome: a chrome gradient clipped to the letters, then pale stripes over it. */
function drawChromeTitle(ctx, text, cx, y, maxWidth, fontPx, grade) {
  ctx.save();
  ctx.font = `${fontPx}px "${TITLE_FONT}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const measured = ctx.measureText(text);
  let px = fontPx;
  if (measured.width > maxWidth) {
    px = Math.floor((fontPx * maxWidth) / measured.width);
    ctx.font = `${px}px "${TITLE_FONT}", sans-serif`;
  }
  const width = Math.min(ctx.measureText(text).width, maxWidth);
  const grad = ctx.createLinearGradient(cx - width / 2, y - px, cx + width / 2, y);
  const stops = grade.titleStops;
  stops.forEach((color, i) => grad.addColorStop(i / (stops.length - 1), color));
  ctx.fillStyle = grad;
  ctx.fillText(text, cx, y);
  ctx.globalCompositeOperation = 'source-atop';
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  const stripeH = Math.max(2, px * 0.045);
  for (let sy = y - px; sy < y + px * 0.1; sy += stripeH * 2.6) {
    ctx.fillRect(cx - width / 2, sy, width, stripeH);
  }
  ctx.restore();
  return px;
}

function drawStars(ctx, cx, cy, starR, count, lit, grade) {
  const gap = starR * 2.35;
  const total = gap * (count - 1);
  for (let i = 0; i < count; i++) {
    const x = cx - total / 2 + i * gap;
    starPath(ctx, x, cy, starR, starR * 0.45);
    ctx.fillStyle = i < lit ? grade.star : 'rgba(255,255,255,0.22)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = Math.max(1, starR * 0.08);
    ctx.stroke();
  }
}

/** Circular stamp: the studio name around a star. */
function drawSeal(ctx, cx, cy, r, grade) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = grade.rule;
  ctx.lineWidth = Math.max(2, r * 0.06);
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = grade.rule;
  ctx.font = `bold ${Math.max(9, r * 0.16)}px "${TAG_FONT}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = 'VICE PANEL STUDIO • EST. 2026 • ';
  const step = (Math.PI * 2) / label.length;
  for (let i = 0; i < label.length; i++) {
    const a = -Math.PI / 2 + i * step;
    ctx.save();
    ctx.rotate(a);
    ctx.translate(0, -r * 0.89);
    ctx.fillText(label[i], 0, 0);
    ctx.restore();
  }
  starPath(ctx, 0, 0, r * 0.34, r * 0.15);
  ctx.fillStyle = grade.star;
  ctx.fill();
  ctx.restore();
}

/** The whole cover, drawn at a post size. Returns the canvas. */
export async function drawCover(canvas, state, sizeId) {
  const size = sizeById(sizeId ?? state.size);
  const w = size.w;
  const h = size.h;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  const grade = gradeById(state.grade);
  const layout = layoutById(state.layout);
  await ensureAssets(state);
  const photos = await Promise.all(
    layout.rects.map((_, i) => loadPhoto(photoSrc(state.panels[i] ?? state.panels[0])).catch(() => null)),
  );

  // Backdrop.
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, '#17101f');
  bg.addColorStop(1, '#0a0a12');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Panels (hero last when it pops out, so it lands on top).
  const order = layout.rects.map((_, i) => i);
  if (layout.popout) {
    order.splice(order.indexOf(layout.hero), 1);
    order.push(layout.hero);
  }
  for (const i of order) {
    const rect = layout.rects[i];
    const panel = state.panels[i] ?? state.panels[0];
    const img = photos[i];
    if (!img) continue;
    if (i === layout.hero && layout.popout) {
      drawPopoutHero(ctx, img, rect, panel, grade, w, h);
      continue;
    }
    ctx.save();
    if (rect.rot) {
      ctx.translate((rect.x + rect.w / 2) * w, (rect.y + rect.h / 2) * h);
      ctx.rotate((rect.rot * Math.PI) / 180);
      ctx.translate(-((rect.x + rect.w / 2) * w), -((rect.y + rect.h / 2) * h));
    }
    drawPanelPhoto(ctx, img, rect, panel, grade, w, h);
    ctx.restore();
  }

  // Caption band.
  const cap = layout.caption;
  const band = ctx.createLinearGradient(0, cap.y * h, 0, (cap.y + cap.h) * h);
  band.addColorStop(0, 'rgba(5,5,12,0)');
  band.addColorStop(0.35, 'rgba(5,5,12,0.88)');
  band.addColorStop(1, 'rgba(5,5,12,0.96)');
  ctx.fillStyle = band;
  ctx.fillRect(0, cap.y * h, w, cap.h * h);

  const cx = w / 2;
  const bandTop = cap.y * h;
  const bandH = cap.h * h;

  // Callout chips along the top edge, over the panels.
  if (state.callouts.length > 0) {
    ctx.font = `bold ${Math.round(h * 0.016)}px "${TAG_FONT}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let chipX = w * 0.03;
    const chipY = h * 0.015;
    ctx.textAlign = 'left';
    for (const callout of state.callouts) {
      const pad = h * 0.008;
      const textW = ctx.measureText(callout).width;
      const chipH = h * 0.032;
      roundRect(ctx, chipX, chipY, textW + pad * 2, chipH, chipH / 2);
      ctx.fillStyle = grade.chip;
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(callout, chipX + pad, chipY + chipH / 2 + 1);
      chipX += textW + pad * 2 + w * 0.012;
    }
  }

  // Striped retro-chrome title.
  const titlePx = Math.round(h * 0.085);
  drawChromeTitle(ctx, state.title, cx, bandTop + bandH * 0.46, w * 0.92, titlePx, grade);

  // Neon subtitle.
  ctx.save();
  ctx.font = `${Math.round(h * 0.026)}px "${NEON_FONT}", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.shadowColor = grade.subtitle;
  ctx.shadowBlur = h * 0.012;
  ctx.fillStyle = grade.subtitle;
  ctx.fillText(state.subtitle, cx, bandTop + bandH * 0.6);
  ctx.restore();

  // Caption line as a centered tagline under the subtitle — never under the
  // stars pill, where it used to collide with it.
  if (state.caption) {
    ctx.font = `italic ${Math.round(h * 0.015)}px Georgia, serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.fillText(state.caption, cx, bandTop + bandH * 0.72);
  }

  // Gold rule under the caption.
  ctx.strokeStyle = grade.rule;
  ctx.lineWidth = Math.max(2, h * 0.003);
  ctx.beginPath();
  ctx.moveTo(w * 0.08, bandTop + bandH * 0.8);
  ctx.lineTo(w * 0.92, bandTop + bandH * 0.8);
  ctx.stroke();

  // Heat stars in a gold-rim pill, left of the rule.
  const pillW = w * 0.2;
  const pillH = bandH * 0.14;
  const pillX = w * 0.05;
  const pillY = bandTop + bandH * 0.84;
  roundRect(ctx, pillX, pillY, pillW, pillH, pillH / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fill();
  ctx.strokeStyle = grade.rule;
  ctx.lineWidth = Math.max(1.5, h * 0.0016);
  ctx.stroke();
  drawStars(ctx, pillX + pillW / 2, pillY + pillH / 2, pillH * 0.3, 5, state.heat, grade);

  // Cast role tags, right of the stars.
  ctx.font = `${Math.round(h * 0.017)}px "${TAG_FONT}", sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  let tagX = pillX + pillW + w * 0.02;
  for (const tag of state.cast.slice(0, 3)) {
    const label = `${tag.name} · ${tag.role}`;
    const pad = h * 0.007;
    const textW = ctx.measureText(label).width;
    const tagH = bandH * 0.14;
    const tagY = bandTop + bandH * 0.84;
    roundRect(ctx, tagX, tagY, textW + pad * 2, tagH, tagH / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, tagX + pad, tagY + tagH / 2 + 1);
    tagX += textW + pad * 2 + w * 0.012;
  }

  // Seal stamp, bottom right.
  if (state.seal) {
    drawSeal(ctx, w * 0.93, bandTop + bandH * 0.42, Math.min(w, h) * 0.058, grade);
  }

  // Grain, then vignette.
  const rand = mulberry32(hashSeed(state.title + state.layout + state.grade));
  const dots = Math.floor(w * h * grade.grain * 0.00012);
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < dots; i++) {
    const gx = rand() * w;
    const gy = rand() * h;
    ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)';
    ctx.fillRect(gx, gy, Math.max(1, w * 0.0012), Math.max(1, w * 0.0012));
  }
  ctx.restore();
  const vig = ctx.createRadialGradient(cx, h / 2, Math.min(w, h) * 0.45, cx, h / 2, Math.max(w, h) * 0.75);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, `rgba(0,0,0,${grade.vignette})`);
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);

  return canvas;
}

/** Render a cover to a PNG blob at a post size. */
export async function exportPNG(state, sizeId) {
  const canvas = document.createElement('canvas');
  await drawCover(canvas, state, sizeId);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('exportPNG: canvas.toBlob returned nothing'));
    }, 'image/png');
  });
}

// Vice Heat — the cover renderer. Everything the judge sees is drawn
// here, on one canvas: the photo panels, the grade, the giant banded
// title, the script subtitle and every piece of cover furniture.
// Rendering is fully deterministic: no Math.random, no clock, no network
// — the same state always draws the same bytes, so the program's two
// runs agree byte for byte.

import { CAST_BY_ID, visibleCast } from './state.js';

const imageCache = new Map();

// Load an image (sample file or an uploaded object URL) and cache it.
export function loadImage(src) {
  if (imageCache.has(src)) return imageCache.get(src);
  const p = new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('cannot load photo ' + src));
    img.src = src;
  });
  imageCache.set(src, p);
  return p;
}

// Load every photo a state references (samples + uploads).
export async function loadStateImages(state) {
  const srcs = [...new Set(state.panels.map((p) => CAST_BY_ID[p.castId]?.file).filter(Boolean))];
  const loaded = await Promise.all(srcs.map((s) => loadImage(s).catch(() => null)));
  const bySrc = new Map();
  srcs.forEach((s, i) => { if (loaded[i]) bySrc.set(s, loaded[i]); });
  return bySrc;
}

// Cover-fit draw: fill rect with the image, cropped, panned and zoomed.
// pan.x/pan.y are fractions of the rect (-0.5..0.5); zoom scales the fit.
function drawCoverPhoto(ctx, img, rx, ry, rw, rh, pan, zoom) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const base = Math.max(rw / iw, rh / ih) * (zoom || 1);
  const dw = iw * base, dh = ih * base;
  const dx = rx + (rw - dw) / 2 + (pan?.x || 0) * rw;
  const dy = ry + (rh - dh) / 2 + (pan?.y || 0) * rh;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function fitFont(ctx, text, maxWidth, startPx, family, weight = '') {
  let px = startPx;
  while (px > 12) {
    ctx.font = `${weight} ${px}px ${family}`;
    if (ctx.measureText(text).width <= maxWidth) return px;
    px -= 2;
  }
  return px;
}

// A five-pointed star path, centred at (cx, cy) with outer radius r.
function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(a) * rad, y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawStars(ctx, cx, cy, count, r, gap) {
  const total = count * (2 * r + gap) - gap;
  let x = cx - total / 2 + r;
  for (let i = 0; i < count; i++) {
    starPath(ctx, x, cy, r);
    ctx.fillStyle = '#ffd23e';
    ctx.strokeStyle = '#7a5b00';
    ctx.lineWidth = Math.max(1, r * 0.12);
    ctx.fill();
    ctx.stroke();
    x += 2 * r + gap;
  }
}

// Deterministic pseudo-random bars for the barcode (fixed seed, so both
// program runs draw the same barcode).
function barcodeBars(seed, n) {
  let s = seed;
  const out = [];
  for (let i = 0; i < n; i++) {
    s = (s * 1103515245 + 12345) % 2147483648;
    out.push(1 + (s % 4));
  }
  return out;
}

function bandedGradient(ctx, x0, y0, x1, y1, stops) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  for (const [stop, color] of stops) g.addColorStop(stop, color);
  return g;
}

// Draw one photo panel: photo, grade filter, white frame, role tag.
function drawPanel(ctx, img, rect, panel, grade, W, H, cast) {
  const rx = rect.x * W, ry = rect.y * H, rw = rect.w * W, rh = rect.h * H;
  ctx.save();
  if (rect.tilt) {
    ctx.translate(rx + rw / 2, ry + rh / 2);
    ctx.rotate((rect.tilt * Math.PI) / 180);
    ctx.translate(-(rx + rw / 2), -(ry + rh / 2));
  }
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = W * 0.012;
  ctx.shadowOffsetY = W * 0.004;
  ctx.fillStyle = '#fff';
  ctx.fillRect(rx - W * 0.004, ry - W * 0.004, rw + W * 0.008, rh + W * 0.008);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  if (img) {
    ctx.filter = grade.filter;
    drawCoverPhoto(ctx, img, rx, ry, rw, rh, panel, panel.zoom);
    ctx.filter = 'none';
  } else {
    ctx.fillStyle = '#3a2b4a';
    ctx.fillRect(rx, ry, rw, rh);
  }
  // Role tag: black pill, gold slash, role in Anton. On a full-bleed
  // panel the tag rides at the top, or the billing block would cover it.
  if (cast) {
    const tagH = Math.max(18, W * 0.024);
    const fullBleed = rect.y === 0 && rect.h >= 0.99;
    const tagY = fullBleed ? ry + W * 0.008 : ry + rh - tagH - W * 0.008;
    ctx.font = `${Math.round(tagH * 0.52)}px Anton, sans-serif`;
    const tw = ctx.measureText(cast.role).width + tagH * 1.1;
    const tagW = Math.min(tw, rw - W * 0.016);
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    ctx.beginPath();
    ctx.roundRect(rx + W * 0.008, tagY, tagW, tagH, tagH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffd23e';
    ctx.fillRect(rx + W * 0.008 + tagH * 0.28, tagY + tagH * 0.22, 3, tagH * 0.56);
    ctx.fillStyle = '#fff';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText(cast.role, rx + W * 0.008 + tagH * 0.62, tagY + tagH / 2 + 1);
  }
  ctx.restore();
}

// The giant title: banded sunset gradient, black outline, hard shadow.
function drawTitle(ctx, state, zone, W, H, grade) {
  const zx = zone.x * W, zy = zone.y * H, zw = zone.w * W, zh = zone.h * H;
  if (zone.boxed) {
    ctx.fillStyle = 'rgba(10,6,18,0.92)';
    ctx.fillRect(zx, zy, zw, zh);
    ctx.strokeStyle = '#ffd23e';
    ctx.lineWidth = Math.max(2, W * 0.003);
    ctx.strokeRect(zx + 2, zy + 2, zw - 4, zh - 4);
  }
  const titlePx = fitFont(ctx, state.title, zw * 0.96, zh * 0.62, 'Anton, sans-serif');
  const cx = zx + zw / 2;
  const cy = zy + zh * 0.44;
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${titlePx}px Anton, sans-serif`;
  ctx.shadowColor = 'rgba(0,0,0,0.75)';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetX = W * 0.006;
  ctx.shadowOffsetY = W * 0.006;
  ctx.fillStyle = bandedGradient(ctx, 0, cy - titlePx * 0.55, 0, cy + titlePx * 0.55, grade.title);
  ctx.fillText(state.title, cx, cy);
  ctx.shadowColor = 'transparent';
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;
  ctx.lineWidth = Math.max(2, titlePx * 0.045);
  ctx.strokeStyle = '#14060f';
  ctx.strokeText(state.title, cx, cy);
  ctx.restore();
  // Script subtitle in Pacifico, glowing pink, under the title.
  const subPx = fitFont(ctx, state.subtitle, zw * 0.9, zh * 0.30, 'Pacifico, cursive');
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${subPx}px Pacifico, cursive`;
  ctx.shadowColor = '#ff2e88';
  ctx.shadowBlur = W * 0.014;
  ctx.fillStyle = '#ffe3f1';
  ctx.fillText(state.subtitle, cx, zy + zh * 0.82);
  ctx.restore();
}

// All the furniture: top bar, seal, rating box, billing, platforms,
// barcode, heat meter and tagline strip.
function drawFurniture(ctx, state, layout, W, H, grade, castOnCover) {
  if (!state.showFurniture) return;
  const topH = W * 0.032;
  // Top bar: five stars, quote, VOL. 1.
  ctx.fillStyle = 'rgba(10,6,18,0.94)';
  ctx.fillRect(0, 0, W, topH);
  drawStars(ctx, W * 0.055, topH / 2, 5, W * 0.008, W * 0.004);
  ctx.fillStyle = '#ffd23e';
  ctx.font = `${Math.round(topH * 0.42)}px Anton, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.quote, W * 0.115, topH / 2 + 1);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#ffd23e';
  ctx.lineWidth = 2;
  ctx.strokeRect(W - W * 0.075, topH * 0.14, W * 0.062, topH * 0.72);
  ctx.fillText('VOL. 1', W - W * 0.02, topH / 2 + 1);

  // Tagline strip above the billing block.
  const stripH = W * 0.026;
  const stripY = H - stripH - W * 0.052;
  ctx.fillStyle = '#ff2e88';
  ctx.fillRect(0, stripY, W, stripH);
  ctx.fillStyle = '#fff';
  ctx.font = `${Math.round(stripH * 0.52)}px Anton, sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(state.tagline, W / 2, stripY + stripH / 2 + 1);

  // Billing block: names only the cast actually on this cover.
  if (state.showBilling && castOnCover.length) {
    const names = castOnCover.map((c) => c.name).join('  ·  ');
    ctx.fillStyle = 'rgba(10,6,18,0.94)';
    ctx.fillRect(0, stripY + stripH, W, W * 0.052);
    ctx.fillStyle = '#e8e0c8';
    ctx.font = `${Math.round(W * 0.011)}px Anton, sans-serif`;
    ctx.fillText('A LEONIDA PICTURES PRODUCTION  ·  STARRING  ' + names, W / 2, stripY + stripH + W * 0.020);
    ctx.fillStyle = '#9a8f7a';
    ctx.font = `${Math.round(W * 0.0095)}px Anton, sans-serif`;
    ctx.fillText('DIRECTED BY R. VALENTINE  ·  MUSIC BY THE NIGHT SHIFT ORCHESTRA  ·  SHOT ON YOUR OWN CAMERA', W / 2, stripY + stripH + W * 0.038);
  }

  // Gold roundel seal, bottom-right above the billing block. Sizes use
  // the short side, so on a wide poster the seal stays small and does
  // not eat a face.
  const S = Math.min(W, H);
  if (state.showSeal) {
    const r = S * 0.042;
    const cx = W - r - W * 0.02, cy = stripY - r - W * 0.012;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffd23e';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#7a5b00';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.78, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#14060f';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(r * 0.34)}px Anton, sans-serif`;
    ctx.fillText('BEST', cx, cy - r * 0.18);
    ctx.fillText('CAST', cx, cy + r * 0.20);
    ctx.font = `${Math.round(r * 0.20)}px Anton, sans-serif`;
    ctx.fillText('★ EST. 2026 ★', cx, cy + r * 0.52);
    ctx.restore();
  }

  // 18+ Leonida rating box, bottom-left (short-side sized, same reason).
  if (state.showRating) {
    const bw = S * 0.075, bh = S * 0.075;
    const bx = W * 0.02, by = stripY - bh - W * 0.012;
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#14060f';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#14060f';
    ctx.textAlign = 'center';
    ctx.font = `${Math.round(bh * 0.52)}px Anton, sans-serif`;
    ctx.fillText('18+', bx + bw / 2, by + bh * 0.42);
    ctx.font = `${Math.round(bh * 0.16)}px Anton, sans-serif`;
    ctx.fillText('LEONIDA', bx + bw / 2, by + bh * 0.78);
  }

  // Platform pills, bottom centre-left above the billing block.
  if (state.showPlatforms) {
    const pills = ['PS5', 'XBOX', 'PC'];
    ctx.font = `${Math.round(S * 0.012)}px Anton, sans-serif`;
    let px = W * 0.115;
    const py = stripY - S * 0.032;
    for (const pill of pills) {
      const pw = ctx.measureText(pill).width + S * 0.02;
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(px, py, pw, S * 0.022, S * 0.011);
      ctx.fill();
      ctx.fillStyle = '#14060f';
      ctx.textAlign = 'center';
      ctx.fillText(pill, px + pw / 2, py + S * 0.011 + 1);
      px += pw + S * 0.008;
    }
  }

  // Barcode, bottom-right corner of the billing area.
  if (state.showBarcode) {
    const bars = barcodeBars(20261120, 34);
    let bx = W - W * 0.092;
    const by = stripY + stripH + W * 0.006;
    const bh = W * 0.034;
    ctx.fillStyle = '#fff';
    ctx.fillRect(bx - W * 0.004, by - W * 0.003, W * 0.088, bh + W * 0.014);
    ctx.fillStyle = '#14060f';
    for (const wdt of bars) {
      const bw = (wdt / 4) * (W * 0.0016);
      ctx.fillRect(bx, by, bw, bh);
      bx += bw + W * 0.0011;
    }
    ctx.font = `${Math.round(W * 0.0075)}px monospace`;
    ctx.textAlign = 'center';
    ctx.fillText('0 10472 85991 8', W - W * 0.041, by + bh + W * 0.008);
  }

  // Heat meter: five stars + label, top-right under the top bar.
  ctx.save();
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(0,0,0,0.72)';
  const hmW = W * 0.17, hmH = W * 0.032;
  ctx.beginPath();
  ctx.roundRect(W - hmW - W * 0.015, topH + W * 0.01, hmW, hmH, hmH / 2);
  ctx.fill();
  drawStars(ctx, W - hmW + W * 0.008, topH + W * 0.01 + hmH / 2, state.heat, W * 0.008, W * 0.003);
  ctx.fillStyle = '#ffd23e';
  ctx.font = `${Math.round(hmH * 0.42)}px Anton, sans-serif`;
  ctx.fillText('HEAT ' + state.heat + '/5', W - W * 0.062, topH + W * 0.01 + hmH / 2 + 1);
  ctx.restore();
}

// Render the whole cover into ctx at pixel size W×H.
export function renderCover(ctx, W, H, state, layout, grade, images) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#14060f';
  ctx.fillRect(0, 0, W, H);
  // Panels first, in layout order (hero last so it overlaps the frame).
  const order = layout.panels.map((_, i) => i);
  if (layout.hero >= 0) {
    order.splice(order.indexOf(layout.hero), 1);
    order.push(layout.hero);
  }
  for (const i of order) {
    const rect = layout.panels[i];
    const panel = state.panels[i] || { castId: null, x: 0, y: 0, zoom: 1 };
    const cast = panel.castId ? CAST_BY_ID[panel.castId] : null;
    const img = cast ? images.get(cast.file) || null : null;
    drawPanel(ctx, img, rect, panel, grade, W, H, cast);
  }
  // Grade tint + vignette over everything.
  const tint = ctx.createLinearGradient(0, 0, 0, H);
  tint.addColorStop(0, grade.tint.top);
  tint.addColorStop(1, grade.tint.bottom);
  ctx.fillStyle = tint;
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, `rgba(0,0,0,${grade.vignette})`);
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, H);
  // Title block (under the furniture top bar, above the tagline strip).
  drawTitle(ctx, state, layout.title, W, H, grade);
  drawFurniture(ctx, state, layout, W, H, grade, visibleCast(state, layout));
}

// Render into a fresh canvas at a post size; returns the canvas.
export function renderToCanvas(state, layout, grade, images, w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  renderCover(ctx, w, h, state, layout, grade, images);
  return canvas;
}

// Export the cover as a PNG blob at one of the three post sizes.
export async function exportCoverPNG(state, layout, grade, images, size) {
  const canvas = renderToCanvas(state, layout, grade, images, size.w, size.h);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed'))), 'image/png');
  });
}

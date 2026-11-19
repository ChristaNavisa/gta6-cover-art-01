// Cover renderer for Neon Coast Cover Studio.
// Draws the whole poster onto a canvas: panel photos with per-panel crop,
// a gradient-map colour grade, poster ink, lettering (Anton title + Pacifico
// script subtitle), badge ribbon, heat meter, halftone, grain and vignette.
// Pure canvas 2D — no libraries, no network.

import { gradeById, buildGradeLut } from "./grades.js";
import { layoutById, panelRects } from "./layouts.js";

export const SIZES = {
  "1080x1080": [1080, 1080],
  "1080x1350": [1080, 1350],
  "1920x1080": [1920, 1080],
  "1080x1920": [1080, 1920],
};

const DARK = "#140a20";
let noiseTile = null;

function getNoiseTile() {
  if (noiseTile) return noiseTile;
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const g = c.getContext("2d");
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 100 + Math.floor(Math.random() * 155);
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  noiseTile = c;
  return c;
}

// Cover-fit a photo into a panel rect, honouring the panel's zoom and pan.
export function drawPhotoIntoPanel(ctx, photo, rect, transform) {
  if (!photo || !photo.img || !photo.img.naturalWidth) {
    drawEmptyPanel(ctx, rect);
    return;
  }
  const img = photo.img;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const scale = base * (transform.zoom || 1);
  const dw = img.naturalWidth * scale;
  const dh = img.naturalHeight * scale;
  const dx = rect.x + (rect.w - dw) / 2 + (transform.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (transform.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawEmptyPanel(ctx, rect) {
  const g = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.w, rect.y + rect.h);
  g.addColorStop(0, "#3a1c58");
  g.addColorStop(1, "#1a0b28");
  ctx.fillStyle = g;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `700 ${Math.max(13, rect.w * 0.035)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("＋ ADD A PHOTO", rect.x + rect.w / 2, rect.y + rect.h / 2);
}

// Remap the art canvas through the grade's gradient map.
function applyGradeLut(art, grade) {
  const ctx = art.getContext("2d");
  const img = ctx.getImageData(0, 0, art.width, art.height);
  const lut = buildGradeLut(grade);
  const d = img.data;
  const s = grade.strength;
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
    d[i] = Math.round(d[i] + (lut[lum * 3] - d[i]) * s);
    d[i + 1] = Math.round(d[i + 1] + (lut[lum * 3 + 1] - d[i + 1]) * s);
    d[i + 2] = Math.round(d[i + 2] + (lut[lum * 3 + 2] - d[i + 2]) * s);
  }
  ctx.putImageData(img, 0, 0);
}

// Poster ink: band the tones into flat poster steps.
function applyPosterInk(art) {
  const ctx = art.getContext("2d");
  const img = ctx.getImageData(0, 0, art.width, art.height);
  const d = img.data;
  const steps = [0, 72, 138, 198, 255];
  for (let i = 0; i < d.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      const v = d[i + c];
      let best = steps[0];
      for (const s of steps) if (Math.abs(v - s) < Math.abs(v - best)) best = s;
      d[i + c] = best;
    }
  }
  ctx.putImageData(img, 0, 0);
}

function fitFont(ctx, text, maxWidth, startPx, family, weight = "") {
  let px = startPx;
  const set = () => {
    ctx.font = `${weight} ${px}px ${family}`;
  };
  set();
  while (px > 12 && ctx.measureText(text).width > maxWidth) {
    px -= 2;
    set();
  }
  return px;
}

function drawHalftoneBand(ctx, x, y, w, h, color) {
  const gap = Math.max(7, w * 0.012);
  const r = gap * 0.32;
  ctx.fillStyle = color;
  for (let yy = y + gap / 2; yy < y + h; yy += gap) {
    for (let xx = x + gap / 2; xx < x + w; xx += gap) {
      ctx.beginPath();
      ctx.arc(xx, yy, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTitleBlock(ctx, state, W, H) {
  const bandH = H * 0.19;
  const bandY = H - bandH;
  const pad = W * 0.045;

  // Gradient band so lettering reads over any photo.
  const band = ctx.createLinearGradient(0, bandY - bandH * 0.55, 0, H);
  band.addColorStop(0, "rgba(10,4,18,0)");
  band.addColorStop(0.45, "rgba(10,4,18,0.82)");
  band.addColorStop(1, "rgba(10,4,18,0.96)");
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY - bandH * 0.55, W, bandH * 1.55);

  if (state.halftone) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    drawHalftoneBand(ctx, pad, bandY + bandH * 0.06, W * 0.5, bandH * 0.32, "rgba(255,46,136,0.55)");
    ctx.restore();
  }

  const title = (state.title || "NEON COAST").toUpperCase();
  const maxTitleW = W - pad * 2;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";

  const titlePx = fitFont(ctx, title, maxTitleW, H * 0.105, '"Anton", sans-serif');
  const titleY = H - bandH * 0.32;
  const stroke = Math.max(2, H * 0.006);

  ctx.save();
  if (state.titleStyle === "sunset") {
    const g = ctx.createLinearGradient(pad, titleY - titlePx, W - pad, titleY);
    g.addColorStop(0, "#ff2e88");
    g.addColorStop(0.5, "#ff7a18");
    g.addColorStop(1, "#ffc93c");
    ctx.fillStyle = g;
  } else if (state.titleStyle === "neon") {
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ff2e88";
    ctx.shadowBlur = H * 0.02;
  } else {
    ctx.fillStyle = "#ffffff";
  }
  ctx.shadowColor = state.titleStyle === "neon" ? "#ff2e88" : "rgba(0,0,0,0.85)";
  ctx.shadowBlur = state.titleStyle === "neon" ? H * 0.02 : 0;
  ctx.shadowOffsetY = state.titleStyle === "neon" ? 0 : H * 0.008;
  ctx.lineWidth = stroke;
  ctx.strokeStyle = "#0a0412";
  ctx.lineJoin = "round";
  ctx.strokeText(title, pad, titleY);
  ctx.fillText(title, pad, titleY);
  ctx.restore();

  // Script subtitle in neon Pacifico, tucked under the title.
  const subtitle = state.subtitle || "";
  if (subtitle) {
    const subPx = fitFont(ctx, subtitle, maxTitleW * 0.62, H * 0.042, '"Pacifico", cursive');
    ctx.save();
    ctx.font = `${subPx}px "Pacifico", cursive`;
    ctx.fillStyle = "#19e3d6";
    ctx.shadowColor = "#ff2e88";
    ctx.shadowBlur = H * 0.012;
    ctx.fillText(subtitle, pad + W * 0.005, H - bandH * 0.07);
    ctx.restore();
  }

  // Heat meter, bottom right of the band.
  if (state.heat > 0) {
    const stars = "★".repeat(state.heat) + "☆".repeat(5 - state.heat);
    ctx.save();
    ctx.font = `${Math.round(H * 0.028)}px "Bebas Neue", sans-serif`;
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffc93c";
    ctx.fillText(`HEAT ${stars}`, W - pad, H - bandH * 0.07);
    ctx.restore();
  }
}

function drawBadgeRibbon(ctx, state, W, H) {
  const text = (state.badge || "").trim();
  if (!text) return;
  ctx.save();
  ctx.font = `${Math.round(H * 0.026)}px "Bebas Neue", sans-serif`;
  const tw = ctx.measureText(text).width;
  const bw = tw + W * 0.05;
  const bh = H * 0.042;
  ctx.translate(W, 0);
  ctx.rotate(Math.PI / 4);
  const y = W * 0.16;
  ctx.fillStyle = "#ff2e88";
  ctx.fillRect(-bw / 2, y, bw, bh);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), 0, y + bh / 2 + 1);
  ctx.restore();
}

function drawGrain(ctx, W, H, amount) {
  const tile = getNoiseTile();
  const pattern = ctx.createPattern(tile, "repeat");
  ctx.save();
  ctx.globalAlpha = 0.09 * amount;
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

function drawVignette(ctx, W, H) {
  const g = ctx.createRadialGradient(
    W / 2, H / 2, Math.min(W, H) * 0.42,
    W / 2, H / 2, Math.max(W, H) * 0.75,
  );
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(5,0,12,0.5)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

// Render the full cover onto `canvas` at the state's export size.
export function renderCover(canvas, state, photos) {
  const [W, H] = SIZES[state.size] || SIZES["1080x1080"];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const layout = layoutById(state.layout);
  const grade = gradeById(state.grade);

  // 1. Panels onto an offscreen art canvas, so the grade hits photos only.
  const art = document.createElement("canvas");
  art.width = W;
  art.height = H;
  const actx = art.getContext("2d");
  actx.fillStyle = DARK;
  actx.fillRect(0, 0, W, H);
  const rects = panelRects(layout, W, H);
  rects.forEach((r, i) => {
    const panel = state.panels[i] || { photo: -1, zoom: 1, ox: 0, oy: 0 };
    const photo = panel.photo >= 0 ? photos[panel.photo] : null;
    actx.save();
    if (r.rot) {
      actx.translate(r.x + r.w / 2, r.y + r.h / 2);
      actx.rotate((r.rot * Math.PI) / 180);
      actx.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
    }
    if (layout.id === "tilted" && i > 0) {
      // Polaroid-style white border + drop shadow for the snapshots.
      actx.shadowColor = "rgba(0,0,0,0.6)";
      actx.shadowBlur = W * 0.02;
      actx.shadowOffsetY = H * 0.01;
      actx.fillStyle = "#fdf8ef";
      actx.fillRect(r.x - W * 0.012, r.y - H * 0.012, r.w + W * 0.024, r.h + H * 0.03);
      actx.shadowColor = "transparent";
      actx.shadowBlur = 0;
      actx.shadowOffsetY = 0;
    }
    drawPhotoIntoPanel(actx, photo, r, panel);
    // Crisp panel edge, inside the same transform so tilted panels match.
    actx.save();
    actx.strokeStyle = "rgba(10,4,18,0.9)";
    actx.lineWidth = Math.max(2, W * 0.004);
    actx.strokeRect(r.x, r.y, r.w, r.h);
    actx.restore();
    actx.restore();
  });

  // 2. Grade + poster ink on the art only.
  applyGradeLut(art, grade);
  if (state.ink) applyPosterInk(art);

  // 3. Composite art, washes, lettering and finish.
  ctx.drawImage(art, 0, 0);
  ctx.fillStyle = grade.wash;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W * 0.5, H * 0.12, 0, W * 0.5, H * 0.12, W * 0.7);
  glow.addColorStop(0, grade.glow);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  drawTitleBlock(ctx, state, W, H);
  drawBadgeRibbon(ctx, state, W, H);

  if (state.frame) {
    ctx.strokeStyle = "rgba(255,255,255,0.9)";
    ctx.lineWidth = Math.max(3, W * 0.006);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  }
  if (state.vignette) drawVignette(ctx, W, H);
  if (state.grain) drawGrain(ctx, W, H, 1);
  return canvas;
}

// Highlight the selected panel on the preview canvas (editor only).
export function highlightSelectedPanel(canvas, state) {
  const ctx = canvas.getContext("2d");
  const [W, H] = SIZES[state.size] || SIZES["1080x1080"];
  const layout = layoutById(state.layout);
  const rects = panelRects(layout, W, H);
  const r = rects[state.selectedPanel];
  if (!r) return;
  ctx.save();
  ctx.strokeStyle = "#19e3d6";
  ctx.lineWidth = Math.max(4, W * 0.006);
  ctx.setLineDash([W * 0.02, W * 0.012]);
  ctx.strokeRect(r.x, r.y, r.w, r.h);
  ctx.setLineDash([]);
  ctx.fillStyle = "#19e3d6";
  ctx.font = `700 ${Math.round(H * 0.02)}px system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  const label = `PANEL ${state.selectedPanel + 1} · ${layout.panelNames[state.selectedPanel] || ""}`;
  const tw = ctx.measureText(label).width;
  ctx.fillRect(r.x, r.y, tw + 18, H * 0.032);
  ctx.fillStyle = "#06231f";
  ctx.fillText(label, r.x + 9, r.y + H * 0.005);
  ctx.restore();
}

// Which panel contains the point (in canvas pixels), or -1.
export function panelAtPoint(state, px, py) {
  const [W, H] = SIZES[state.size] || SIZES["1080x1080"];
  const layout = layoutById(state.layout);
  const rects = panelRects(layout, W, H);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h) return i;
  }
  return -1;
}

// Vice Panel Studio: the editor.
// Wires the cover engine (layouts, grades, render) to the page: photo slots
// with drag-to-pan and zoom, caption editing, layout / grade / size picking,
// undo and redo, PNG export in the three common post sizes, and a ?shot=
// mode that draws one finished cover full-frame for screenshots. Photos are
// read on this machine only and never uploaded anywhere.

import { LAYOUTS, layoutById, panelRects } from './layouts.js';
import { GRADES, gradeById } from './grades.js';
import { drawCover, exportCoverPNG } from './render.js';

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};
export const SIZE_LABELS = {
  '1080x1080': 'Square 1080 x 1080',
  '1080x1350': 'Portrait 1080 x 1350',
  '1920x1080': 'Landscape 1920 x 1080',
};

const SAMPLE_PHOTOS = ['samples/boulevard.jpg', 'samples/pier.jpg'];

// The photo registry: state panels hold a photo id, never image data, so
// undo history stays tiny. 'sample:*' ids are the bundled photos;
// 'upload:*' ids are data URLs the maker loaded from their own machine.
const registry = new Map();
let uploadCount = 0;

function registerPhoto(id, src) {
  if (!registry.has(id)) registry.set(id, { src, img: null, promise: null });
  return id;
}

function loadPhoto(id) {
  const entry = registry.get(id);
  if (!entry) return Promise.resolve(null);
  if (entry.img) return Promise.resolve(entry.img);
  if (!entry.promise) {
    entry.promise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        entry.img = img;
        resolve(img);
      };
      img.onerror = () => resolve(null);
      img.src = entry.src;
    });
  }
  return entry.promise;
}

function defaultPanels() {
  return [0, 1, 2, 3, 4].map((i) => ({
    photoId: registerPhoto(`sample:${i % 2}`, SAMPLE_PHOTOS[i % 2]),
    zoom: 1,
    ox: 0,
    oy: 0,
  }));
}

const state = {
  layoutId: 'grid',
  gradeId: 'sunset',
  sizeId: '1080x1080',
  title: 'NEON SHORE',
  subtitle: 'golden hour in the city',
  heat: 3,
  grain: true,
  vignette: true,
  selected: 0,
  panels: defaultPanels(),
};

// Undo / redo: a stack of serialised states (photo ids only, never pixels).
const past = [];
const future = [];
let historyPaused = false;

function snapshot() {
  return JSON.stringify({
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    sizeId: state.sizeId,
    title: state.title,
    subtitle: state.subtitle,
    heat: state.heat,
    grain: state.grain,
    vignette: state.vignette,
    selected: state.selected,
    panels: state.panels,
  });
}

function restore(json) {
  const s = JSON.parse(json);
  Object.assign(state, s);
  state.panels = s.panels;
}

function pushHistory() {
  if (historyPaused) return;
  past.push(snapshot());
  if (past.length > 40) past.shift();
  future.length = 0;
  syncUndoButtons();
}

function undo() {
  if (!past.length) return;
  future.push(snapshot());
  restore(past.pop());
  syncUndoButtons();
  drawPreview();
}

function redo() {
  if (!future.length) return;
  past.push(snapshot());
  restore(future.pop());
  syncUndoButtons();
  drawPreview();
}

function syncUndoButtons() {
  const u = document.getElementById('undoBtn');
  const r = document.getElementById('redoBtn');
  if (u) u.disabled = past.length === 0;
  if (r) r.disabled = future.length === 0;
}

// Fonts: the three OFL faces bundled under app/fonts. Wait for them before
// any draw that letters the cover, or the title falls back to sans-serif.
let fontsReady = false;
async function ensureFonts() {
  if (fontsReady) return;
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('100px "Bebas Neue"'),
      document.fonts.load('100px Pacifico'),
    ]);
    await document.fonts.ready;
  } catch (e) {
    /* the cover still draws, in fallback faces */
  }
  fontsReady = true;
}

async function currentCover() {
  const panels = await Promise.all(
    state.panels.map(async (p) => ({
      img: await loadPhoto(p.photoId),
      zoom: p.zoom,
      ox: p.ox,
      oy: p.oy,
    })),
  );
  return {
    layoutId: state.layoutId,
    gradeId: state.gradeId,
    title: state.title,
    subtitle: state.subtitle,
    heat: state.heat,
    grain: state.grain,
    vignette: state.vignette,
    panels,
  };
}

const preview = document.getElementById('preview');

async function drawPreview() {
  await ensureFonts();
  const [W, H] = SIZES[state.sizeId];
  const cover = await currentCover();
  if (preview.width !== W) preview.width = W;
  if (preview.height !== H) preview.height = H;
  drawCover(preview.getContext('2d'), cover, W, H);
  syncPanelUI();
}

// --- panel selection, pan and zoom on the preview canvas ---------------

function canvasPoint(ev) {
  const r = preview.getBoundingClientRect();
  return {
    x: ((ev.clientX - r.left) / r.width) * preview.width,
    y: ((ev.clientY - r.top) / r.height) * preview.height,
  };
}

function hitPanel(pt) {
  const [W, H] = SIZES[state.sizeId];
  const rects = panelRects(state.layoutId, W, H);
  for (let i = rects.length - 1; i >= 0; i--) {
    const r = rects[i];
    if (pt.x >= r.x && pt.x < r.x + r.w && pt.y >= r.y && pt.y < r.y + r.h) return i;
  }
  return -1;
}

let drag = null;

preview.addEventListener('pointerdown', (ev) => {
  const pt = canvasPoint(ev);
  const i = hitPanel(pt);
  if (i < 0) return;
  state.selected = i;
  syncPanelUI();
  const [W, H] = SIZES[state.sizeId];
  const rects = panelRects(state.layoutId, W, H);
  drag = { panel: i, startX: pt.x, startY: pt.y, rect: rects[i], moved: false };
  preview.setPointerCapture(ev.pointerId);
});

preview.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const pt = canvasPoint(ev);
  const dx = pt.x - drag.startX;
  const dy = pt.y - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  const p = state.panels[drag.panel];
  p.ox += dx / drag.rect.w;
  p.oy += dy / drag.rect.h;
  drag.startX = pt.x;
  drag.startY = pt.y;
  drawPreview();
});

preview.addEventListener('pointerup', () => {
  if (drag && drag.moved) pushHistory();
  drag = null;
});

preview.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const p = state.panels[state.selected];
  if (!p) return;
  p.zoom = Math.max(1, Math.min(4, p.zoom * Math.exp(-ev.deltaY * 0.0012)));
  drawPreview();
  clearTimeout(preview._zoomTimer);
  preview._zoomTimer = setTimeout(() => pushHistory(), 350);
}, { passive: false });

// --- side panel ---------------------------------------------------------

const $ = (id) => document.getElementById(id);

function syncPanelUI() {
  const layout = layoutById(state.layoutId);
  const grade = gradeById(state.gradeId);
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layoutId);
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.gradeId);
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.sizeId);
  });
  document.querySelectorAll('[data-heat]').forEach((b) => {
    b.classList.toggle('active', Number(b.dataset.heat) === state.heat);
  });
  const layoutBlurb = $('layoutBlurb');
  if (layoutBlurb) layoutBlurb.textContent = `${layout.name} — ${layout.panels} panels. ${layout.blurb}`;
  const gradeBlurb = $('gradeBlurb');
  if (gradeBlurb) gradeBlurb.textContent = `${grade.name} — ${grade.blurb}`;
  const label = $('panelLabel');
  if (label) label.textContent = `Panel ${state.selected + 1} of ${layout.panels}`;
  const zoom = $('zoomRange');
  if (zoom) zoom.value = String(state.panels[state.selected]?.zoom ?? 1);
  const title = $('titleInput');
  if (title && title.value !== state.title) title.value = state.title;
  const sub = $('subtitleInput');
  if (sub && sub.value !== state.subtitle) sub.value = state.subtitle;
  const grain = $('grainToggle');
  if (grain) grain.checked = state.grain;
  const vig = $('vignetteToggle');
  if (vig) vig.checked = state.vignette;
}

function bindControls() {
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.layoutId = b.dataset.layout;
      state.selected = 0;
      drawPreview();
    });
  });
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.gradeId = b.dataset.grade;
      drawPreview();
    });
  });
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.sizeId = b.dataset.size;
      drawPreview();
    });
  });
  document.querySelectorAll('[data-heat]').forEach((b) => {
    b.addEventListener('click', () => {
      pushHistory();
      state.heat = Number(b.dataset.heat);
      drawPreview();
    });
  });
  document.querySelectorAll('[data-slot]').forEach((b) => {
    b.addEventListener('click', () => {
      state.selected = Number(b.dataset.slot);
      syncPanelUI();
    });
  });
  $('titleInput').addEventListener('input', (ev) => {
    state.title = ev.target.value;
    drawPreview();
  });
  $('titleInput').addEventListener('change', () => pushHistory());
  $('subtitleInput').addEventListener('input', (ev) => {
    state.subtitle = ev.target.value;
    drawPreview();
  });
  $('subtitleInput').addEventListener('change', () => pushHistory());
  $('zoomRange').addEventListener('input', (ev) => {
    const p = state.panels[state.selected];
    if (p) p.zoom = Number(ev.target.value);
    drawPreview();
  });
  $('zoomRange').addEventListener('change', () => pushHistory());
  $('grainToggle').addEventListener('change', (ev) => {
    pushHistory();
    state.grain = ev.target.checked;
    drawPreview();
  });
  $('vignetteToggle').addEventListener('change', (ev) => {
    pushHistory();
    state.vignette = ev.target.checked;
    drawPreview();
  });
  $('undoBtn').addEventListener('click', undo);
  $('redoBtn').addEventListener('click', redo);
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z') {
      ev.preventDefault();
      if (ev.shiftKey) redo();
      else undo();
    }
  });
  $('photoInput').addEventListener('change', (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      pushHistory();
      uploadCount += 1;
      const id = registerPhoto(`upload:${uploadCount}`, String(reader.result));
      state.panels[state.selected].photoId = id;
      state.panels[state.selected].zoom = 1;
      state.panels[state.selected].ox = 0;
      state.panels[state.selected].oy = 0;
      drawPreview();
    };
    reader.readAsDataURL(file);
    ev.target.value = '';
  });
  $('loadPhotoBtn').addEventListener('click', () => $('photoInput').click());
  $('fillAllBtn').addEventListener('click', () => {
    pushHistory();
    const src = state.panels[state.selected];
    state.panels.forEach((p) => {
      p.photoId = src.photoId;
      p.zoom = 1;
      p.ox = 0;
      p.oy = 0;
    });
    drawPreview();
  });
  $('sampleBoulevardBtn').addEventListener('click', () => {
    pushHistory();
    state.panels[state.selected].photoId = registerPhoto('sample:0', SAMPLE_PHOTOS[0]);
    state.panels[state.selected].zoom = 1;
    state.panels[state.selected].ox = 0;
    state.panels[state.selected].oy = 0;
    drawPreview();
  });
  $('samplePierBtn').addEventListener('click', () => {
    pushHistory();
    state.panels[state.selected].photoId = registerPhoto('sample:1', SAMPLE_PHOTOS[1]);
    state.panels[state.selected].zoom = 1;
    state.panels[state.selected].ox = 0;
    state.panels[state.selected].oy = 0;
    drawPreview();
  });
  $('exportBtn').addEventListener('click', () => void exportOne(state.sizeId));
  $('exportAllBtn').addEventListener('click', () => void exportAll());
}

// --- export -------------------------------------------------------------

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function exportOne(sizeId) {
  await ensureFonts();
  const [W, H] = SIZES[sizeId];
  const cover = await currentCover();
  const blob = await exportCoverPNG(cover, W, H);
  if (blob) downloadBlob(blob, `vice-panel-${sizeId}.png`);
  return blob;
}

async function exportAll() {
  for (const sizeId of Object.keys(SIZES)) {
    await exportOne(sizeId);
    await new Promise((r) => setTimeout(r, 350));
  }
}

// --- errors, shot mode and self-test ------------------------------------

window.__errors = [];
window.addEventListener('error', (ev) => {
  window.__errors.push(String(ev.message || ev.error || 'error'));
});

function applyParams(params) {
  if (params.has('layout') && layoutById(params.get('layout'))) state.layoutId = params.get('layout');
  if (params.has('grade') && gradeById(params.get('grade'))) state.gradeId = params.get('grade');
  if (params.has('size') && SIZES[params.get('size')]) state.sizeId = params.get('size');
  if (params.has('title')) state.title = params.get('title');
  if (params.has('subtitle')) state.subtitle = params.get('subtitle');
  if (params.has('heat')) state.heat = Math.max(0, Math.min(5, Number(params.get('heat')) || 0));
  if (params.has('grain')) state.grain = params.get('grain') !== '0';
  if (params.has('vignette')) state.vignette = params.get('vignette') !== '0';
}

// In ?shot=cover the page is only the cover, drawn full-frame: the
// screenshot tool captures the exported cover exactly as the app draws it.
async function shotCoverMode(params) {
  document.body.classList.add('shot-mode');
  applyParams(params);
  const [W, H] = SIZES[state.sizeId];
  await drawPreview();
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  preview.style.width = `${Math.round(W * scale)}px`;
  preview.style.height = `${Math.round(H * scale)}px`;
  document.title = window.__errors.length ? `SHOT ERR: ${window.__errors[0]}` : 'SHOT OK';
}

async function selfTest() {
  const out = [];
  try {
    await ensureFonts();
    for (const sizeId of Object.keys(SIZES)) {
      const [W, H] = SIZES[sizeId];
      const cover = await currentCover();
      const blob = await exportCoverPNG(cover, W, H);
      out.push(`${sizeId}=${blob ? blob.size : 0}`);
      if (!blob || blob.size < 10000) throw new Error(`${sizeId} export too small`);
    }
    if (window.__errors.length) throw new Error(window.__errors[0]);
    const line = `SELFTEST OK ${out.join(' ')}`;
    document.title = line;
    const el = document.getElementById('selftest');
    if (el) el.textContent = line;
  } catch (e) {
    const line = `SELFTEST FAIL ${e.message}`;
    document.title = line;
    const el = document.getElementById('selftest');
    if (el) el.textContent = line;
  }
}

window.__coverStudio = { state, exportOne, exportAll, drawPreview, ready: null };

async function boot() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('shot') === 'cover') {
    bindControls();
    syncPanelUI();
    await shotCoverMode(params);
    return;
  }
  bindControls();
  syncPanelUI();
  await drawPreview();
  if (params.get('selftest') === '1') await selfTest();
}

window.__coverStudio.ready = boot();

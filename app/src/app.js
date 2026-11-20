// Vice Panel Studio — UI wiring, photo loading, export and selftest.
// The entry module: it imports the state, layouts and renderer and drives the
// editor page. Photos are read on the machine, never uploaded.
import { blankState, createHistory, panelsForLayout, SAMPLE_PHOTOS } from './state.js';
import { drawCover } from './render.js';

const SIZES = {
  square: { label: '1080 × 1080', w: 1080, h: 1080 },
  portrait: { label: '1080 × 1350', w: 1080, h: 1350 },
  wide: { label: '1920 × 1080', w: 1920, h: 1080 },
};

const params = new URLSearchParams(location.search);
const SHOT_MODE = params.has('shot');
const SELFTEST = params.has('selftest');

const images = new Map();
const history = createHistory(blankState());
let sizeId = 'square';
let selectedPanel = 0;

const $ = (id) => document.getElementById(id);
const preview = $('preview');

// Loads an image by URL into the images map, then re-renders.
function loadImage(src) {
  if (images.has(src)) return Promise.resolve(images.get(src));
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      images.set(src, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`cannot load ${src}`));
    img.src = src;
  });
}

function state() {
  return history.get();
}

function renderPreview() {
  const size = SIZES[sizeId];
  const scale = Math.min(720 / size.w, 520 / size.h);
  preview.width = Math.round(size.w * scale);
  preview.height = Math.round(size.h * scale);
  drawCover(preview, state(), images);
  $('undoBtn').disabled = !history.canUndo();
  $('redoBtn').disabled = !history.canRedo();
  buildPanelList();
}

function commit(next) {
  history.commit(next);
  renderPreview();
}

// Rebuilds the per-panel photo rows in the sidebar.
function buildPanelList() {
  const list = $('panelList');
  list.innerHTML = '';
  state().panels.forEach((panel, i) => {
    const row = document.createElement('div');
    row.className = 'panel-row' + (i === selectedPanel ? ' selected' : '');
    const label = document.createElement('span');
    label.textContent = `Panel ${i + 1}: ${(panel.photo ?? 'empty').split('/').pop()}`;
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load photo';
    loadBtn.onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = () => {
        const file = input.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        loadImage(url).then(() => {
          const next = structuredClone(state());
          next.panels[i] = { photo: url, scale: 1, ox: 0, oy: 0 };
          selectedPanel = i;
          commit(next);
        });
      };
      input.click();
    };
    const fillBtn = document.createElement('button');
    fillBtn.textContent = 'Sample';
    fillBtn.onclick = () => {
      const next = structuredClone(state());
      next.panels[i] = {
        photo: SAMPLE_PHOTOS[i % SAMPLE_PHOTOS.length],
        scale: 1,
        ox: 0,
        oy: 0,
      };
      selectedPanel = i;
      commit(next);
    };
    row.append(label, loadBtn, fillBtn);
    row.onclick = () => {
      selectedPanel = i;
      renderPreview();
    };
    list.append(row);
  });
}

// Renders the cover offscreen at a real post size and returns its PNG blob.
async function exportBlob(size) {
  const canvas = document.createElement('canvas');
  canvas.width = size.w;
  canvas.height = size.h;
  drawCover(canvas, state(), images);
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
}

async function exportSize(sizeIdToExport) {
  const size = SIZES[sizeIdToExport];
  const blob = await exportBlob(size);
  download(blob, `vice-panel-${size.w}x${size.h}.png`);
  return blob;
}

async function exportAll() {
  const out = {};
  for (const id of Object.keys(SIZES)) {
    out[id] = await exportSize(id);
  }
  return out;
}

// Selftest (?selftest=1): exports all three sizes in memory and reports.
async function runSelftest() {
  const results = {};
  for (const [id, size] of Object.entries(SIZES)) {
    const blob = await exportBlob(size);
    results[id] = { w: size.w, h: size.h, bytes: blob.size, ok: blob.size > 10000 };
  }
  const ok = Object.values(results).every((r) => r.ok);
  console.log(`SELFTEST ${ok ? 'OK' : 'FAIL'}`, JSON.stringify(results));
  const el = document.createElement('pre');
  el.id = 'selftest';
  el.textContent = `SELFTEST ${ok ? 'OK' : 'FAIL'} ${JSON.stringify(results)}`;
  document.body.append(el);
  window.__coverStudio.selftest = { ok, results };
  return ok;
}

function bindControls() {
  document.querySelectorAll('[data-layout]').forEach((btn) => {
    btn.onclick = () => {
      const next = structuredClone(state());
      next.layout = btn.dataset.layout;
      next.panels = panelsForLayout({ ...next, layout: btn.dataset.layout });
      commit(next);
      document.querySelectorAll('[data-layout]').forEach((b) => b.classList.toggle('active', b === btn));
    };
  });
  document.querySelectorAll('[data-grade]').forEach((btn) => {
    btn.onclick = () => {
      const next = structuredClone(state());
      next.grade = btn.dataset.grade;
      commit(next);
      document.querySelectorAll('[data-grade]').forEach((b) => b.classList.toggle('active', b === btn));
    };
  });
  document.querySelectorAll('[data-size]').forEach((btn) => {
    btn.onclick = () => {
      sizeId = btn.dataset.size;
      renderPreview();
      document.querySelectorAll('[data-size]').forEach((b) => b.classList.toggle('active', b === btn));
    };
  });
  $('titleInput').addEventListener('input', (e) => {
    const next = structuredClone(state());
    next.title = e.target.value;
    history.commit(next);
    renderPreview();
  });
  $('subtitleInput').addEventListener('input', (e) => {
    const next = structuredClone(state());
    next.subtitle = e.target.value;
    history.commit(next);
    renderPreview();
  });
  $('starsInput').addEventListener('input', (e) => {
    const next = structuredClone(state());
    next.stars = Number(e.target.value);
    $('starsValue').textContent = `${e.target.value} / 5`;
    history.commit(next);
    renderPreview();
  });
  $('zoomInput').addEventListener('input', (e) => {
    const next = structuredClone(state());
    next.panels[selectedPanel].scale = Number(e.target.value) / 100;
    history.commit(next);
    renderPreview();
  });
  $('fillAllBtn').onclick = () => {
    const next = structuredClone(state());
    const photo = state().panels[selectedPanel].photo ?? SAMPLE_PHOTOS[0];
    next.panels = next.panels.map(() => ({ photo, scale: 1, ox: 0, oy: 0 }));
    commit(next);
  };
  $('exportBtn').onclick = () => exportSize(sizeId);
  $('exportAllBtn').onclick = () => exportAll();
  $('undoBtn').onclick = () => {
    if (history.undo()) renderPreview();
  };
  $('redoBtn').onclick = () => {
    if (history.redo()) renderPreview();
  };
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (history.undo()) renderPreview();
    }
    if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
      e.preventDefault();
      if (history.redo()) renderPreview();
    }
  });
  // Drag to pan the selected panel's photo; wheel to zoom it.
  let dragging = null;
  preview.addEventListener('pointerdown', (e) => {
    const rect = preview.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (preview.width / rect.width);
    const y = (e.clientY - rect.top) * (preview.height / rect.height);
    dragging = { x, y, ox: state().panels[selectedPanel].ox, oy: state().panels[selectedPanel].oy };
    preview.setPointerCapture(e.pointerId);
  });
  preview.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const rect = preview.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (preview.width / rect.width);
    const y = (e.clientY - rect.top) * (preview.height / rect.height);
    const next = structuredClone(state());
    next.panels[selectedPanel].ox = dragging.ox + (x - dragging.x);
    next.panels[selectedPanel].oy = dragging.oy + (y - dragging.y);
    history.commit(next);
    renderPreview();
  });
  preview.addEventListener('pointerup', () => {
    dragging = null;
  });
  preview.addEventListener('wheel', (e) => {
    e.preventDefault();
    const next = structuredClone(state());
    const panel = next.panels[selectedPanel];
    panel.scale = Math.min(3, Math.max(0.5, panel.scale * (e.deltaY < 0 ? 1.08 : 0.93)));
    $('zoomInput').value = String(Math.round(panel.scale * 100));
    history.commit(next);
    renderPreview();
  }, { passive: false });
}

// Shot mode (?shot=cover): draw the cover full-frame, no editor chrome.
async function runShotMode() {
  document.body.classList.add('shot');
  const w = Number(params.get('w') ?? 1080);
  const h = Number(params.get('h') ?? 1080);
  if (params.get('layout')) {
    const next = structuredClone(state());
    next.layout = params.get('layout');
    next.panels = panelsForLayout({ ...next, layout: next.layout });
    history.commit(next);
  }
  if (params.get('grade')) {
    const next = structuredClone(state());
    next.grade = params.get('grade');
    history.commit(next);
  }
  preview.width = w;
  preview.height = h;
  preview.style.width = `${w}px`;
  preview.style.height = `${h}px`;
  drawCover(preview, state(), images);
  document.title = 'Vice Panel Studio — cover';
}

async function boot() {
  window.__coverStudio = {
    state,
    history,
    exportSize,
    exportAll,
    runSelftest,
    selftest: null,
    renderPreview,
  };
  try {
    await Promise.all([
      document.fonts.load('16px Anton'),
      document.fonts.load('16px Pacifico'),
      document.fonts.load('16px "Bebas Neue"'),
    ]);
  } catch {
    // Fallback fonts are fine; the cover still renders.
  }
  await Promise.all(SAMPLE_PHOTOS.map((src) => loadImage(src).catch(() => null)));
  if (SHOT_MODE) {
    await runShotMode();
    return;
  }
  bindControls();
  renderPreview();
  if (SELFTEST) await runSelftest();
}

boot();

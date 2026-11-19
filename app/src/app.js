// Vice Panel Studio editor wiring.
//
// The preview canvas IS the cover: every edit redraws it at the selected
// export size. Panels are picked by clicking, panned by dragging, zoomed
// by wheel or slider. Every undoable edit snapshots the state first.
// ?shot=cover renders one cover full-window (for screenshots); ?selftest=1
// renders and exports all three sizes and reports SELFTEST OK/FAIL in the
// document title. window.__coverStudio exposes the studio for tests.

import { LAYOUT_IDS, LAYOUTS, panelRects } from './layouts.js';
import { GRADE_IDS } from './grades.js';
import { SIZES, freshState, cloneState, reLayout, createHistory } from './state.js';
import { drawCover, exportCover, ensurePhotos, loadPhoto, cacheUpload } from './render.js';

const params = new URLSearchParams(window.location.search);
const canvas = document.getElementById('cover');
const history = createHistory();
let state = freshState('vice-grid');
let uploadCount = 0;
let drag = null;

const $ = (id) => document.getElementById(id);
const sizeDims = (size) => size.split('x').map(Number);

/** Redraw the preview canvas at the selected size, after fonts are ready. */
async function redraw() {
  const [w, h] = sizeDims(state.size);
  const images = await ensurePhotos(state);
  await document.fonts.ready;
  drawCover(canvas, state, w, h, images);
  syncControls();
}

/** Reflect the state in every control (active buttons, inputs, stars). */
function syncControls() {
  document.querySelectorAll('#layoutRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.layout === state.layout);
  });
  document.querySelectorAll('#gradeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.grade === state.grade);
  });
  document.querySelectorAll('#sizeRow button').forEach((b) => {
    b.classList.toggle('active', b.dataset.size === state.size);
  });
  if ($('titleInput').value !== state.title) $('titleInput').value = state.title;
  if ($('subtitleInput').value !== state.subtitle) $('subtitleInput').value = state.subtitle;
  document.querySelectorAll('#starRow button').forEach((b) => {
    b.classList.toggle('lit', Number(b.dataset.stars) <= state.stars);
  });
  const panel = state.panels[state.selected];
  $('selectedPanelLabel').textContent = LAYOUTS[state.layout].panels[state.selected]?.name ?? 'Hero';
  $('zoomSlider').value = String(panel?.scale ?? 1);
  $('undoBtn').disabled = !history.canUndo();
  $('redoBtn').disabled = !history.canRedo();
}

/** Snapshot the state, then run a mutation and redraw. */
function commit(fn) {
  history.push(state);
  fn();
  redraw();
}

/** Which panel (index) sits under canvas pixel (x, y), or -1. */
function panelAt(x, y) {
  const rect = canvas.getBoundingClientRect();
  const cx = ((x - rect.left) / rect.width) * canvas.width;
  const cy = ((y - rect.top) / rect.height) * canvas.height;
  return hitPanel(cx, cy);
}

function hitPanel(cx, cy) {
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    if (cx >= r.x && cx <= r.x + r.w && cy >= r.y && cy <= r.y + r.h) return i;
  }
  return -1;
}

/** Download a PNG blob under a filename. */
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function exportOne(size) {
  const blob = await exportCover(state, size);
  downloadBlob(blob, `vice-panel-studio-${size}.png`);
  return blob;
}

async function exportAll() {
  const blobs = [];
  for (const size of SIZES) blobs.push(await exportOne(size));
  return blobs;
}

// --- pointer: select a panel, drag to pan, wheel to zoom -------------------

canvas.addEventListener('pointerdown', (e) => {
  const i = panelAt(e.clientX, e.clientY);
  if (i < 0) return;
  canvas.setPointerCapture(e.pointerId);
  if (i !== state.selected) {
    state.selected = i;
    syncControls();
  }
  drag = { x: e.clientX, y: e.clientY, snapshot: cloneState(state), moved: false };
});

canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  const panel = state.panels[state.selected];
  const rects = panelRects(state.layout, canvas.width, canvas.height);
  const r = rects[state.selected];
  const dx = ((e.clientX - drag.x) / rect.width) * canvas.width;
  const dy = ((e.clientY - drag.y) / rect.height) * canvas.height;
  if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true;
  panel.ox = Math.max(-0.6, Math.min(0.6, panel.ox + dx / r.w));
  panel.oy = Math.max(-0.6, Math.min(0.6, panel.oy + dy / r.h));
  drag.x = e.clientX;
  drag.y = e.clientY;
  redraw();
});

canvas.addEventListener('pointerup', () => {
  if (drag?.moved) history.push(drag.snapshot);
  drag = null;
});

canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.selected];
  history.push(state);
  panel.scale = Math.max(1, Math.min(3, panel.scale * (e.deltaY < 0 ? 1.12 : 1 / 1.12)));
  redraw();
}, { passive: false });

canvas.addEventListener('dragover', (e) => e.preventDefault());
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (file) loadFileIntoPanel(file, panelAt(e.clientX, e.clientY));
});

// --- photo loading ---------------------------------------------------------

function loadFileIntoPanel(file, index = state.selected) {
  if (index < 0 || !file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const id = `upload-${++uploadCount}`;
      cacheUpload(id, img);
      commit(() => {
        state.panels[index].photo = id;
        state.panels[index].scale = 1;
        state.panels[index].ox = 0;
        state.panels[index].oy = 0;
        state.selected = index;
      });
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
}

$('fileInput').addEventListener('change', (e) => {
  loadFileIntoPanel(e.target.files?.[0]);
  e.target.value = '';
});

$('fillInput').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file || !file.type.startsWith('image/')) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const id = `upload-${++uploadCount}`;
      cacheUpload(id, img);
      commit(() => {
        for (const panel of state.panels) {
          panel.photo = id;
          panel.scale = 1;
          panel.ox = 0;
          panel.oy = 0;
        }
      });
    };
    img.src = String(reader.result);
  };
  reader.readAsDataURL(file);
  e.target.value = '';
});

$('loadPanelBtn').addEventListener('click', () => $('fileInput').click());
$('fillAllBtn').addEventListener('click', () => $('fillInput').click());

// --- controls ---------------------------------------------------------------

$('layoutRow').addEventListener('click', (e) => {
  const id = e.target.dataset?.layout;
  if (!id || !LAYOUT_IDS.includes(id) || id === state.layout) return;
  commit(() => {
    state = reLayout(state, id);
  });
});

$('gradeRow').addEventListener('click', (e) => {
  const id = e.target.dataset?.grade;
  if (!id || !GRADE_IDS.includes(id)) return;
  commit(() => {
    state.grade = id;
  });
});

$('sizeRow').addEventListener('click', (e) => {
  const size = e.target.dataset?.size;
  if (!size || !SIZES.includes(size)) return;
  state.size = size;
  redraw();
});

$('titleInput').addEventListener('change', (e) => {
  commit(() => {
    state.title = e.target.value.trim() || 'UNTITLED';
  });
});

$('subtitleInput').addEventListener('change', (e) => {
  commit(() => {
    state.subtitle = e.target.value;
  });
});

$('starRow').addEventListener('click', (e) => {
  const n = Number(e.target.dataset?.stars);
  if (!n) return;
  commit(() => {
    state.stars = n;
  });
});

$('zoomSlider').addEventListener('input', (e) => {
  state.panels[state.selected].scale = Number(e.target.value);
  redraw();
});

$('zoomSlider').addEventListener('change', () => {
  history.push(state);
});

$('undoBtn').addEventListener('click', doUndo);
$('redoBtn').addEventListener('click', doRedo);

function doUndo() {
  const prev = history.undo(state);
  if (prev) {
    state = prev;
    redraw();
  }
}

function doRedo() {
  const next = history.redo(state);
  if (next) {
    state = next;
    redraw();
  }
}

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    e.preventDefault();
    doUndo();
  } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    e.preventDefault();
    doRedo();
  }
});

$('exportBtn').addEventListener('click', () => exportOne(state.size));
$('exportAllBtn').addEventListener('click', exportAll);

// --- modes and test hook ----------------------------------------------------

window.__coverStudio = {
  get state() {
    return state;
  },
  setState(next) {
    state = next;
    redraw();
  },
  drawCover,
  exportCover,
  exportAll,
  undo: doUndo,
  redo: doRedo,
  selftest: null,
  shotReady: false,
};

/** Apply ?shot / ?selftest URL modes, then draw the first preview. */
async function init() {
  const photo = params.get('photo');
  if (photo) {
    for (const panel of state.panels) panel.photo = photo;
  }
  const caption = params.get('caption');
  if (caption) state.title = caption;
  const size = params.get('size');
  if (size && SIZES.includes(size)) state.size = size;

  await Promise.all([
    document.fonts.load('400 40px Anton'),
    document.fonts.load('400 40px Pacifico'),
    document.fonts.load('400 40px "Bebas Neue"'),
  ]).catch(() => {});
  await redraw();

  if (params.get('shot') === 'cover') {
    document.body.classList.add('shot');
    await redraw();
    window.__coverStudio.shotReady = true;
    document.title = 'SHOT OK';
    return;
  }

  if (params.get('selftest') === '1') {
    try {
      const results = [];
      for (const s of SIZES) {
        const blob = await exportCover(state, s);
        results.push({ size: s, bytes: blob.size });
        if (blob.size < 10000) throw new Error(`export ${s} too small: ${blob.size} bytes`);
      }
      window.__coverStudio.selftest = { ok: true, results };
      document.title = 'SELFTEST OK';
    } catch (err) {
      window.__coverStudio.selftest = { ok: false, error: String(err) };
      document.title = `SELFTEST FAIL: ${err.message}`;
    }
  }
}

init();

// Vice Panel Studio — editor wiring: controls, drag-to-pan, undo/redo,
// PNG export, ?shot=cover rendering, ?selftest=1, and window.__coverStudio.
import { defaultState, snapshot, restore, History, SIZES, PHOTOS, sizeOf, LAYOUT_IDS, GRADE_IDS } from './state.js';
import { GRADES } from './grades.js';
import { LAYOUTS, panelCount } from './layouts.js';
import { drawCover, renderCoverCanvas, canvasHasContent, sizeOfState } from './render.js';

const $ = (sel) => document.querySelector(sel);

const state = defaultState();
const history = new History();
const images = [];
const photoNames = [...PHOTOS];

let previewCtx = null;

function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

async function loadAllPhotos() {
  images.length = 0;
  for (const src of photoNames) images.push(await loadImage(src));
}

function currentSize() {
  return sizeOf(state.size);
}

function renderPreview() {
  const canvas = $('#preview');
  if (!canvas) return;
  const size = currentSize();
  canvas.width = size.w;
  canvas.height = size.h;
  previewCtx = canvas.getContext('2d');
  drawCover(previewCtx, size.w, size.h, state, images);
  syncControls();
}

function commit() {
  history.push(snapshot(state));
  renderPreview();
}

function applySnapshot(text) {
  const next = restore(text);
  Object.keys(state).forEach((k) => delete state[k]);
  Object.assign(state, next);
  renderPreview();
}

function syncControls() {
  const caption = $('#caption');
  if (caption && caption.value !== state.caption) caption.value = state.caption;
  const sub = $('#subcaption');
  if (sub && sub.value !== state.subcaption) sub.value = state.subcaption;
  document.querySelectorAll('#layouts button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.id === state.layout));
  });
  document.querySelectorAll('#grades button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.id === state.grade));
  });
  document.querySelectorAll('#sizes button').forEach((b) => {
    b.setAttribute('aria-pressed', String(b.dataset.id === state.size));
  });
  document.querySelectorAll('#stars button').forEach((b) => {
    b.setAttribute('aria-pressed', String(Number(b.dataset.n) <= state.stars));
  });
  const grain = $('#grain');
  if (grain) grain.checked = state.grain;
  const vig = $('#vignette');
  if (vig) vig.checked = state.vignette;
  const undo = $('#undo');
  if (undo) undo.disabled = !history.canUndo();
  const redo = $('#redo');
  if (redo) redo.disabled = !history.canRedo();
  const heat = $('#heat');
  if (heat) heat.textContent = '★'.repeat(state.stars) + '☆'.repeat(5 - state.stars);
  renderPanelList();
}

function renderPanelList() {
  const host = $('#panels');
  if (!host) return;
  host.innerHTML = '';
  const n = panelCount(state.layout);
  for (let i = 0; i < n; i++) {
    const panel = state.panels[i];
    const row = document.createElement('div');
    row.className = 'panel-row' + (state.activePanel === i ? ' active' : '');
    row.dataset.i = String(i);
    const label = document.createElement('span');
    label.textContent = `Panel ${i + 1}`;
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Panel ${i + 1} photo`);
    photoNames.forEach((name, idx) => {
      const opt = document.createElement('option');
      opt.value = String(idx);
      opt.textContent = name.split('/').pop();
      if (idx === panel.photo) opt.selected = true;
      select.appendChild(opt);
    });
    const zoom = document.createElement('input');
    zoom.type = 'range';
    zoom.min = '1';
    zoom.max = '2.5';
    zoom.step = '0.05';
    zoom.value = String(panel.zoom);
    zoom.setAttribute('aria-label', `Panel ${i + 1} zoom`);
    row.append(label, select, zoom);
    row.addEventListener('click', (ev) => {
      if (ev.target === select || ev.target === zoom) return;
      state.activePanel = i;
      renderPreview();
    });
    select.addEventListener('change', () => {
      history.push(snapshot(state));
      panel.photo = Number(select.value);
      renderPreview();
    });
    zoom.addEventListener('input', () => {
      panel.zoom = Number(zoom.value);
      renderPreview();
    });
    zoom.addEventListener('change', () => {
      history.push(snapshot(state));
    });
    host.appendChild(row);
  }
}

function buildButtons() {
  const layouts = $('#layouts');
  LAYOUT_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = id;
    b.textContent = LAYOUTS[id].label;
    b.addEventListener('click', () => {
      if (state.layout === id) return;
      history.push(snapshot(state));
      state.layout = id;
      state.activePanel = 0;
      renderPreview();
    });
    layouts.appendChild(b);
  });
  const grades = $('#grades');
  GRADE_IDS.forEach((id) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = id;
    b.textContent = GRADES[id].label;
    b.addEventListener('click', () => {
      if (state.grade === id) return;
      history.push(snapshot(state));
      state.grade = id;
      renderPreview();
    });
    grades.appendChild(b);
  });
  const sizes = $('#sizes');
  SIZES.forEach((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.id = s.id;
    b.textContent = s.label;
    b.addEventListener('click', () => {
      if (state.size === s.id) return;
      history.push(snapshot(state));
      state.size = s.id;
      renderPreview();
    });
    sizes.appendChild(b);
  });
  const stars = $('#stars');
  for (let n = 1; n <= 5; n++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.dataset.n = String(n);
    b.textContent = '★';
    b.setAttribute('aria-label', `${n} stars`);
    b.addEventListener('click', () => {
      history.push(snapshot(state));
      state.stars = n;
      renderPreview();
    });
    stars.appendChild(b);
  }
}

function wireEditor() {
  $('#caption').addEventListener('input', (ev) => {
    state.caption = ev.target.value;
    renderPreview();
  });
  $('#caption').addEventListener('change', () => commit());
  $('#subcaption').addEventListener('input', (ev) => {
    state.subcaption = ev.target.value;
    renderPreview();
  });
  $('#subcaption').addEventListener('change', () => commit());
  $('#grain').addEventListener('change', (ev) => {
    history.push(snapshot(state));
    state.grain = ev.target.checked;
    renderPreview();
  });
  $('#vignette').addEventListener('change', (ev) => {
    history.push(snapshot(state));
    state.vignette = ev.target.checked;
    renderPreview();
  });
  $('#undo').addEventListener('click', () => {
    const prev = history.undo(snapshot(state));
    if (prev !== null) applySnapshot(prev);
  });
  $('#redo').addEventListener('click', () => {
    const next = history.redo(snapshot(state));
    if (next !== null) applySnapshot(next);
  });
  $('#upload').addEventListener('change', async (ev) => {
    const file = ev.target.files && ev.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    if (img) {
      images.push(img);
      photoNames.push(file.name);
      history.push(snapshot(state));
      state.panels[state.activePanel].photo = images.length - 1;
      renderPreview();
    }
    ev.target.value = '';
  });
  $('#export').addEventListener('click', () => {
    const canvas = renderCoverCanvas(state, images);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vice-panel-${state.size}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    }, 'image/png');
  });
  // Drag the active panel to pan it; wheel zooms it.
  const canvas = $('#preview');
  let dragging = null;
  canvas.addEventListener('pointerdown', (ev) => {
    canvas.setPointerCapture(ev.pointerId);
    dragging = { x: ev.clientX, y: ev.clientY, panel: { ...state.panels[state.activePanel] } };
  });
  canvas.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[state.activePanel];
    const layout = LAYOUTS[state.layout];
    const p = layout.panels[state.activePanel];
    const pw = (p.w * rect.width) / rect.width;
    const ph = (p.h * rect.height) / rect.height;
    panel.x = Math.min(1, Math.max(0, dragging.panel.x - (ev.clientX - dragging.x) / (rect.width * p.w * 0.9)));
    panel.y = Math.min(1, Math.max(0, dragging.panel.y - (ev.clientY - dragging.y) / (rect.height * p.h * 0.9)));
    void pw;
    void ph;
    renderPreview();
  });
  canvas.addEventListener('pointerup', () => {
    if (!dragging) return;
    dragging = null;
    history.push(snapshot(state));
  });
  canvas.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    const panel = state.panels[state.activePanel];
    panel.zoom = Math.min(2.5, Math.max(1, panel.zoom + (ev.deltaY < 0 ? 0.08 : -0.08)));
    renderPreview();
  }, { passive: false });
}

/** Render every layout × grade × size once and require visible content. */
export function selftest() {
  const problems = [];
  const base = JSON.parse(JSON.stringify(state));
  for (const layout of LAYOUT_IDS) {
    for (const grade of GRADE_IDS) {
      for (const size of SIZES) {
        const trial = { ...base, layout, grade, size: size.id };
        const canvas = renderCoverCanvas(trial, images);
        if (!canvasHasContent(canvas)) {
          problems.push(`${layout}/${grade}/${size.id} blank`);
        }
      }
    }
  }
  const el = $('#selftest');
  if (problems.length === 0) {
    if (el) el.textContent = 'SELFTEST OK';
    return true;
  }
  if (el) el.textContent = `SELFTEST FAIL: ${problems.join('; ')}`;
  return false;
}

function applyQuery() {
  const q = new URLSearchParams(window.location.search);
  if (q.get('layout') && LAYOUTS[q.get('layout')]) state.layout = q.get('layout');
  if (q.get('grade') && GRADES[q.get('grade')]) state.grade = q.get('grade');
  if (q.get('caption')) state.caption = q.get('caption');
  if (q.get('subcaption')) state.subcaption = q.get('subcaption');
  if (q.get('stars')) state.stars = Math.min(5, Math.max(0, Number(q.get('stars')) || 5));
  const w = Number(q.get('w'));
  const h = Number(q.get('h'));
  if (q.get('shot') === 'cover') {
    document.body.classList.add('shot');
    // A shot renders the cover at the requested pixel size.
    state.size = 'square';
    const canvas = $('#preview');
    canvas.width = w > 0 ? w : 1080;
    canvas.height = h > 0 ? h : 1080;
    const ctx = canvas.getContext('2d');
    drawCover(ctx, canvas.width, canvas.height, state, images);
    return true;
  }
  return false;
}

async function boot() {
  await Promise.all([
    document.fonts.load('16px "Archivo Black"'),
    document.fonts.load('16px "Alfa Slab One"'),
    document.fonts.load('16px Righteous'),
  ]).catch(() => {});
  await loadAllPhotos();
  buildButtons();
  wireEditor();
  const shot = applyQuery();
  if (!shot) renderPreview();
  if (new URLSearchParams(window.location.search).get('selftest') === '1') {
    await document.fonts.ready;
    renderPreview();
    selftest();
  }
  window.__coverStudio = {
    version: '5.0.0',
    get state() {
      return JSON.parse(JSON.stringify(state));
    },
    setCaption(text) {
      history.push(snapshot(state));
      state.caption = String(text);
      renderPreview();
    },
    setSubcaption(text) {
      history.push(snapshot(state));
      state.subcaption = String(text);
      renderPreview();
    },
    setLayout(id) {
      if (!LAYOUTS[id]) return false;
      history.push(snapshot(state));
      state.layout = id;
      renderPreview();
      return true;
    },
    setGrade(id) {
      if (!GRADES[id]) return false;
      history.push(snapshot(state));
      state.grade = id;
      renderPreview();
      return true;
    },
    setSize(id) {
      if (!sizeOf(id)) return false;
      history.push(snapshot(state));
      state.size = id;
      renderPreview();
      return true;
    },
    setStars(n) {
      history.push(snapshot(state));
      state.stars = Math.min(5, Math.max(0, n | 0));
      renderPreview();
    },
    loadPhoto(src) {
      return loadImage(src).then((img) => {
        if (!img) return -1;
        images.push(img);
        photoNames.push(String(src).split('/').pop());
        return images.length - 1;
      });
    },
    exportPNG() {
      return new Promise((resolve) => {
        const canvas = renderCoverCanvas(state, images);
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    },
    renderPreview,
    selftest,
  };
}

boot();

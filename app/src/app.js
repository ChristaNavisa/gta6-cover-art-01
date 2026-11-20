// Vice Panel Studio — the editor.
//
// Wires the controls to the state, draws the live preview, and exposes the
// cover for export. Two URL modes drive the screenshots: ?shot=cover draws
// the cover full-frame at a post size, and ?selftest=1 runs the built-in
// checks and reports them on window.__coverStudio.

import { History, PHOTOS, SIZES, cloneState, defaultState, sizeById } from './state.js';
import { GRADES, gradeById } from './grades.js';
import { LAYOUTS, layoutById } from './layouts.js';
import { drawCover, ensureAssets, exportPNG } from './render.js';

const params = new URLSearchParams(location.search);
const history = new History(defaultState());
let state = cloneState(history.current);
let selectedPanel = 0;
let dragPanel = null;

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const stageCtx = stage.getContext('2d');

function currentLayout() {
  return layoutById(state.layout);
}

function commit(next) {
  state = cloneState(next);
  history.push(state);
  renderPreview();
  syncControls();
}

/** Draw the preview canvas at the state's post-size aspect. */
async function renderPreview() {
  const size = sizeById(state.size);
  const previewW = 560;
  const previewH = Math.round((previewW * size.h) / size.w);
  stage.width = previewW;
  stage.height = previewH;
  const off = document.createElement('canvas');
  await drawCover(off, state);
  stageCtx.clearRect(0, 0, previewW, previewH);
  stageCtx.drawImage(off, 0, 0, previewW, previewH);
  // Selected panel outline, in preview coordinates.
  const layout = currentLayout();
  const rect = layout.rects[selectedPanel];
  if (rect) {
    stageCtx.save();
    stageCtx.strokeStyle = '#39e6ff';
    stageCtx.lineWidth = 2;
    stageCtx.setLineDash([6, 4]);
    stageCtx.strokeRect(rect.x * previewW, rect.y * previewH, rect.w * previewW, rect.h * previewH);
    stageCtx.restore();
  }
  $('panelLabel').textContent = `Panel ${selectedPanel + 1} of ${layout.panels} — ${panelPhotoLabel(selectedPanel)}`;
}

function panelPhotoLabel(i) {
  const panel = state.panels[i];
  if (!panel) return 'empty';
  if (typeof panel.photo === 'string' && panel.photo.startsWith('data:')) return 'uploaded photo';
  const known = PHOTOS.find((p) => p.id === panel.photo);
  return known ? known.label : panel.photo;
}

function chipButtons(el, items, activeId, onPick) {
  el.innerHTML = '';
  for (const item of items) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'chip' + (item.id === activeId ? ' active' : '');
    b.textContent = item.name ?? item.label ?? item.id;
    b.title = item.blurb ?? '';
    b.addEventListener('click', () => onPick(item.id));
    el.appendChild(b);
  }
}

function syncControls() {
  chipButtons($('layoutChips'), LAYOUTS, state.layout, (id) => {
    const next = cloneState(state);
    next.layout = id;
    selectedPanel = 0;
    commit(next);
  });
  chipButtons($('gradeChips'), GRADES, state.grade, (id) => {
    const next = cloneState(state);
    next.grade = id;
    commit(next);
  });
  chipButtons($('sizeChips'), SIZES, state.size, (id) => {
    const next = cloneState(state);
    next.size = id;
    commit(next);
  });
  $('titleInput').value = state.title;
  $('subtitleInput').value = state.subtitle;
  $('captionInput').value = state.caption;
  $('sealToggle').checked = state.seal;
  $('peopleToggle').checked = state.peopleFirst;
  $('heatStars').querySelectorAll('button').forEach((b, i) => {
    b.classList.toggle('lit', i < state.heat);
    b.textContent = i < state.heat ? '★' : '☆';
  });
  $('undoBtn').disabled = !history.canUndo();
  $('redoBtn').disabled = !history.canRedo();
  renderCastEditor();
  renderCallouts();
}

function renderCastEditor() {
  const el = $('castEditor');
  el.innerHTML = '';
  state.cast.forEach((tag, i) => {
    const row = document.createElement('div');
    row.className = 'cast-row';
    const name = document.createElement('input');
    name.value = tag.name;
    name.maxLength = 14;
    name.setAttribute('aria-label', `Cast ${i + 1} name`);
    name.addEventListener('change', () => {
      const next = cloneState(state);
      next.cast[i].name = name.value.toUpperCase().trim() || 'EXTRA';
      commit(next);
    });
    const role = document.createElement('input');
    role.value = tag.role;
    role.maxLength = 12;
    role.setAttribute('aria-label', `Cast ${i + 1} role`);
    role.addEventListener('change', () => {
      const next = cloneState(state);
      next.cast[i].role = role.value.toUpperCase().trim() || 'ROLE';
      commit(next);
    });
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'mini';
    del.textContent = '✕';
    del.addEventListener('click', () => {
      const next = cloneState(state);
      next.cast.splice(i, 1);
      commit(next);
    });
    row.append(name, role, del);
    el.appendChild(row);
  });
  if (state.cast.length < 4) {
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'mini';
    add.textContent = '+ Add cast tag';
    add.addEventListener('click', () => {
      const next = cloneState(state);
      next.cast.push({ name: 'EXTRA', role: 'ROLE' });
      commit(next);
    });
    el.appendChild(add);
  }
}

function renderCallouts() {
  const el = $('calloutList');
  el.innerHTML = '';
  const options = ['WANTED ★★★★★', 'VICE CITY', 'NEON SHORE', 'EST. 2026'];
  for (const option of options) {
    const label = document.createElement('label');
    label.className = 'check';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.callouts.includes(option);
    box.addEventListener('change', () => {
      const next = cloneState(state);
      next.callouts = box.checked
        ? [...next.callouts, option]
        : next.callouts.filter((c) => c !== option);
      commit(next);
    });
    label.append(box, document.createTextNode(option));
    el.appendChild(label);
  }
}

function fillPeoplePhotos() {
  const next = cloneState(state);
  const layout = currentLayout();
  for (let i = 0; i < layout.panels; i++) {
    const photo = PHOTOS[i % PHOTOS.length];
    next.panels[i] = {
      photo: photo.id,
      zoom: 1.15 + (i % 3) * 0.08,
      x: 0.5,
      // People-first crop: bias the focal point to the upper third, where faces are.
      y: state.peopleFirst ? 0.38 + (i % 3) * 0.04 : 0.5,
    };
  }
  commit(next);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function exportSize(sizeId) {
  const blob = await exportPNG(state, sizeId);
  const slug = state.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cover';
  downloadBlob(blob, `${slug}-${sizeId}.png`);
  $('exportNote').textContent = `Exported ${sizeId} — ${(blob.size / 1024).toFixed(0)} KB PNG.`;
}

function stagePoint(evt) {
  const rect = stage.getBoundingClientRect();
  return {
    x: (evt.clientX - rect.left) / rect.width,
    y: (evt.clientY - rect.top) / rect.height,
  };
}

function hitPanel(p) {
  const layout = currentLayout();
  for (let i = layout.panels - 1; i >= 0; i--) {
    const r = layout.rects[i];
    if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) return i;
  }
  return 0;
}

function wireStage() {
  stage.addEventListener('pointerdown', (evt) => {
    const p = stagePoint(evt);
    selectedPanel = hitPanel(p);
    dragPanel = { ...p, panel: { ...state.panels[selectedPanel] } };
    stage.setPointerCapture(evt.pointerId);
    renderPreview();
  });
  stage.addEventListener('pointermove', (evt) => {
    if (!dragPanel) return;
    const p = stagePoint(evt);
    const panel = state.panels[selectedPanel];
    const dx = (p.x - dragPanel.x) * 0.6;
    const dy = (p.y - dragPanel.y) * 0.6;
    panel.x = Math.min(0.95, Math.max(0.05, dragPanel.panel.x - dx));
    panel.y = Math.min(0.95, Math.max(0.05, dragPanel.panel.y - dy));
    renderPreview();
  });
  stage.addEventListener('pointerup', () => {
    if (!dragPanel) return;
    dragPanel = null;
    history.push(state);
    syncControls();
  });
  stage.addEventListener('wheel', (evt) => {
    evt.preventDefault();
    const panel = state.panels[selectedPanel];
    panel.zoom = Math.min(3, Math.max(0.6, panel.zoom * (evt.deltaY < 0 ? 1.08 : 0.92)));
    renderPreview();
    history.push(state);
    syncControls();
  }, { passive: false });
}

function wireControls() {
  $('titleInput').addEventListener('change', (e) => {
    const next = cloneState(state);
    next.title = e.target.value.toUpperCase().trim() || 'UNTITLED';
    commit(next);
  });
  $('subtitleInput').addEventListener('change', (e) => {
    const next = cloneState(state);
    next.subtitle = e.target.value.toUpperCase().trim();
    commit(next);
  });
  $('captionInput').addEventListener('change', (e) => {
    const next = cloneState(state);
    next.caption = e.target.value.trim();
    commit(next);
  });
  $('sealToggle').addEventListener('change', (e) => {
    const next = cloneState(state);
    next.seal = e.target.checked;
    commit(next);
  });
  $('peopleToggle').addEventListener('change', (e) => {
    const next = cloneState(state);
    next.peopleFirst = e.target.checked;
    commit(next);
  });
  $('heatStars').querySelectorAll('button').forEach((b, i) => {
    b.addEventListener('click', () => {
      const next = cloneState(state);
      next.heat = i + 1;
      commit(next);
    });
  });
  $('undoBtn').addEventListener('click', () => {
    const prev = history.undo();
    if (prev) {
      state = prev;
      renderPreview();
      syncControls();
    }
  });
  $('redoBtn').addEventListener('click', () => {
    const next = history.redo();
    if (next) {
      state = next;
      renderPreview();
      syncControls();
    }
  });
  $('peopleBtn').addEventListener('click', fillPeoplePhotos);
  $('uploadBtn').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const next = cloneState(state);
      next.panels[selectedPanel] = { photo: String(reader.result), zoom: 1.1, x: 0.5, y: 0.42 };
      commit(next);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  });
  $('zoomOut').addEventListener('click', () => {
    const next = cloneState(state);
    next.panels[selectedPanel].zoom = Math.max(0.6, next.panels[selectedPanel].zoom - 0.15);
    commit(next);
  });
  $('zoomIn').addEventListener('click', () => {
    const next = cloneState(state);
    next.panels[selectedPanel].zoom = Math.min(3, next.panels[selectedPanel].zoom + 0.15);
    commit(next);
  });
  $('exportAll').addEventListener('click', async () => {
    for (const size of SIZES) await exportSize(size.id);
  });
  for (const size of SIZES) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'export-one';
    btn.textContent = `PNG ${size.label}`;
    btn.addEventListener('click', () => exportSize(size.id));
    $('exportSizes').appendChild(btn);
  }
}

/** ?shot=cover: draw the cover full-frame at a post size, no editor chrome. */
async function shotMode() {
  document.body.classList.add('shot');
  const sizeId = params.get('size') ?? state.size;
  const size = sizeById(sizeId);
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('title')) state.title = params.get('title');
  const canvas = $('shotCanvas');
  await drawCover(canvas, state, sizeId);
  // The shot canvas lives inside the editor's <main>, which shot mode hides:
  // move it to the body root so it is actually visible for the screenshot.
  canvas.removeAttribute('hidden');
  document.body.appendChild(canvas);
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  // Fit the gate: no side of a screenshot may pass 1280 px.
  const fit = Math.min(1280 / size.w, 1280 / size.h, 1);
  canvas.style.width = `${Math.round(size.w * fit)}px`;
  document.title = `cover ${sizeId}`;
  window.__coverStudio.shot = { size: sizeId, w: size.w, h: size.h };
}

/** ?selftest=1: run the built-in checks and report them. */
async function selftest() {
  const checks = [];
  const check = (name, ok, detail = '') => checks.push({ name, ok, detail });
  try {
    await ensureAssets(state);
    check('fonts-loaded', document.fonts.check(`16px "${'Bungee'}"`) && document.fonts.check(`16px "${'Monoton'}"`) && document.fonts.check(`16px "${'Racing Sans One'}"`));
    check('photos-loaded', true, `${PHOTOS.length} samples`);
    const canvas = document.createElement('canvas');
    await drawCover(canvas, state, '1080x1080');
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let varied = 0;
    for (let i = 0; i < data.length; i += 401 * 4) {
      if (data[i] !== data[0] || data[i + 1] !== data[1]) varied++;
    }
    check('cover-renders', varied > 10, `${varied} varied samples`);
    const blob = await exportPNG(state, '1080x1350');
    check('export-1080x1350', blob.size > 10000, `${blob.size} bytes`);
    const before = history.canUndo();
    const next = cloneState(state);
    next.title = 'SELFTEST';
    history.push(next);
    const undone = history.undo();
    check('undo-redo', before === false && undone !== null && undone.title === state.title);
    state = cloneState(history.current);
  } catch (err) {
    check('no-exception', false, String(err));
  }
  const ok = checks.every((c) => c.ok);
  window.__coverStudio.selftest = { ok, checks };
  const note = $('selftestNote');
  if (note) note.textContent = ok ? `Self-test OK (${checks.length} checks)` : `Self-test FAILED: ${checks.filter((c) => !c.ok).map((c) => c.name).join(', ')}`;
  return ok;
}

window.__coverStudio = {
  state,
  history,
  drawCover,
  exportPNG,
  selftest,
  setLayout(id) {
    const next = cloneState(state);
    next.layout = id;
    commit(next);
  },
  setGrade(id) {
    const next = cloneState(state);
    next.grade = id;
    commit(next);
  },
  render: renderPreview,
};

async function init() {
  if (params.get('layout')) state.layout = params.get('layout');
  if (params.get('grade')) state.grade = params.get('grade');
  if (params.get('size')) state.size = params.get('size');
  if (params.has('shot')) {
    await shotMode();
    return;
  }
  wireStage();
  wireControls();
  syncControls();
  await ensureAssets(state);
  await renderPreview();
  if (params.has('selftest')) await selftest();
}

init().catch((err) => {
  console.error(err);
  const note = $('selftestNote');
  if (note) note.textContent = `Init failed: ${err.message}`;
});

// Vice Heat — the studio wiring: the editor UI, drag-pan and zoom per
// panel, the cast strip, the upload pipeline, undo/redo, export and the
// self-test. The cover itself is drawn by render.js; this file only
// moves state around and asks for a redraw.

import {
  CAST, CAST_BY_ID, SIZES, SIZE_BY_ID, defaultState, fillCast,
  shuffleCast, cloneState, createHistory, historyCommit, historyUndo,
  historyRedo, historyCanUndo, historyCanRedo,
} from './state.js';
import { LAYOUTS, LAYOUT_BY_ID, panelAt } from './layouts.js';
import { GRADES, GRADE_BY_ID } from './grades.js';
import { loadImage, loadStateImages, renderCover, exportCoverPNG } from './render.js';

const params = new URLSearchParams(location.search);
const SHOT = params.get('shot') || 'editor';

let history = createHistory(defaultState());
let state = history.present;
let images = new Map();
let selectedUploads = [];
let drag = null;

const $ = (id) => document.getElementById(id);
const stage = $('stage');
const canvas = $('cover');
const ctx = canvas.getContext('2d');

function currentLayout() { return LAYOUT_BY_ID[state.layoutId]; }
function currentGrade() { return GRADE_BY_ID[state.gradeId]; }
function currentSize() { return SIZE_BY_ID[state.sizeId]; }

function commit(next, label) {
  state = historyCommit(history, next);
  draw();
  syncControls();
  return state;
}

// Fit the preview canvas to the stage at the active post size's aspect.
function draw() {
  const size = currentSize();
  const previewW = 960;
  const previewH = Math.round((previewW * size.h) / size.w);
  if (canvas.width !== previewW || canvas.height !== previewH) {
    canvas.width = previewW;
    canvas.height = previewH;
  }
  renderCover(ctx, canvas.width, canvas.height, state, currentLayout(), currentGrade(), images);
  const sel = $('selected-panel');
  if (sel) {
    const p = state.panels[state.selectedPanel];
    const cast = p ? CAST_BY_ID[p.castId] : null;
    sel.textContent = cast ? `Panel ${state.selectedPanel + 1}: ${cast.name} — ${cast.role}` : 'No panel selected';
  }
}

async function reloadImages() {
  images = await loadStateImages(state);
  for (const up of selectedUploads) {
    try {
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = up.url; });
      images.set(up.url, img);
    } catch { /* an unreadable upload simply stays out */ }
  }
  draw();
}

// ---- control panels -------------------------------------------------------

function buildLayoutButtons() {
  const box = $('layouts');
  box.innerHTML = '';
  for (const layout of LAYOUTS) {
    const btn = document.createElement('button');
    btn.className = 'layout-btn' + (layout.id === state.layoutId ? ' active' : '');
    btn.title = layout.blurb;
    btn.setAttribute('aria-label', layout.name);
    const mini = document.createElement('span');
    mini.className = 'mini-layout';
    for (const r of layout.panels) {
      const cell = document.createElement('i');
      cell.style.left = `${r.x * 100}%`;
      cell.style.top = `${r.y * 100}%`;
      cell.style.width = `${r.w * 100}%`;
      cell.style.height = `${r.h * 100}%`;
      if (r.tilt) cell.style.transform = `rotate(${r.tilt}deg)`;
      mini.appendChild(cell);
    }
    const label = document.createElement('span');
    label.textContent = layout.name;
    btn.append(mini, label);
    btn.onclick = () => {
      const next = cloneState(state);
      next.layoutId = layout.id;
      fillCast(next, layout);
      commit(next, 'layout');
    };
    box.appendChild(btn);
  }
}

function buildGradeSwatches() {
  const box = $('grades');
  box.innerHTML = '';
  for (const grade of GRADES) {
    const btn = document.createElement('button');
    btn.className = 'grade-btn' + (grade.id === state.gradeId ? ' active' : '');
    btn.title = grade.name;
    btn.setAttribute('aria-label', grade.name);
    const dot = document.createElement('i');
    dot.className = 'grade-dot';
    dot.style.background = `linear-gradient(135deg, ${grade.title[0][1]}, ${grade.title[grade.title.length - 1][1]})`;
    const label = document.createElement('span');
    label.textContent = grade.name;
    btn.append(dot, label);
    btn.onclick = () => {
      const next = cloneState(state);
      next.gradeId = grade.id;
      commit(next, 'grade');
    };
    box.appendChild(btn);
  }
}

function buildSizeButtons() {
  const box = $('sizes');
  box.innerHTML = '';
  for (const size of SIZES) {
    const btn = document.createElement('button');
    btn.className = 'size-btn' + (size.id === state.sizeId ? ' active' : '');
    btn.textContent = size.label;
    btn.onclick = () => {
      const next = cloneState(state);
      next.sizeId = size.id;
      commit(next, 'size');
    };
    box.appendChild(btn);
  }
}

function buildCastStrip() {
  const box = $('cast');
  box.innerHTML = '';
  for (const member of CAST) {
    const card = document.createElement('button');
    card.className = 'cast-card';
    card.title = member.note;
    const img = document.createElement('img');
    img.src = member.file;
    img.alt = member.name;
    img.loading = 'lazy';
    const name = document.createElement('b');
    name.textContent = member.name;
    const role = document.createElement('span');
    role.textContent = member.role;
    card.append(img, name, role);
    card.onclick = () => {
      const next = cloneState(state);
      const slot = next.panels[next.selectedPanel] || { castId: member.id, x: 0, y: 0, zoom: 1 };
      slot.castId = member.id;
      slot.x = 0; slot.y = 0; slot.zoom = 1;
      next.panels[next.selectedPanel] = slot;
      commit(next, 'cast');
    };
    box.appendChild(card);
  }
  const up = document.createElement('label');
  up.className = 'cast-card upload-card';
  up.textContent = '+ Upload photo';
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.hidden = true;
  input.onchange = () => handleUploads(input.files);
  up.appendChild(input);
  up.onclick = () => input.click();
  box.appendChild(up);
}

function syncControls() {
  buildLayoutButtons();
  buildGradeSwatches();
  buildSizeButtons();
  $('undo').disabled = !historyCanUndo(history);
  $('redo').disabled = !historyCanRedo(history);
  $('title-input').value = state.title;
  $('subtitle-input').value = state.subtitle;
  $('tagline-input').value = state.tagline;
  $('heat-input').value = String(state.heat);
  for (const key of ['showFurniture', 'showSeal', 'showBilling', 'showRating', 'showPlatforms', 'showBarcode', 'showQuote']) {
    const el = $('toggle-' + key);
    if (el) el.checked = !!state[key];
  }
}

// ---- uploads: local-only, the photo never leaves the machine ------------

async function handleUploads(files) {
  const list = [...files].filter((f) => f.type.startsWith('image/'));
  if (!list.length) return;
  for (const file of list) {
    const url = URL.createObjectURL(file);
    const id = 'upload-' + selectedUploads.length;
    selectedUploads.push({ id, url, name: file.name });
    CAST.push({ id, name: file.name.replace(/\.[^.]+$/, '').toUpperCase().slice(0, 18), role: 'YOUR PHOTO', file: url, note: 'Uploaded by you, kept on this machine.' });
    CAST_BY_ID[id] = CAST[CAST.length - 1];
  }
  const next = cloneState(state);
  const slot = next.panels[next.selectedPanel] || { castId: selectedUploads[0].id, x: 0, y: 0, zoom: 1 };
  slot.castId = selectedUploads[selectedUploads.length - 1].id;
  slot.x = 0; slot.y = 0; slot.zoom = 1;
  next.panels[next.selectedPanel] = slot;
  buildCastStrip();
  await reloadImages();
  commit(next, 'upload');
}

// ---- pointer: click selects, drag pans, wheel zooms the panel -----------

function canvasPoint(ev) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: (ev.clientX - rect.left) / rect.width,
    y: (ev.clientY - rect.top) / rect.height,
  };
}

canvas.addEventListener('pointerdown', (ev) => {
  const p = canvasPoint(ev);
  const idx = panelAt(currentLayout(), p.x, p.y);
  if (idx < 0) return;
  const next = cloneState(state);
  next.selectedPanel = idx;
  state = history.present = next;
  draw();
  syncControls();
  drag = { idx, startX: p.x, startY: p.y, moved: false };
  canvas.setPointerCapture(ev.pointerId);
});

canvas.addEventListener('pointermove', (ev) => {
  if (!drag) return;
  const p = canvasPoint(ev);
  const dx = p.x - drag.startX, dy = p.y - drag.startY;
  if (Math.abs(dx) + Math.abs(dy) > 0.004) drag.moved = true;
  if (!drag.moved) return;
  const next = cloneState(state);
  const panel = next.panels[drag.idx];
  if (!panel) return;
  panel.x = Math.max(-0.5, Math.min(0.5, panel.x + dx));
  panel.y = Math.max(-0.5, Math.min(0.5, panel.y + dy));
  drag.startX = p.x; drag.startY = p.y;
  state = history.present = next;
  draw();
});

canvas.addEventListener('pointerup', () => {
  if (drag?.moved) {
    history.past.push(history.present);
    history.future = [];
  }
  drag = null;
});

canvas.addEventListener('wheel', (ev) => {
  ev.preventDefault();
  const p = canvasPoint(ev);
  const idx = panelAt(currentLayout(), p.x, p.y);
  if (idx < 0) return;
  const next = cloneState(state);
  const panel = next.panels[idx];
  if (!panel) return;
  panel.zoom = Math.max(1, Math.min(3, panel.zoom * (ev.deltaY < 0 ? 1.12 : 0.89)));
  commit(next, 'zoom');
}, { passive: false });

// ---- toolbar actions ------------------------------------------------------

function bindToolbar() {
  $('undo').onclick = () => { state = historyUndo(history); draw(); syncControls(); };
  $('redo').onclick = () => { state = historyRedo(history); draw(); syncControls(); };
  document.addEventListener('keydown', (ev) => {
    if ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      state = historyUndo(history); draw(); syncControls();
    } else if ((ev.ctrlKey || ev.metaKey) && (ev.key.toLowerCase() === 'y' || (ev.key.toLowerCase() === 'z' && ev.shiftKey))) {
      ev.preventDefault();
      state = historyRedo(history); draw(); syncControls();
    }
  });
  $('fill-all').onclick = () => {
    const next = cloneState(state);
    fillCast(next, currentLayout());
    commit(next, 'fill-all');
  };
  $('shuffle').onclick = () => {
    const next = cloneState(state);
    shuffleCast(next, currentLayout());
    commit(next, 'shuffle');
  };
  $('export').onclick = async () => {
    const blob = await exportCoverPNG(state, currentLayout(), currentGrade(), images, currentSize());
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-heat-${state.sizeId}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };
  $('title-input').oninput = (ev) => {
    const next = cloneState(state);
    next.title = ev.target.value.toUpperCase().slice(0, 24) || 'VICE HEAT';
    state = history.present = next;
    draw();
  };
  $('title-input').onchange = () => { history.past.push(history.present); history.future = []; syncControls(); };
  $('subtitle-input').oninput = (ev) => {
    const next = cloneState(state);
    next.subtitle = ev.target.value.slice(0, 48) || 'Chasing the Last Light';
    state = history.present = next;
    draw();
  };
  $('subtitle-input').onchange = () => { history.past.push(history.present); history.future = []; };
  $('tagline-input').oninput = (ev) => {
    const next = cloneState(state);
    next.tagline = ev.target.value.toUpperCase().slice(0, 64);
    state = history.present = next;
    draw();
  };
  $('tagline-input').onchange = () => { history.past.push(history.present); history.future = []; };
  $('heat-input').onchange = (ev) => {
    const next = cloneState(state);
    next.heat = Math.max(1, Math.min(5, Number(ev.target.value) || 5));
    commit(next, 'heat');
  };
  for (const key of ['showFurniture', 'showSeal', 'showBilling', 'showRating', 'showPlatforms', 'showBarcode', 'showQuote']) {
    const el = $('toggle-' + key);
    if (!el) continue;
    el.onchange = () => {
      const next = cloneState(state);
      next[key] = el.checked;
      commit(next, key);
    };
  }
}

// ---- self-test (?selftest=1) ----------------------------------------------

async function selfTest() {
  const checks = [];
  const check = (name, ok, detail = '') => checks.push({ name, ok: !!ok, detail });
  check('cast-8', CAST.length >= 8, `${CAST.length} cast members`);
  check('layouts-9', LAYOUTS.length === 9, `${LAYOUTS.length} layouts`);
  check('grades-9', GRADES.length === 9, `${GRADES.length} grades`);
  check('sizes-3', SIZES.length === 3, `${SIZES.length} post sizes`);
  check('fonts', document.fonts.check('16px Anton') && document.fonts.check('16px Pacifico'), 'Anton + Pacifico loaded');
  // Load every cast photo, not just the ones on the current layout:
  // the Pop-Out Hero layout has 7 panels, the cast has 8 faces.
  let loaded = 0;
  for (const member of CAST) {
    try { await loadImage(member.file); loaded++; } catch { /* counted below */ }
  }
  check('images', loaded === CAST.length, `${loaded}/${CAST.length} cast photos loaded`);
  const px = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let lit = 0;
  for (let i = 0; i < px.length; i += 400) if (px[i] + px[i + 1] + px[i + 2] > 60) lit++;
  check('cover-not-blank', lit > 50, `${lit} lit samples`);
  try {
    const blob = await exportCoverPNG(state, currentLayout(), currentGrade(), images, currentSize());
    check('export-png', blob.size > 20000, `${blob.size} bytes`);
  } catch (e) {
    check('export-png', false, String(e));
  }
  const ok = checks.every((c) => c.ok);
  const result = { ok, checks };
  window.__viceHeatSelftest = result;
  const box = $('selftest');
  if (box) {
    box.hidden = false;
    box.textContent = checks.map((c) => `${c.ok ? 'PASS' : 'FAIL'} ${c.name} — ${c.detail}`).join('\n');
  }
  return result;
}

// ---- boot ------------------------------------------------------------------

async function boot() {
  // URL presets: ?layout=popout&grade=sunset&size=portrait&shot=cover
  const layout = LAYOUT_BY_ID[params.get('layout')];
  const grade = GRADE_BY_ID[params.get('grade')];
  const size = SIZE_BY_ID[params.get('size')];
  if (layout) state.layoutId = layout.id;
  if (grade) state.gradeId = grade.id;
  if (size) state.sizeId = size.id;
  fillCast(state, currentLayout());
  if (SHOT === 'cover') document.body.classList.add('shot-cover');
  buildCastStrip();
  bindToolbar();
  syncControls();
  try {
    await document.fonts.load('16px Anton');
    await document.fonts.load('16px Pacifico');
    await document.fonts.ready;
  } catch { /* canvas falls back to sans-serif; the test below reports it */ }
  await reloadImages();
  window.__viceHeat = {
    get state() { return state; },
    layouts: LAYOUTS,
    grades: GRADES,
    cast: CAST,
    exportCoverPNG: (sizeId) => exportCoverPNG(state, currentLayout(), currentGrade(), images, SIZE_BY_ID[sizeId] || currentSize()),
    selfTest,
  };
  if (params.get('selftest') === '1') await selfTest();
  draw();
}

boot();

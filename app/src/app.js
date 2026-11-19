// Neon Coast Cover Studio — editor wiring.
// Owns the state, the photo library, undo/redo, panel dragging, exports and
// the ?shot= modes the maker uses for screenshots. The drawing itself lives
// in render.js; layouts in layouts.js; grades in grades.js.

import { GRADES } from "./grades.js";
import { LAYOUTS, layoutById } from "./layouts.js";
import { SIZES, renderCover, highlightSelectedPanel, panelAtPoint } from "./render.js";
import { panelRects } from "./layouts.js";

const $ = (id) => document.getElementById(id);

const SAMPLES = {
  boulevard: { name: "Boulevard", src: "samples/boulevard.jpg" },
  pier: { name: "Pier", src: "samples/pier.jpg" },
};

function defaultPanels() {
  return Array.from({ length: 9 }, () => ({ photo: -1, zoom: 1, ox: 0, oy: 0 }));
}

function defaultState() {
  return {
    layout: "hero-three",
    grade: "vice-sunset",
    size: "1080x1080",
    title: "NEON COAST",
    subtitle: "one last ride",
    badge: "LAUNCH WEEK",
    titleStyle: "white",
    heat: 4,
    grain: true,
    vignette: true,
    frame: true,
    ink: false,
    halftone: true,
    selectedPanel: 0,
    panels: defaultPanels(),
  };
}

let state = defaultState();
let photos = []; // { id, name, img }
let activePhoto = -1;
let undoStack = [];
let redoStack = [];
let renderQueued = false;
let drag = null;

const preview = $("preview");

// ---------- state helpers ----------

function snapshot() {
  return JSON.stringify(state);
}

function pushUndo() {
  undoStack.push(snapshot());
  if (undoStack.length > 80) undoStack.shift();
  redoStack = [];
  syncUndoButtons();
}

function restore(json) {
  state = JSON.parse(json);
  syncAllControls();
  scheduleRender();
}

function undo() {
  if (!undoStack.length) return;
  redoStack.push(snapshot());
  restore(undoStack.pop());
  syncUndoButtons();
}

function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot());
  restore(redoStack.pop());
  syncUndoButtons();
}

function syncUndoButtons() {
  $("undoBtn").disabled = !undoStack.length;
  $("redoBtn").disabled = !redoStack.length;
}

function mutate(fn, record = true) {
  if (record) pushUndo();
  fn();
  scheduleRender();
}

// ---------- rendering ----------

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    renderCover(preview, state, photos);
    highlightSelectedPanel(preview, state);
    $("panelLabel").textContent =
      `Panel ${state.selectedPanel + 1} · ${layoutById(state.layout).panelNames[state.selectedPanel] || ""}`;
    $("photoCount").textContent =
      `${photos.length} photo${photos.length === 1 ? "" : "s"} loaded`;
  });
}

// ---------- photos ----------

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function addPhotoFromSrc(src, name) {
  const img = await loadImage(src);
  const entry = { id: photos.length, name, img };
  photos.push(entry);
  activePhoto = entry.id;
  if (state.panels.every((p) => p.photo < 0)) {
    // First photo: fill every panel so one tap gives a finished cover.
    state.panels.forEach((p) => { p.photo = entry.id; });
  }
  renderPhotoStrip();
  syncPanelPhotoSelect();
  scheduleRender();
  return entry;
}

async function addPhotoFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    const url = URL.createObjectURL(file);
    try {
      await addPhotoFromSrc(url, file.name.replace(/\.[^.]+$/, ""));
    } catch {
      URL.revokeObjectURL(url);
    }
  }
}

function renderPhotoStrip() {
  const strip = $("photoStrip");
  strip.innerHTML = "";
  photos.forEach((p) => {
    const thumb = document.createElement("img");
    thumb.src = p.img.src;
    thumb.alt = p.name;
    thumb.title = p.name;
    if (p.id === activePhoto) thumb.classList.add("selected");
    thumb.addEventListener("click", () => {
      activePhoto = p.id;
      mutate(() => {
        state.panels[state.selectedPanel].photo = p.id;
      });
      renderPhotoStrip();
      syncPanelPhotoSelect();
    });
    strip.appendChild(thumb);
  });
}

function syncPanelPhotoSelect() {
  const sel = $("panelPhotoSelect");
  const current = state.panels[state.selectedPanel].photo;
  sel.innerHTML = "";
  const empty = document.createElement("option");
  empty.value = "-1";
  empty.textContent = "— Empty panel —";
  sel.appendChild(empty);
  photos.forEach((p) => {
    const opt = document.createElement("option");
    opt.value = String(p.id);
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  sel.value = String(current);
}

// ---------- choice grids ----------

function buildChoiceGrid(el, items, getId, onPick) {
  el.innerHTML = "";
  items.forEach((item) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "choice";
    btn.dataset.id = item.id;
    const swatch = document.createElement("span");
    swatch.className = "swatch";
    swatch.style.background = item.swatch;
    const name = document.createElement("span");
    name.className = "choice-name";
    name.textContent = item.name;
    const desc = document.createElement("span");
    desc.className = "choice-desc";
    desc.textContent = item.desc;
    btn.append(swatch, name, desc);
    btn.addEventListener("click", () => onPick(item.id));
    el.appendChild(btn);
  });
  const mark = () => {
    el.querySelectorAll(".choice").forEach((c) =>
      c.classList.toggle("active", c.dataset.id === getId()));
  };
  mark();
  return mark;
}

let markLayout;
let markGrade;

function buildControls() {
  markLayout = buildChoiceGrid(
    $("layoutGrid"),
    LAYOUTS.map((l) => ({
      id: l.id,
      name: l.name,
      desc: l.desc,
      swatch: "linear-gradient(135deg,#3a1c58,#ff2e88 55%,#ffc93c)",
    })),
    () => state.layout,
    (id) => mutate(() => {
      state.layout = id;
      state.selectedPanel = 0;
      syncPanelPhotoSelect();
      markLayout();
    }),
  );
  markGrade = buildChoiceGrid(
    $("gradeGrid"),
    GRADES,
    () => state.grade,
    (id) => mutate(() => {
      state.grade = id;
      markGrade();
    }),
  );
}

function syncAllControls() {
  $("titleInput").value = state.title;
  $("subtitleInput").value = state.subtitle;
  $("badgeInput").value = state.badge;
  $("titleStyleSelect").value = state.titleStyle;
  $("heatRange").value = String(state.heat);
  $("heatStars").textContent = "★".repeat(state.heat) + "☆".repeat(5 - state.heat);
  $("sizeSelect").value = state.size;
  $("grainCheck").checked = state.grain;
  $("vignetteCheck").checked = state.vignette;
  $("frameCheck").checked = state.frame;
  $("inkCheck").checked = state.ink;
  $("halftoneCheck").checked = state.halftone;
  $("zoomRange").value = String(Math.round((state.panels[state.selectedPanel].zoom || 1) * 100));
  if (markLayout) markLayout();
  if (markGrade) markGrade();
  renderPhotoStrip();
  syncPanelPhotoSelect();
}

// ---------- export ----------

function downloadCanvas(canvas, filename) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      resolve(blob);
    }, "image/png");
  });
}

async function exportSize(sizeId) {
  const keep = state.size;
  state.size = sizeId;
  const canvas = document.createElement("canvas");
  renderCover(canvas, state, photos);
  state.size = keep;
  scheduleRender();
  const [w, h] = SIZES[sizeId];
  await downloadCanvas(canvas, `neon-coast-cover-${w}x${h}.png`);
}

async function exportAllSizes() {
  for (const sizeId of Object.keys(SIZES)) {
    await exportSize(sizeId);
  }
}

// ---------- panel interaction ----------

function canvasPoint(event) {
  const rect = preview.getBoundingClientRect();
  const [W, H] = SIZES[state.size] || SIZES["1080x1080"];
  return {
    x: ((event.clientX - rect.left) / rect.width) * W,
    y: ((event.clientY - rect.top) / rect.height) * H,
    rect,
    W,
    H,
  };
}

function bindPreview() {
  preview.addEventListener("pointerdown", (event) => {
    const { x, y } = canvasPoint(event);
    const hit = panelAtPoint(state, x, y);
    if (hit < 0) return;
    preview.setPointerCapture(event.pointerId);
    if (hit !== state.selectedPanel) {
      mutate(() => { state.selectedPanel = hit; });
      syncPanelPhotoSelect();
      $("zoomRange").value = String(Math.round((state.panels[hit].zoom || 1) * 100));
    }
    // Snapshot before the drag, so undo restores the pre-drag position.
    drag = { x, y, panel: state.panels[hit], moved: false, before: snapshot() };
  });
  preview.addEventListener("pointermove", (event) => {
    if (!drag) return;
    const { x, y, W, H } = canvasPoint(event);
    const panel = drag.panel;
    const rects = panelRects(layoutById(state.layout), W, H);
    const r = rects[state.selectedPanel];
    if (!r) return;
    // Pan is a fraction of the panel's own size.
    panel.ox += (x - drag.x) / r.w;
    panel.oy += (y - drag.y) / r.h;
    panel.ox = Math.max(-1, Math.min(1, panel.ox));
    panel.oy = Math.max(-1, Math.min(1, panel.oy));
    if (Math.abs(x - drag.x) + Math.abs(y - drag.y) > 1) drag.moved = true;
    drag.x = x;
    drag.y = y;
    scheduleRender();
  });
  const endDrag = () => {
    if (drag && drag.moved) {
      undoStack.push(drag.before);
      if (undoStack.length > 80) undoStack.shift();
      redoStack = [];
      syncUndoButtons();
    }
    drag = null;
  };
  preview.addEventListener("pointerup", endDrag);
  preview.addEventListener("pointercancel", endDrag);
  preview.addEventListener("wheel", (event) => {
    event.preventDefault();
    const { x, y } = canvasPoint(event);
    const hit = panelAtPoint(state, x, y);
    if (hit < 0) return;
    const panel = state.panels[hit];
    const before = panel.zoom;
    panel.zoom = Math.max(0.5, Math.min(3, panel.zoom * (event.deltaY < 0 ? 1.08 : 0.93)));
    if (panel.zoom !== before) {
      if (hit === state.selectedPanel) {
        $("zoomRange").value = String(Math.round(panel.zoom * 100));
      }
      scheduleRender();
    }
  }, { passive: false });
}

// Text and range inputs mutate live while typing/dragging, so undo must keep
// the snapshot taken when the control gained focus, not the edited state.
let preEditSnapshot = null;
function armPreEdit() { preEditSnapshot = snapshot(); }
function commitPreEdit() {
  if (preEditSnapshot === null) return;
  undoStack.push(preEditSnapshot);
  if (undoStack.length > 80) undoStack.shift();
  redoStack = [];
  preEditSnapshot = null;
  syncUndoButtons();
}

// ---------- shot modes (for the maker's screenshots) ----------

async function runShotMode(params) {
  const mode = params.get("shot");
  if (!mode) return false;
  const size = params.get("size") || "1920x1080";
  if (SIZES[size]) state.size = size;
  if (params.get("layout")) state.layout = params.get("layout");
  if (params.get("grade")) state.grade = params.get("grade");
  if (params.get("caption")) state.title = params.get("caption");
  if (params.get("subtitle")) state.subtitle = params.get("subtitle");
  if (params.get("badge")) state.badge = params.get("badge");
  if (params.get("titleStyle")) state.titleStyle = params.get("titleStyle");
  if (params.get("ink") === "1") state.ink = true;
  const photo = params.get("photo");
  if (photo && SAMPLES[photo]) {
    await addPhotoFromSrc(SAMPLES[photo].src, SAMPLES[photo].name);
    // Second sample fills alternate panels for a multi-photo cover.
    if (params.get("photo2") && SAMPLES[params.get("photo2")]) {
      await addPhotoFromSrc(SAMPLES[params.get("photo2")].src, SAMPLES[params.get("photo2")].name);
      state.panels.forEach((p, i) => { p.photo = i % 2 === 0 ? 0 : 1; });
    }
  }
  await document.fonts.ready;
  if (mode === "cover") {
    document.querySelector(".topbar").hidden = true;
    document.querySelector(".workspace").hidden = true;
    const shot = $("shotMode");
    shot.hidden = false;
    const canvas = $("shotCanvas");
    renderCover(canvas, state, photos);
    document.title = "shot-ready";
    return true;
  }
  // editor shot: keep the editor visible with the photo loaded.
  syncAllControls();
  scheduleRender();
  await new Promise((r) => setTimeout(r, 120));
  document.title = "shot-ready";
  return true;
}

// ---------- wiring ----------

function bindControls() {
  $("addPhotosBtn").addEventListener("click", () => $("photoInput").click());
  $("photoInput").addEventListener("change", (e) => {
    addPhotoFiles(e.target.files);
    e.target.value = "";
  });
  $("sampleBoulevard").addEventListener("click", () =>
    addPhotoFromSrc(SAMPLES.boulevard.src, SAMPLES.boulevard.name));
  $("samplePier").addEventListener("click", () =>
    addPhotoFromSrc(SAMPLES.pier.src, SAMPLES.pier.name));
  $("fillAllBtn").addEventListener("click", () => {
    if (activePhoto < 0) return;
    mutate(() => state.panels.forEach((p) => { p.photo = activePhoto; }));
  });

  $("titleInput").addEventListener("focus", armPreEdit);
  $("titleInput").addEventListener("input", (e) => {
    commitPreEdit();
    mutate(() => { state.title = e.target.value; }, false);
  });
  $("subtitleInput").addEventListener("focus", armPreEdit);
  $("subtitleInput").addEventListener("input", (e) => {
    commitPreEdit();
    mutate(() => { state.subtitle = e.target.value; }, false);
  });
  $("badgeInput").addEventListener("focus", armPreEdit);
  $("badgeInput").addEventListener("input", (e) => {
    commitPreEdit();
    mutate(() => { state.badge = e.target.value; }, false);
  });
  $("titleStyleSelect").addEventListener("change", (e) => mutate(() => { state.titleStyle = e.target.value; }));
  $("heatRange").addEventListener("focus", armPreEdit);
  $("heatRange").addEventListener("input", (e) => {
    commitPreEdit();
    state.heat = Number(e.target.value);
    $("heatStars").textContent = "★".repeat(state.heat) + "☆".repeat(5 - state.heat);
    scheduleRender();
  });
  $("sizeSelect").addEventListener("change", (e) => mutate(() => { state.size = e.target.value; }));

  $("panelPhotoSelect").addEventListener("change", (e) => {
    const id = Number(e.target.value);
    mutate(() => { state.panels[state.selectedPanel].photo = id; });
    if (id >= 0) activePhoto = id;
    renderPhotoStrip();
  });
  $("zoomRange").addEventListener("focus", armPreEdit);
  $("zoomRange").addEventListener("input", (e) => {
    commitPreEdit();
    state.panels[state.selectedPanel].zoom = Number(e.target.value) / 100;
    scheduleRender();
  });
  $("centerBtn").addEventListener("click", () =>
    mutate(() => {
      const p = state.panels[state.selectedPanel];
      p.ox = 0;
      p.oy = 0;
    }));
  $("resetPanelBtn").addEventListener("click", () =>
    mutate(() => {
      state.panels[state.selectedPanel] = { photo: -1, zoom: 1, ox: 0, oy: 0 };
      syncPanelPhotoSelect();
    }));

  $("grainCheck").addEventListener("change", (e) => mutate(() => { state.grain = e.target.checked; }));
  $("vignetteCheck").addEventListener("change", (e) => mutate(() => { state.vignette = e.target.checked; }));
  $("frameCheck").addEventListener("change", (e) => mutate(() => { state.frame = e.target.checked; }));
  $("inkCheck").addEventListener("change", (e) => mutate(() => { state.ink = e.target.checked; }));
  $("halftoneCheck").addEventListener("change", (e) => mutate(() => { state.halftone = e.target.checked; }));

  $("undoBtn").addEventListener("click", undo);
  $("redoBtn").addEventListener("click", redo);
  $("exportBtn").addEventListener("click", () => exportSize(state.size));
  $("exportAllBtn").addEventListener("click", exportAllSizes);

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
      e.preventDefault();
      redo();
    }
  });
}

async function init() {
  buildControls();
  bindControls();
  bindPreview();
  syncAllControls();
  syncUndoButtons();
  // Warm the lettering fonts before the first paint.
  try {
    await Promise.all([
      document.fonts.load('40px "Anton"'),
      document.fonts.load('40px "Pacifico"'),
      document.fonts.load('40px "Bebas Neue"'),
    ]);
  } catch { /* fonts fall back; the render still works */ }
  const shot = await runShotMode(new URLSearchParams(location.search));
  if (!shot) {
    // Fresh editor: preload the pier sample so the first paint is a cover.
    addPhotoFromSrc(SAMPLES.pier.src, SAMPLES.pier.name).catch(() => scheduleRender());
    scheduleRender();
  }
  // For automated checks and debugging.
  window.__studio = { get state() { return state; }, get photos() { return photos; }, render: scheduleRender };
}

init();

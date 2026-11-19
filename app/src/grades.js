// Colour grades for Vice Panel Studio.
// A grade is a sunset/neon wash laid over each panel's photo: a two-stop
// gradient blended with 'overlay', a soft-light colour wash, and an optional
// desaturation pass. All four grades are our own palettes, drawn with canvas
// compositing only -- no photo filters, no network, nothing to download.

export const GRADES = [
  {
    id: 'sunset',
    name: 'Vice Sunset',
    blurb: 'Warm amber to coral pink, the golden-hour poster look.',
    top: '#ffb347',
    bottom: '#ff5e78',
    wash: '#3d1e5c',
    washAlpha: 0.28,
    overlayAlpha: 0.55,
    sat: 1,
  },
  {
    id: 'neon',
    name: 'Neon Nights',
    blurb: 'Hot pink over electric cyan, wet neon street at midnight.',
    top: '#ff2ea6',
    bottom: '#19c8ff',
    wash: '#0b1035',
    washAlpha: 0.34,
    overlayAlpha: 0.6,
    sat: 1,
  },
  {
    id: 'noir',
    name: 'Palm Noir',
    blurb: 'High-contrast monochrome with a warm paper highlight.',
    top: '#f5efe2',
    bottom: '#151515',
    wash: '#000000',
    washAlpha: 0.3,
    overlayAlpha: 0.4,
    sat: 0.18,
  },
  {
    id: 'bubble',
    name: 'Bubblegum',
    blurb: 'Bright bubblegum pink over sky blue, loud and poppy.',
    top: '#ff7ad9',
    bottom: '#7ad9ff',
    wash: '#ff5fa2',
    washAlpha: 0.3,
    overlayAlpha: 0.5,
    sat: 1.15,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

// Paint a grade over the rectangle (x, y, w, h) of ctx. Call it while the
// panel photo is already drawn and clipped to the panel; it only tints.
export function applyGrade(ctx, grade, x, y, w, h) {
  ctx.save();
  const grad = ctx.createLinearGradient(x, y, x, y + h);
  grad.addColorStop(0, grade.top);
  grad.addColorStop(1, grade.bottom);
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = grade.overlayAlpha;
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.globalCompositeOperation = 'soft-light';
  ctx.globalAlpha = grade.washAlpha;
  ctx.fillStyle = grade.wash;
  ctx.fillRect(x, y, w, h);
  if (grade.sat !== 1) {
    // A grey fill under 'saturation' pulls the photo toward (sat < 1) or
    // away from (sat > 1) monochrome, in proportion to the alpha.
    ctx.globalCompositeOperation = 'saturation';
    ctx.globalAlpha = grade.sat < 1 ? 1 - grade.sat : Math.min(1, grade.sat - 1);
    ctx.fillStyle = grade.sat < 1 ? '#808080' : '#ff8080';
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

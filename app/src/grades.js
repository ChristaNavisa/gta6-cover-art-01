// Colour grades for Vice Panel Studio.
//
// A grade is a sunset or neon wash drawn over each panel: a vertical
// gradient blended with 'overlay', a soft tint with 'soft-light', and the
// lettering colours the title block uses. Every grade keeps the photos
// readable while giving the cover its Vice City dusk or neon-night mood.

export const GRADES = {
  'vice-sunset': {
    label: 'Vice Sunset',
    top: '#ffb347',
    bottom: '#ff2d78',
    tint: '#ff7e3d',
    tintAlpha: 0.16,
    title: '#ffffff',
    subtitle: '#ffd76a',
    star: '#ffd76a',
    frame: '#1a0b2e',
  },
  'neon-nights': {
    label: 'Neon Nights',
    top: '#19e3ff',
    bottom: '#ff2bd6',
    tint: '#19c8ff',
    tintAlpha: 0.14,
    title: '#eafcff',
    subtitle: '#7df9ff',
    star: '#7df9ff',
    frame: '#04121f',
  },
  'palm-noir': {
    label: 'Palm Noir',
    top: '#3a3f4d',
    bottom: '#0b0b10',
    tint: '#8a93b8',
    tintAlpha: 0.12,
    title: '#ffffff',
    subtitle: '#d8d8e0',
    star: '#e8e8f0',
    frame: '#000000',
  },
  bubblegum: {
    label: 'Bubblegum',
    top: '#ffb3d9',
    bottom: '#7b5cff',
    tint: '#ff9ed2',
    tintAlpha: 0.15,
    title: '#ffffff',
    subtitle: '#ffe9f6',
    star: '#fff3b0',
    frame: '#2e1040',
  },
};

/** The grade ids, in the order the editor shows them. */
export const GRADE_IDS = Object.keys(GRADES);

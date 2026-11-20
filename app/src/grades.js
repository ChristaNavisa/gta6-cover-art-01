// Vice Heat — the nine colour grades. Each grade is three things at once:
// a canvas filter for the photos, a translucent tint washed over the
// whole poster, and the banded gradient the giant title is filled with.
// Noir is a true black-and-white grade: saturate(0), no colour tint.

// A title gradient is a list of [stop, colour] pairs. Hard stops (two
// stops at the same position) make the striped bands the winners use.
export const GRADES = [
  {
    id: 'sunset',
    name: 'Sunset',
    filter: 'saturate(1.32) contrast(1.08) sepia(0.16) brightness(1.02)',
    tint: { top: 'rgba(255,122,24,0.10)', bottom: 'rgba(255,46,136,0.12)' },
    title: [[0, '#ffe259'], [0.34, '#ffe259'], [0.34, '#ff7a18'], [0.67, '#ff7a18'], [0.67, '#ff2e88'], [1, '#ff2e88']],
    vignette: 0.28,
  },
  {
    id: 'viceneon',
    name: 'Vice Neon',
    filter: 'saturate(1.45) contrast(1.12) brightness(1.03)',
    tint: { top: 'rgba(255,46,136,0.12)', bottom: 'rgba(0,229,255,0.10)' },
    title: [[0, '#7df9ff'], [0.34, '#7df9ff'], [0.34, '#ff2e88'], [0.67, '#ff2e88'], [0.67, '#ffe259'], [1, '#ffe259']],
    vignette: 0.30,
  },
  {
    id: 'golden',
    name: 'Golden Hour',
    filter: 'saturate(1.25) sepia(0.30) brightness(1.06) contrast(1.04)',
    tint: { top: 'rgba(255,210,62,0.12)', bottom: 'rgba(255,140,0,0.10)' },
    title: [[0, '#fff3b0'], [0.5, '#ffd23e'], [0.5, '#ff9e00'], [1, '#ff9e00']],
    vignette: 0.24,
  },
  {
    id: 'tealorange',
    name: 'Teal & Orange',
    filter: 'saturate(1.35) contrast(1.16) brightness(1.0)',
    tint: { top: 'rgba(0,180,180,0.10)', bottom: 'rgba(255,110,20,0.12)' },
    title: [[0, '#9ff5e8'], [0.5, '#9ff5e8'], [0.5, '#ff8c42'], [1, '#ff8c42']],
    vignette: 0.26,
  },
  {
    id: 'bubblegum',
    name: 'Bubblegum',
    filter: 'saturate(1.55) hue-rotate(-14deg) brightness(1.07) contrast(1.05)',
    tint: { top: 'rgba(255,120,200,0.12)', bottom: 'rgba(255,46,136,0.10)' },
    title: [[0, '#ffd6f2'], [0.34, '#ffd6f2'], [0.34, '#ff7ad9'], [0.67, '#ff7ad9'], [0.67, '#ff2e88'], [1, '#ff2e88']],
    vignette: 0.22,
  },
  {
    id: 'noir',
    name: 'Noir B&W',
    filter: 'saturate(0) contrast(1.28) brightness(1.03)',
    tint: { top: 'rgba(255,255,255,0.05)', bottom: 'rgba(0,0,0,0.10)' },
    title: [[0, '#ffffff'], [0.5, '#ffffff'], [0.5, '#c9c9c9'], [1, '#c9c9c9']],
    vignette: 0.34,
  },
  {
    id: 'smog',
    name: 'Smog',
    filter: 'saturate(0.85) contrast(0.94) brightness(0.99) sepia(0.14)',
    tint: { top: 'rgba(160,170,150,0.10)', bottom: 'rgba(70,80,70,0.12)' },
    title: [[0, '#e8e6d5'], [0.5, '#e8e6d5'], [0.5, '#9aa78f'], [1, '#9aa78f']],
    vignette: 0.30,
  },
  {
    id: 'heatwave',
    name: 'Heatwave',
    filter: 'saturate(1.5) contrast(1.10) sepia(0.26) brightness(1.03)',
    tint: { top: 'rgba(255,60,20,0.13)', bottom: 'rgba(255,150,0,0.10)' },
    title: [[0, '#fff1a8'], [0.34, '#fff1a8'], [0.34, '#ff6b35'], [0.67, '#ff6b35'], [0.67, '#d7263d'], [1, '#d7263d']],
    vignette: 0.26,
  },
  {
    id: 'palmshade',
    name: 'Palm Shade',
    filter: 'saturate(1.18) contrast(1.06) brightness(0.97) hue-rotate(8deg)',
    tint: { top: 'rgba(0,200,160,0.09)', bottom: 'rgba(0,60,50,0.12)' },
    title: [[0, '#d8fff2'], [0.5, '#d8fff2'], [0.5, '#2ec4b6'], [1, '#2ec4b6']],
    vignette: 0.30,
  },
];

export const GRADE_BY_ID = Object.fromEntries(GRADES.map((g) => [g.id, g]));

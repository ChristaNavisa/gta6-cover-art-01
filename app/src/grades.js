// Vice Panel Studio — colour grades.
//
// A grade is the whole look of a cover: the tint washed over every panel,
// the chrome the title is lettered in, the neon of the subtitle, the gold of
// the rule and the stars, and how hard the grain and vignette bite. Four
// grades, each a different Vice City hour.

export const GRADES = [
  {
    id: 'neon-sunset',
    name: 'Neon Sunset',
    blurb: 'Pink hour over the bay — hot magenta into orange.',
    tintTop: '#ff2e88',
    tintBottom: '#ff9a3d',
    tintAlpha: 0.24,
    titleStops: ['#ffffff', '#ffd166', '#ff2e88', '#7b2ff7'],
    subtitle: '#39e6ff',
    rule: '#ffd166',
    star: '#ffd166',
    chip: '#ff2e88',
    vignette: 0.34,
    grain: 0.05,
  },
  {
    id: 'vice-gold',
    name: 'Vice Gold',
    blurb: 'Late gold light — amber, brass and warm cream.',
    tintTop: '#ffb703',
    tintBottom: '#fb8500',
    tintAlpha: 0.2,
    titleStops: ['#fff8e1', '#ffd166', '#ffb703', '#b45309'],
    subtitle: '#ffe8a3',
    rule: '#ffb703',
    star: '#ffd166',
    chip: '#b45309',
    vignette: 0.3,
    grain: 0.04,
  },
  {
    id: 'palm-teal',
    name: 'Palm Teal',
    blurb: 'After dark on the water — teal, cyan and deep blue.',
    tintTop: '#06d6a0',
    tintBottom: '#118ab2',
    tintAlpha: 0.24,
    titleStops: ['#e0fbfc', '#98f5e1', '#06d6a0', '#073b4c'],
    subtitle: '#90e0ef',
    rule: '#06d6a0',
    star: '#ffd166',
    chip: '#118ab2',
    vignette: 0.38,
    grain: 0.05,
  },
  {
    id: 'retro-chrome',
    name: 'Retro Chrome',
    blurb: 'Chrome and bubblegum — silver, pink and mirror shine.',
    tintTop: '#c0c0c8',
    tintBottom: '#ff70a6',
    tintAlpha: 0.18,
    titleStops: ['#ffffff', '#e8e8ef', '#ff70a6', '#8d99ae'],
    subtitle: '#ff8fab',
    rule: '#e8e8ef',
    star: '#ffd166',
    chip: '#8d99ae',
    vignette: 0.28,
    grain: 0.06,
  },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) ?? GRADES[0];
}

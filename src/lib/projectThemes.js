/** Per-project accent colors — matched to each app's visual identity. */
export const PROJECT_THEMES = {
  0: { accent: '#73bfc4', soft: 'rgb(115 191 196 / 0.78)' }, // OSAC GMS — teal workshop
  1: { accent: '#d946ef', soft: 'rgb(217 70 239 / 0.78)' }, // Picksy — neon purple
  2: { accent: '#60a5fa', soft: 'rgb(96 165 250 / 0.78)' }, // NextOffer — SaaS blue
  3: { accent: '#fb923c', soft: 'rgb(251 146 60 / 0.78)' }, // Waya Waya — warm rewards
  4: { accent: '#f97316', soft: 'rgb(249 115 22 / 0.78)' }, // UJ WayFinder — campus orange
  5: { accent: '#f472b6', soft: 'rgb(244 114 182 / 0.78)' }, // Safe Again — rose safety
  6: { accent: '#a8b4c8', soft: 'rgb(168 180 200 / 0.78)' }, // Nanda — enterprise slate
};

export function projectTheme(projectId) {
  return PROJECT_THEMES[projectId] ?? PROJECT_THEMES[0];
}

/** ShaderGradient-style triplets for bg tint while each project is active. */
export const PROJECT_PALETTES = {
  0: { color1: '#5eb8d4', color2: '#73bfc4', color3: '#8da0ce' },
  1: { color1: '#7c3aed', color2: '#d946ef', color3: '#f472b6' },
  2: { color1: '#3b82f6', color2: '#60a5fa', color3: '#8da0ce' },
  3: { color1: '#ea580c', color2: '#fb923c', color3: '#fbbf24' },
  4: { color1: '#c2410c', color2: '#f97316', color3: '#fdba74' },
  5: { color1: '#db2777', color2: '#f472b6', color3: '#8da0ce' },
  6: { color1: '#64748b', color2: '#94a3b8', color3: '#cbd5e1' },
};

export function projectPalette(projectId) {
  return PROJECT_PALETTES[projectId] ?? PROJECT_PALETTES[0];
}

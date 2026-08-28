/** Portfolio journey — scroll order = card order. */
export const JOURNEY_SLIDES = [
  { id: 'home', hash: '#home', label: 'Intro', index: '00' },
  { id: 'journey', hash: '#journey', label: 'Journey', index: '01' },
  { id: 'work', hash: '#work', label: 'Projects', index: '02', isProjectAnchor: true },
  { id: 'build', hash: '#build', label: 'Build', index: '03' },
  { id: 'about', hash: '#about', label: 'Story', index: '04' },
  { id: 'contact', hash: '#contact', label: 'Contact', index: '05' },
];

/** Intro → Journey → each project → How I Build → Story → Contact */
export function buildJourneyCards(projects) {
  const cards = [
    { id: 'home', hash: '#home', label: 'Intro', index: '00', type: 'intro' },
    { id: 'journey', hash: '#journey', label: 'Journey', index: '01', type: 'journey' },
  ];

  projects.forEach((project, i) => {
    const n = String(i + 2).padStart(2, '0');
    cards.push({
      id: `project-${project.id}`,
      hash: i === 0 ? '#work' : `#project-${project.id}`,
      label: project.name,
      index: n,
      type: 'project',
      project,
      projectIndex: i,
    });
  });

  const buildN = String(projects.length + 2).padStart(2, '0');
  const storyN = String(projects.length + 3).padStart(2, '0');
  const contactN = String(projects.length + 4).padStart(2, '0');

  cards.push(
    { id: 'build', hash: '#build', label: 'How I Build', index: buildN, type: 'build' },
    { id: 'about', hash: '#about', label: 'Story', index: storyN, type: 'story' },
    { id: 'contact', hash: '#contact', label: 'Contact', index: contactN, type: 'contact' }
  );

  return cards;
}

export function slideIndexFromHash(hash, cards) {
  if (!hash || hash === '#') return 0;
  const normalized = hash.startsWith('#') ? hash : `#${hash}`;
  const list = cards ?? JOURNEY_SLIDES;
  const byHash = list.findIndex((s) => s.hash === normalized);
  if (byHash >= 0) return byHash;
  const byId = list.findIndex((s) => s.id === normalized.slice(1));
  return byId >= 0 ? byId : 0;
}

export function slideHashFromIndex(index, cards) {
  const list = cards ?? JOURNEY_SLIDES;
  const slide = list[Math.max(0, Math.min(list.length - 1, index))];
  return slide?.hash ?? '#home';
}

/** About me — single scroll-driven paragraph in the process scene. */
export const ABOUT_PARAGRAPH =
  "I'm a Flutter developer in Pune. Five years shipping mobile products, with live apps around the globe. From first sketch to App Store release, I work with founders end-to-end.";

/** @deprecated Use ABOUT_PARAGRAPH — kept for reference only. */
export const ABOUT_LINES = [
  "I'm a Flutter developer in Pune.",
  'Five years shipping mobile products.',
  'Live apps around the globe.',
  'From first sketch to App Store release.',
  'I work with founders end-to-end.',
];

export const BUILD_STEPS = [
  {
    title: 'Think',
    desc: 'Clarify the problem, users, and constraints before a single screen is drawn.',
  },
  {
    title: 'Design',
    desc: 'Shape flows in Figma—clear hierarchy, calm UI, and decisions that survive real devices.',
  },
  {
    title: 'Build',
    desc: 'Ship production Flutter, React Native, and web with architecture that can grow.',
  },
  {
    title: 'Ship',
    desc: 'App Store, Play Console, TestFlight, CI—release without drama.',
  },
  {
    title: 'Iterate',
    desc: 'Watch how people use it, fix what breaks, and keep the product steady in the wild.',
  },
];

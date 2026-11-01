export const ABOUT_WORD = 'SATYAM';
export const ABOUT_HELLO = 'HELLO';
export const ABOUT_REEL_LABEL = 'PLAY SHOWREEL';

export const ABOUT_MANIFESTO =
  'SATYAM TIWARI© is a Flutter developer in Pune crafting live mobile products where design, engineering & storytelling merge into apps people actually use.';

/** Line under the SATYAM word — gifs + cycling words. */
export const ABOUT_STORY = [
  { type: 'text', text: 'SATYAM TIWARI© is a Flutter developer in Pune' },
  { type: 'gif', i: 0 },
  { type: 'text', text: 'crafting' },
  { type: 'cycle', words: ['apps', 'products', 'tools'] },
  { type: 'gif', i: 1 },
  { type: 'text', text: 'from first sketch to the store' },
  { type: 'gif', i: 2 },
  { type: 'text', text: 'for founders,' },
  { type: 'cycle', words: ['worldwide', 'end to end', 'that ship'] },
  { type: 'text', text: '.' },
];

export const ABOUT_SERVICES = [
  {
    title: 'Product design',
    items: ['UX Strategy', 'User Flows', 'UI Design', 'Interaction Design', 'Design Systems'],
  },
  {
    title: 'Mobile engineering',
    items: ['Flutter & Dart', 'iOS / Android', 'Offline-first', 'Firebase', 'App Store / Play'],
  },
  {
    title: 'Digital products',
    items: ['Consumer Apps', 'Operations Tools', 'AI Products', 'Rewards / Loyalty', 'Platforms'],
  },
  {
    title: 'How I work',
    items: [
      'End-to-end ownership',
      'Founder collaboration',
      'Sketch to release',
      'Live worldwide',
      'Long-term retain',
    ],
  },
];

export const ABOUT_CLOSE = {
  credit: '©Satyam Tiwari',
  line1: 'BASED IN PUNE.',
  line2: 'AVAILABLE WORLDWIDE.',
  line3: 'Flutter, Firebase, Product.',
};

function yearFromMeta(meta = '') {
  const match = String(meta).match(/\b(20\d{2})\b/);
  return match ? match[1] : '—';
}

function statusFromMeta(meta = '') {
  if (/live/i.test(meta)) return 'Live';
  if (/pre-production|in progress/i.test(meta)) return 'In progress';
  if (/concept/i.test(meta)) return 'Concept';
  return 'Shipped';
}

function stackFromMeta(meta = '') {
  const chunk = String(meta).split('·')[1];
  return chunk ? chunk.trim() : 'Product';
}

export function shippedFromProjects(projects = []) {
  return projects.map((project) => ({
    year: yearFromMeta(project.meta),
    name: project.name,
    detail: `${stackFromMeta(project.meta)} ${statusFromMeta(project.meta)}`.trim(),
    slug: project.slug,
  }));
}

export function aboutMediaFromProjects(projects = []) {
  const items = [];
  for (const project of projects) {
    if (project.video) {
      items.push({
        kind: 'video',
        src: project.video,
        poster: project.previewImage || project.image,
        name: project.name,
      });
    } else if (project.image) {
      items.push({
        kind: 'image',
        src: project.image,
        poster: project.image,
        name: project.name,
      });
    }
    if (items.length >= 4) break;
  }
  return items;
}

/** Distinct looping clips for the About Us sentence — product UI, not the same stills. */
export function aboutGifsFromProjects(projects = []) {
  const gifs = [];
  const seen = new Set();
  const push = (item) => {
    if (!item?.src || seen.has(item.src)) return;
    seen.add(item.src);
    gifs.push(item);
  };

  const withVideo = projects.find((project) => project.video);
  if (withVideo) {
    push({
      kind: 'video',
      src: withVideo.video,
      poster: withVideo.previewImage || withVideo.gallery?.[0] || withVideo.image,
      name: withVideo.name,
    });
  }

  push({ kind: 'video', src: '/media/journey.mp4', poster: null, name: 'Journey' });

  for (const project of projects) {
    const shot = project.gallery?.[0] || project.previewImage;
    if (shot) push({ kind: 'image', src: shot, poster: shot, name: project.name });
    if (gifs.length >= 4) break;
  }

  return gifs.slice(0, 4);
}

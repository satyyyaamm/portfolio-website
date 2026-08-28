/**
 * Scroll timeline — intro/journey full mesh → shrink to device → projects →
 * expand mesh again for process/story/faq/contact.
 *
 * Chapters are authored in vh (SCENE_VH) and divided into the shares that the
 * rest of the app consumes. Writing them in vh keeps each chapter's physical
 * scroll length readable and means adding scroll to one chapter never requires
 * rescaling the other eleven by hand — the overlaps are real distances, not
 * fractions that have to be kept in sync.
 *
 * Keep chapter lengths comparable so wheel speed feels consistent, and give
 * each project enough distance that fast scrolling doesn't skip it.
 */
const SCENE_VH = {
  intro: [0, 59.2],
  /** Long band — the video needs room for the tech words to land one at a time. */
  journey: [37, 356.6],
  /** Mesh collapses into the device after journey; starts while journey is still up. */
  shrink: [327, 401],
  projectsStart: 386.2,
  /** Very long band — camera pans + project focus need room to breathe. */
  projectsEnd: 1370.4,
  /** Mesh blooms back from center after projects. */
  expand: [1348.2, 1422.2],
  process: [1400, 1491.76],
  /** Starts when About me is fully gone — story slides R→L across the viewport. */
  story: [1491.76, 1570.2],
  /** Resume / Upwork — only after story text has exited left. */
  storyCta: [1570.2, 1633.84],
  faq: [1633.84, 1684.16],
  contact: [1669.36, 1696],
};

export const SCROLL_TRACK_VH = 1696;

export const SCENE = Object.fromEntries(
  Object.entries(SCENE_VH).map(([key, value]) => [
    key,
    Array.isArray(value)
      ? [value[0] / SCROLL_TRACK_VH, value[1] / SCROLL_TRACK_VH]
      : value / SCROLL_TRACK_VH,
  ])
);

/** Phase breakpoints inside one project slot (local 0→1).
 * Travel (pan) and zoom (photo → frame) share equal scroll length so they feel like one speed.
 */
export const PROJECT_PHASE = {
  travelEnd: 0.34,
  zoomEnd: 0.68,
  holdEnd: 0.86,
};

/** 0 = full-bleed mesh, 1 = device-sized portal. */
export function portalCompactAt(p) {
  const [s0, s1] = SCENE.shrink;
  const [e0, e1] = SCENE.expand;
  if (p <= s0) return 0;
  if (p < s1) return (p - s0) / (s1 - s0);
  if (p <= e0) return 1;
  if (p < e1) return 1 - (p - e0) / (e1 - e0);
  return 0;
}

/**
 * Sequential project windows — short crossfade only.
 */
export function projectRange(index, count) {
  const n = Math.max(count, 1);
  const { projectsStart, projectsEnd } = SCENE;
  const span = projectsEnd - projectsStart;
  const slot = span / n;
  const fade = slot * 0.18;
  const start = projectsStart + index * slot;
  const end = projectsStart + (index + 1) * slot;
  return [
    index === 0 ? start : start - fade * 0.45,
    index === n - 1 ? end : end + fade * 0.45,
  ];
}

/** Hard (non-overlapping) slot for camera phase math. */
export function projectSlot(index, count) {
  const n = Math.max(count, 1);
  const { projectsStart, projectsEnd } = SCENE;
  const span = projectsEnd - projectsStart;
  const slot = span / n;
  const start = projectsStart + index * slot;
  return [start, start + slot];
}

export function activeProjectIndex(p, count) {
  const n = Math.max(count, 1);
  const { projectsStart, projectsEnd } = SCENE;
  if (p < projectsStart) return 0;
  if (p >= projectsEnd) return n - 1;
  const span = projectsEnd - projectsStart;
  return Math.min(n - 1, Math.max(0, Math.floor(((p - projectsStart) / span) * n)));
}

/** Local 0→1 progress inside a project's hard slot. */
export function projectLocalT(p, index, count) {
  const [start, end] = projectSlot(index, count);
  if (p <= start) return 0;
  if (p >= end) return 1;
  return (p - start) / Math.max(0.001, end - start);
}

/**
 * Phase amounts for hybrid camera → device morph.
 * deviceAmount: 0 while traveling the grid, 1 while device is settled.
 */
export function projectPhase(p, index, count) {
  const localT = projectLocalT(p, index, count);
  const { travelEnd, zoomEnd, holdEnd } = PROJECT_PHASE;

  let travel = 1;
  let zoom = 1;
  let hold = 0;
  let pull = 0;
  let deviceAmount = 0;

  if (localT < travelEnd) {
    travel = localT / travelEnd;
    zoom = 0;
    deviceAmount = 0;
  } else if (localT < zoomEnd) {
    travel = 1;
    zoom = (localT - travelEnd) / Math.max(0.001, zoomEnd - travelEnd);
    deviceAmount = zoom;
  } else if (localT < holdEnd) {
    travel = 1;
    zoom = 1;
    hold = (localT - zoomEnd) / Math.max(0.001, holdEnd - zoomEnd);
    deviceAmount = 1;
  } else {
    travel = 1;
    zoom = 1;
    hold = 1;
    pull = (localT - holdEnd) / Math.max(0.001, 1 - holdEnd);
    deviceAmount = 1 - pull;
  }

  return { localT, travel, zoom, hold, pull, deviceAmount };
}

/** Device opacity for the active project at scroll progress (0 outside projects). */
export function projectDeviceAmount(p, count) {
  const n = Math.max(count, 1);
  const { projectsStart, projectsEnd } = SCENE;
  if (p < projectsStart || p > projectsEnd) return 0;
  const idx = activeProjectIndex(p, n);
  return projectPhase(p, idx, n).deviceAmount;
}

/** Gated morph amount — matches DevicePortal / grid handoff timing. */
export function projectMorphAmount(p, count) {
  const c = portalCompactAt(p);
  if (c < 0.45) return 0;
  const gate = c < 0.75 ? (c - 0.45) / 0.3 : 1;
  if (p < SCENE.projectsStart) return 0;
  if (p > SCENE.projectsEnd) return gate * projectDeviceAmount(SCENE.projectsEnd, count);
  return gate * projectDeviceAmount(p, count);
}

/** Sequential beats inside a scene (journey words, process steps, story lines). */
export function beatRange(sceneRange, index, count, { fade = 0.18 } = {}) {
  const [sceneStart, sceneEnd] = sceneRange;
  const n = Math.max(count, 1);
  const span = sceneEnd - sceneStart;
  const slot = span / n;
  const soft = slot * fade;
  const start = sceneStart + index * slot;
  const end = sceneStart + (index + 1) * slot;
  return [
    index === 0 ? start : start - soft * 0.4,
    index === n - 1 ? end : end + soft * 0.4,
  ];
}

export function progressForHash(hash, projectCount, projects = []) {
  if (!hash || hash === '#' || hash === '#home') return SCENE.intro[0] + 0.02;
  const id = hash.replace(/^#/, '');
  if (id === 'journey') return SCENE.journey[0] + 0.03;
  if (id === 'work') return SCENE.projectsStart + 0.02;
  if (id === 'build' || id === 'services') return SCENE.process[0] + 0.025;
  if (id === 'about') return SCENE.story[0] + 0.025;
  if (id === 'faq') return SCENE.faq[0] + 0.03;
  if (id === 'contact') return SCENE.contact[0] + 0.03;
  const m = id.match(/^project-(.+)$/);
  if (m && projects.length) {
    const idx = projects.findIndex((proj) => String(proj.id) === m[1]);
    if (idx >= 0) {
      const [start, end] = projectSlot(idx, projects.length);
      // Land in hold phase so device + copy are settled
      return start + (end - start) * 0.7;
    }
  }
  return 0;
}

export function hashForProgress(p, projects = []) {
  if (p < SCENE.journey[0]) return '#home';
  if (p < SCENE.projectsStart) return '#journey';
  if (p < SCENE.expand[0]) {
    const count = projects.length || 1;
    const idx = activeProjectIndex(p, count);
    if (idx === 0) return '#work';
    return `#project-${projects[idx]?.id ?? idx}`;
  }
  if (p < SCENE.story[0]) return '#build';
  if (p < SCENE.faq[0]) return '#about';
  if (p < SCENE.contact[0]) return '#faq';
  return '#contact';
}

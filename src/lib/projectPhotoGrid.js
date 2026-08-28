import {
  SCENE,
  PROJECT_PHASE,
  activeProjectIndex,
} from './scrollTimeline.js';

/**
 * Seeded photo-grid layout for the hybrid project camera.
 * Organic scattered positions; collision resolve / skip so tiles never stack.
 */

const WORLD = { w: 3200, h: 2200 };
const HERO_W = 420;
const HERO_H = 520;
const AMBIENT_W = 280;
const AMBIENT_H = 360;
const MAX_TILES = 34;
const GAP = 40;

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function heroSrc(project) {
  return project.previewImage ?? project.image;
}

function heroSize(project) {
  const isWeb = project.previewFrame === 'web';
  return {
    w: isWeb ? HERO_W * 1.15 : HERO_W * 0.72,
    h: isWeb ? HERO_H * 0.72 : HERO_H,
  };
}

/** Scattered hero path — same feel as before. */
function heroBasePosition(index, count, rand) {
  const n = Math.max(count, 1);
  const t = n === 1 ? 0.5 : index / (n - 1);
  const x = (t - 0.5) * WORLD.w * 0.52 + (rand() - 0.5) * 60;
  const row = index % 2 === 0 ? -1 : 1;
  const y = row * WORLD.h * 0.14 + (t - 0.5) * WORLD.h * 0.16 + (rand() - 0.5) * 48;
  return { x, y };
}

function overlaps(a, b, pad = GAP) {
  return !(
    a.x + a.w / 2 + pad < b.x - b.w / 2 ||
    a.x - a.w / 2 - pad > b.x + b.w / 2 ||
    a.y + a.h / 2 + pad < b.y - b.h / 2 ||
    a.y - a.h / 2 - pad > b.y + b.h / 2
  );
}

/**
 * Keep preferred (x,y) when free; otherwise nudge outward until clear.
 * Returns null if no non-stacking spot is found (caller should skip).
 */
function resolveNoStack(x, y, w, h, occupied, rand) {
  const preferred = { x, y, w, h };
  if (!occupied.some((o) => overlaps(preferred, o))) return preferred;

  for (let attempt = 0; attempt < 64; attempt += 1) {
    const angle = rand() * Math.PI * 2;
    const dist = GAP + 20 + attempt * 22;
    const cx = Math.max(-WORLD.w * 0.46, Math.min(WORLD.w * 0.46, x + Math.cos(angle) * dist));
    const cy = Math.max(-WORLD.h * 0.46, Math.min(WORLD.h * 0.46, y + Math.sin(angle) * dist));
    const cell = { x: cx, y: cy, w, h };
    if (!occupied.some((o) => overlaps(cell, o))) return cell;
  }
  return null;
}

/**
 * @param {Array} projects
 */
export function buildProjectPhotoGrid(projects = []) {
  const seed = hashSeed(projects.map((p) => String(p.id)).join('|') || 'grid');
  const rand = mulberry32(seed);
  const cells = [];
  const focuses = [];
  const occupied = [];

  projects.forEach((project, projectIndex) => {
    const src = heroSrc(project);
    if (!src) return;
    const { w, h } = heroSize(project);
    const pos = heroBasePosition(projectIndex, projects.length, rand);
    // Heroes must place — keep nudging along the path axis if needed
    let placed = resolveNoStack(pos.x, pos.y, w, h, occupied, rand);
    if (!placed) {
      // Deterministic fallback along the path, still collision-checked
      for (let k = 1; k <= 12 && !placed; k += 1) {
        placed = resolveNoStack(pos.x + k * (w + GAP), pos.y, w, h, occupied, rand);
        if (!placed) {
          placed = resolveNoStack(pos.x, pos.y + k * (h + GAP) * (projectIndex % 2 === 0 ? 1 : -1), w, h, occupied, rand);
        }
      }
    }
    if (!placed) return;

    const rotate = (rand() - 0.5) * 8;
    const cell = {
      id: `hero-${project.id}`,
      src,
      projectIndex,
      projectId: project.id,
      isHero: true,
      x: placed.x,
      y: placed.y,
      w,
      h,
      rotate,
      z: 10 + projectIndex,
    };
    cells.push(cell);
    occupied.push(cell);
    focuses[projectIndex] = {
      x: placed.x,
      y: placed.y,
      w,
      h,
      rotate,
      src,
      scaleTravel: 0.52,
      scaleZoom: 0.98,
    };
  });

  const ambientBudget = Math.max(0, MAX_TILES - cells.length);
  const galleryPool = [];
  projects.forEach((project, projectIndex) => {
    const hero = heroSrc(project);
    const gallery = Array.isArray(project.gallery) ? project.gallery : [];
    gallery.forEach((src, gi) => {
      if (!src || src === hero) return;
      galleryPool.push({ src, projectIndex, projectId: project.id, gi });
    });
  });

  for (let i = galleryPool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1));
    [galleryPool[i], galleryPool[j]] = [galleryPool[j], galleryPool[i]];
  }

  let ambientCount = 0;
  for (const item of galleryPool) {
    if (ambientCount >= ambientBudget) break;
    const isPortrait = rand() > 0.4;
    const w = isPortrait ? AMBIENT_W * 0.75 : AMBIENT_W;
    const h = isPortrait ? AMBIENT_H : AMBIENT_H * 0.7;
    const x = (rand() - 0.5) * WORLD.w * 0.9;
    const y = (rand() - 0.5) * WORLD.h * 0.9;
    const placed = resolveNoStack(x, y, w, h, occupied, rand);
    // Skip rather than stack
    if (!placed) continue;

    const cell = {
      id: `amb-${item.projectId}-${item.gi}`,
      src: item.src,
      projectIndex: item.projectIndex,
      projectId: item.projectId,
      isHero: false,
      x: placed.x,
      y: placed.y,
      w,
      h,
      rotate: (rand() - 0.5) * 14,
      z: 1 + Math.floor(rand() * 6),
    };
    cells.push(cell);
    occupied.push(cell);
    ambientCount += 1;
  }

  return {
    cells,
    focuses,
    world: { ...WORLD },
    overview: { x: 0, y: 0, scale: 0.4 },
  };
}

export function getFocusPose(layout, projectIndex) {
  return layout.focuses[projectIndex] ?? layout.overview;
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function cameraPoseAt(progress, layout, projectCount) {
  const n = Math.max(projectCount, 1);
  const overview = layout.overview;
  if (!layout.focuses.length) {
    return { x: overview.x, y: overview.y, scale: overview.scale, focusIndex: 0 };
  }

  if (progress < SCENE.projectsStart) {
    return { x: overview.x, y: overview.y, scale: overview.scale, focusIndex: 0 };
  }

  const narrow = typeof window !== 'undefined' && window.innerWidth < 900;
  const travelMul = narrow ? 0.85 : 1;
  const zoomMul = narrow ? 0.92 : 1;
  const overviewScale = overview.scale * (narrow ? 0.9 : 1);

  const { projectsStart, projectsEnd } = SCENE;
  const span = Math.max(0.001, projectsEnd - projectsStart);
  const global = Math.max(0, Math.min(1, (progress - projectsStart) / span));
  const f = Math.min(n - 1e-9, global * n);
  const bestIdx = Math.min(n - 1, Math.floor(f));
  const localT = bestIdx >= n - 1 && global >= 1 ? 1 : f - bestIdx;

  const cur = getFocusPose(layout, bestIdx);
  const prev = bestIdx === 0 ? overview : getFocusPose(layout, bestIdx - 1);
  const travelScale = (cur.scaleTravel ?? 0.42) * travelMul;
  const zoomScale = (cur.scaleZoom ?? 1.05) * zoomMul;
  const prevTravelScale =
    bestIdx === 0
      ? overviewScale
      : (getFocusPose(layout, bestIdx - 1).scaleTravel ?? 0.42) * travelMul;

  const { travelEnd, zoomEnd, holdEnd } = PROJECT_PHASE;

  let x;
  let y;
  let scale;

  if (localT < travelEnd) {
    const u = localT / travelEnd;
    const t = easeInOutCubic(u);
    x = lerp(prev.x, cur.x, t);
    y = lerp(prev.y, cur.y, t);
    scale = lerp(prevTravelScale, travelScale, t);
  } else if (localT < zoomEnd) {
    const u = (localT - travelEnd) / Math.max(0.001, zoomEnd - travelEnd);
    x = cur.x;
    y = cur.y;
    scale = lerp(travelScale, zoomScale, easeInOutCubic(u));
  } else if (localT < holdEnd) {
    x = cur.x;
    y = cur.y;
    scale = zoomScale;
  } else {
    const u = (localT - holdEnd) / Math.max(0.001, 1 - holdEnd);
    const t = easeInOutCubic(u);
    x = cur.x;
    y = cur.y;
    scale = lerp(zoomScale, travelScale, t);
  }

  return { x, y, scale, focusIndex: bestIdx };
}

export function heroScreenRect(progress, layout, projectCount, projectIndex) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const pose = cameraPoseAt(progress, layout, projectCount);
  const focus = getFocusPose(layout, projectIndex);
  const screenW = (focus.w ?? 420) * pose.scale;
  const screenH = (focus.h ?? 520) * pose.scale;
  const cx = vw / 2 + (focus.x - pose.x) * pose.scale;
  const cy =
    (typeof window !== 'undefined' ? window.innerHeight : 800) / 2 +
    (focus.y - pose.y) * pose.scale;
  return {
    left: cx - screenW / 2,
    top: cy - screenH / 2,
    w: screenW,
    h: screenH,
    radius: (focus.w ?? 420) > (focus.h ?? 520) ? 14 : 18,
  };
}

/** Hero tile as it appears on screen — includes tilt + src for shared-element morph. */
export function heroScreenPose(progress, layout, projectCount, projectIndex) {
  const rect = heroScreenRect(progress, layout, projectCount, projectIndex);
  const focus = getFocusPose(layout, projectIndex);
  const heroCell = layout.cells?.find(
    (c) => c.isHero && c.projectIndex === projectIndex,
  );
  return {
    ...rect,
    rotate: focus.rotate ?? heroCell?.rotate ?? 0,
    src: focus.src ?? heroCell?.src ?? '',
  };
}

/** Outer phone/browser frame bounds (shared with DevicePortal). */
export function finalDeviceSize(frame) {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
  const isNarrow = vw < 900;
  const isPhone = vw < 640;

  if (frame === 'web') {
    const w = Math.min(560, vw * (isPhone ? 0.92 : isNarrow ? 0.88 : 0.48));
    const h = Math.min(vh * (isPhone ? 0.36 : 0.52), w * (isPhone ? 0.72 : 0.68));
    const left = isNarrow ? (vw - w) / 2 : vw * 0.52;
    const top = isPhone ? Math.min(vh * 0.48, vh - h - 24) : (vh - h) / 2;
    return { w, h, left, top, radius: isPhone ? 12 : 16 };
  }

  const w = Math.min(isPhone ? 200 : 292, vw * (isPhone ? 0.52 : 0.4));
  const h = Math.min(vh * (isPhone ? 0.42 : 0.74), w * (19.5 / 9));
  const left = isNarrow ? (vw - w) / 2 : vw * 0.52;
  const top = isPhone ? Math.min(vh * 0.48, vh - h - 20) : (vh - h) / 2;
  return { w, h, left, top, radius: isPhone ? 36 : 48 };
}

/** Screen well inset inside the device — morph target for the flying photo. */
export function deviceWellRect(frame) {
  const outer = finalDeviceSize(frame);
  if (frame === 'web') {
    const bar = 2.4 * 16; // 2.4rem
    return {
      left: outer.left,
      top: outer.top + bar,
      w: outer.w,
      h: Math.max(1, outer.h - bar),
      radius: 12,
    };
  }
  const inset = 11;
  return {
    left: outer.left + inset,
    top: outer.top + inset,
    w: Math.max(1, outer.w - inset * 2),
    h: Math.max(1, outer.h - inset * 2),
    radius: 38,
  };
}

/**
 * Shared-element frame morph: grid hero rect+tilt → upright device outer bounds.
 * Photo lives inside the well; shell/chrome only appear when framed (no empty phone).
 */
export function morphPhotoRect(progress, layout, projects, amount) {
  const count = Math.max(projects.length, 1);
  const idx = activeProjectIndex(progress, count);
  const project = projects[idx] ?? projects[0];
  const frame = project?.previewFrame === 'web' ? 'web' : 'mobile';
  const from = heroScreenPose(progress, layout, count, idx);
  const to = finalDeviceSize(frame);
  const t = easeInOutCubic(Math.max(0, Math.min(1, amount)));
  return {
    frame,
    src: from.src || heroSrc(project),
    left: lerp(from.left, to.left, t),
    top: lerp(from.top, to.top, t),
    w: lerp(from.w, to.w, t),
    h: lerp(from.h, to.h, t),
    radius: lerp(from.radius, to.radius, t),
    rotate: lerp(from.rotate, 0, t),
    amount: t,
  };
}

/** @deprecated Alias — same as morphPhotoRect (outer frame). */
export function morphDeviceRect(progress, layout, projects, amount) {
  return morphPhotoRect(progress, layout, projects, amount);
}

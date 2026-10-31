/**
 * Web Audio SFX — same cue map / timings as auge-xp.com.
 * Files live in /public/assets/sounds.
 */

const HOVER_POOL = {
  mode: 'shuffle',
  files: [
    '/assets/sounds/hover-1.mp3',
    '/assets/sounds/hover-2.mp3',
    '/assets/sounds/hover-3.mp3',
    '/assets/sounds/hover-4.mp3',
  ],
};

const SOUND_MAP = {
  clickMenuItem: '/assets/sounds/click.mp3',
  clickProject: '/assets/sounds/click.mp3',
  hoverButton: HOVER_POOL,
  hoverFooterItem: HOVER_POOL,
  hoverMenuItem: HOVER_POOL,
  hoverProject: HOVER_POOL,
  openMenu: '/assets/sounds/menu-open.mp3',
  raiseCurtain: '/assets/sounds/transition.mp3',
  scrambleCurtainTitle: '/assets/sounds/scramble.mp3',
  stepCarousel: {
    mode: 'sequence',
    files: [
      '/assets/sounds/step-1.mp3',
      '/assets/sounds/step-2.mp3',
      '/assets/sounds/step-3.mp3',
      '/assets/sounds/step-4.mp3',
      '/assets/sounds/step-5.mp3',
      '/assets/sounds/step-6.mp3',
    ],
  },
};

const SOUND_ON_ATTR = 'data-sound-on';
const GAIN = 0.6;
const SILENCE = 0.0025;
const IDLE_SUSPEND_MS = 30_000;
const UNLOCK_EVENTS = ['pointerdown', 'keydown', 'touchstart'];
const RESUME_EVENTS = ['pointerdown', 'keydown'];

const listeners = new Set();
const buffers = new Map();
const decoding = new Map();
const lastShuffle = new WeakMap();
const scrambleAt = new Map();

let ctx = null;
let master = null;
let inited = false;
let unlocked = false;
let idleTimer = 0;

function canHover() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}

function allUrls() {
  const urls = new Set();
  for (const entry of Object.values(SOUND_MAP)) {
    if (typeof entry === 'string') urls.add(entry);
    else entry.files.forEach((f) => urls.add(f));
  }
  return urls;
}

function silenceOffset(buffer) {
  const channels = Array.from({ length: buffer.numberOfChannels }, (_, i) =>
    buffer.getChannelData(i)
  );
  for (let i = 0; i < buffer.length; i += 1) {
    for (const ch of channels) {
      if (Math.abs(ch[i]) >= SILENCE) return i / buffer.sampleRate;
    }
  }
  return 0;
}

function decodeUrl(audioCtx, url) {
  if (buffers.has(url)) return Promise.resolve(buffers.get(url));
  if (decoding.has(url)) return decoding.get(url);

  const job = (async () => {
    const res = await fetch(url);
    if (!res.ok) return null;
    const raw = await res.arrayBuffer();
    const buffer = await audioCtx.decodeAudioData(raw.slice(0));
    const packed = { buffer, offset: silenceOffset(buffer) };
    buffers.set(url, packed);
    return packed;
  })()
    .catch(() => null)
    .finally(() => decoding.delete(url));

  decoding.set(url, job);
  return job;
}

function notify() {
  listeners.forEach((fn) => fn());
}

export function isSoundMuted() {
  if (typeof document === 'undefined') return true;
  return !document.documentElement.hasAttribute(SOUND_ON_ATTR);
}

export function isSoundMutedOnServer() {
  return true;
}

export function setSoundMuted(muted) {
  if (typeof document === 'undefined') return;
  document.documentElement.toggleAttribute(SOUND_ON_ATTR, !muted);
  if (!master || !ctx) {
    notify();
    return;
  }
  const now = ctx.currentTime;
  master.gain.cancelScheduledValues(now);
  if (!muted) {
    master.gain.setValueAtTime(GAIN, now);
    resumeSound();
  } else {
    master.gain.setValueAtTime(master.gain.value, now);
    master.gain.linearRampToValueAtTime(0, now + 0.015);
    clearIdle();
    window.setTimeout(() => {
      ctx?.suspend?.().catch(() => {});
    }, 55);
  }
  notify();
}

export function subscribeSoundPreference(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function clearIdle() {
  if (idleTimer) {
    window.clearTimeout(idleTimer);
    idleTimer = 0;
  }
}

function bumpIdle() {
  clearIdle();
  idleTimer = window.setTimeout(() => {
    idleTimer = 0;
    if (ctx?.state === 'running') ctx.suspend().catch(() => {});
  }, IDLE_SUSPEND_MS);
}

export function resumeSound() {
  if (!ctx || !unlocked || isSoundMuted()) {
    return Promise.resolve();
  }
  if (ctx.state === 'running') {
    bumpIdle();
    return Promise.resolve();
  }
  const p = ctx.resume().catch(() => {});
  bumpIdle();
  return p;
}

function enableSoundFromGesture() {
  if (isSoundMuted()) setSoundMuted(false);
  unlock();
  return resumeSound();
}

function unlock() {
  if (unlocked) return;
  unlocked = true;
  for (const ev of UNLOCK_EVENTS) {
    window.removeEventListener(ev, onUnlockGesture, true);
  }
  for (const ev of RESUME_EVENTS) {
    window.addEventListener(
      ev,
      () => {
        if (ctx && ctx.state !== 'running') resumeSound();
      },
      { capture: true, passive: true }
    );
  }
  resumeSound();
}

function onUnlockGesture() {
  enableSoundFromGesture();
}

function onVisibility() {
  if (document.hidden) {
    clearIdle();
    ctx?.suspend?.().catch(() => {});
  } else {
    resumeSound();
  }
}

function resolveUrl(action, cursor) {
  const entry = SOUND_MAP[action];
  if (!entry) return { url: null, commit: null };
  if (typeof entry === 'string') return { url: entry, commit: null };

  if (entry.mode === 'sequence') {
    const step = Math.min(cursor?.step ?? 0, entry.files.length - 1);
    return {
      url: entry.files[step],
      commit: cursor
        ? () => {
            cursor.step = step + 1;
          }
        : null,
    };
  }

  // shuffle — avoid immediate repeat
  const prev = lastShuffle.get(entry);
  const pool = entry.files.filter((f) => f !== prev);
  const choices = pool.length ? pool : entry.files;
  const url = choices[(Math.random() * choices.length) | 0];
  return {
    url,
    commit: () => lastShuffle.set(entry, url),
  };
}

function startSource(packed, delay = 0) {
  if (!ctx || !master || ctx.state !== 'running' || isSoundMuted()) return false;
  const src = ctx.createBufferSource();
  src.buffer = packed.buffer;
  src.connect(master);
  src.onended = () => src.disconnect();
  src.start(ctx.currentTime + delay, packed.offset);
  bumpIdle();
  return true;
}

function playInternal(action, opts = {}) {
  if (!inited) initSound();
  if (!ctx || !master || isSoundMuted()) return;

  const { url, commit } = resolveUrl(action, opts.cursor);
  if (!url) return;

  const run = (packed) => {
    if (!packed) return;
    commit?.();
    if (ctx.state === 'running') {
      startSource(packed, opts.delay ?? 0);
      return;
    }
    resumeSound().then(() => {
      if (!isSoundMuted()) startSource(packed, opts.delay ?? 0);
    });
  };

  const packed = buffers.get(url);
  if (packed) {
    run(packed);
    return;
  }

  // First visit — decode may still be in flight; play as soon as ready.
  decodeUrl(ctx, url).then((decoded) => {
    if (decoded && !isSoundMuted()) run(decoded);
  });
}

export function playSound(action, opts) {
  playInternal(action, opts);
}

export function playHoverSound(action) {
  if (!canHover()) return;
  // First pointer gesture on the strip often arrives as hover after a click
  // elsewhere — ensure the context is live when preference is already on.
  if (!isSoundMuted() && unlocked) resumeSound();
  playInternal(action);
}

/** Scramble ticks — slightly denser than Auge’s 200ms so the curtain type runs longer. */
export function playScrambleSound(group = 'default') {
  const now = performance.now();
  const prev = scrambleAt.get(group) ?? 0;
  if (now - prev < 130) return;
  scrambleAt.set(group, now);
  playInternal('scrambleCurtainTitle');
}

export function createSoundSequence(action) {
  const cursor = { step: 0 };
  return {
    play() {
      playInternal(action, { cursor });
    },
    reset() {
      cursor.step = 0;
    },
  };
}

export function initSound() {
  if (inited || typeof window === 'undefined') return;
  if (typeof window.AudioContext !== 'function') return;
  inited = true;

  const audioCtx = new AudioContext({ latencyHint: 'interactive' });
  const gain = audioCtx.createGain();
  gain.gain.value = isSoundMuted() ? 0 : GAIN;
  gain.connect(audioCtx.destination);
  ctx = audioCtx;
  master = gain;

  for (const ev of UNLOCK_EVENTS) {
    window.addEventListener(ev, onUnlockGesture, { capture: true, passive: true });
  }
  document.addEventListener('visibilitychange', onVisibility);
  subscribeSoundPreference(() => {
    if (!master || !ctx) return;
    const now = ctx.currentTime;
    master.gain.cancelScheduledValues(now);
    if (!isSoundMuted()) {
      master.gain.setValueAtTime(GAIN, now);
      resumeSound();
    }
  });

  // Prefetch immediately so the first card hover isn't silent.
  for (const url of allUrls()) {
    decodeUrl(audioCtx, url);
  }
}

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
const UNLOCK_EVENTS = ['pointerdown', 'pointerup', 'keydown', 'touchstart', 'mousedown'];
const RESUME_EVENTS = ['pointerdown', 'pointerup', 'keydown', 'mousedown'];

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
  if (typeof document === 'undefined') return false;
  return !document.documentElement.hasAttribute(SOUND_ON_ATTR);
}

/** Match index.html `data-sound-on` — first paint must not flash muted. */
export function isSoundMutedOnServer() {
  return false;
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
  if (!ctx || isSoundMuted()) {
    return Promise.resolve();
  }
  if (ctx.state === 'running') {
    unlocked = true;
    bumpIdle();
    return Promise.resolve();
  }
  // Always attempt resume when preference is on — browsers only fulfill it
  // after a real user gesture, which also flips `unlocked`.
  const p = ctx
    .resume()
    .then(() => {
      if (ctx?.state === 'running') unlocked = true;
    })
    .catch(() => {});
  bumpIdle();
  return p;
}

function enableSoundFromGesture() {
  // First gesture: keep preference on (site starts unmuted) and unlock Web Audio.
  if (isSoundMuted()) setSoundMuted(false);
  unlock();
  return resumeSound();
}

function unlock() {
  if (unlocked && ctx?.state === 'running') return;
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

async function ensureRunning() {
  if (!ctx || !master || isSoundMuted()) return false;
  if (ctx.state === 'running') return true;
  await resumeSound();
  return Boolean(ctx && ctx.state === 'running' && !isSoundMuted());
}

function playInternal(action, opts = {}) {
  if (!inited) initSound();
  if (!ctx || !master || isSoundMuted()) return;

  const cursor = opts.cursor;
  // Sequence cues must not overlap — concurrent plays used to advance the
  // cursor several times while the context was still suspended/decoding.
  if (cursor?.busy) {
    cursor.queued = true;
    return;
  }

  const delay = opts.delay ?? 0;

  const run = async () => {
    if (cursor) cursor.busy = true;
    try {
      if (!(await ensureRunning())) return;

      const { url, commit } = resolveUrl(action, cursor);
      if (!url) return;

      let packed = buffers.get(url);
      if (!packed) packed = await decodeUrl(ctx, url);
      if (!packed || isSoundMuted()) return;

      // Context can suspend again while a decode is in flight.
      if (!(await ensureRunning())) return;

      // Only advance the sequence after the buffer actually starts —
      // otherwise early auto-cruise steps were eaten while AudioContext
      // was still locked and never heard until a later hover/gesture.
      if (startSource(packed, delay)) commit?.();
    } finally {
      if (cursor) {
        cursor.busy = false;
        if (cursor.queued) {
          cursor.queued = false;
          playInternal(action, { cursor, delay });
        }
      }
    }
  };

  void run();
}

export function playSound(action, opts) {
  playInternal(action, opts);
}

export function playHoverSound(action) {
  if (!canHover()) return;
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
  const cursor = { step: 0, busy: false, queued: false };
  return {
    play() {
      playInternal(action, { cursor });
    },
    reset() {
      cursor.step = 0;
      cursor.busy = false;
      cursor.queued = false;
    },
  };
}

export function initSound() {
  if (inited || typeof window === 'undefined') return;
  if (typeof window.AudioContext !== 'function') return;
  inited = true;
  // Site default: sound on (html already has data-sound-on; re-assert for SPA navigations).
  setSoundMuted(false);

  const audioCtx = new AudioContext({ latencyHint: 'interactive' });
  const gain = audioCtx.createGain();
  gain.gain.value = GAIN;
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

  // Prefetch immediately so the first card hover isn't silent after unlock.
  for (const url of allUrls()) {
    decodeUrl(audioCtx, url);
  }

  // Optimistic resume — succeeds only after a user gesture, but keeps preference live.
  resumeSound();
  notify();
}

/**
 * Prefetch project hero + gallery so detail WebGL doesn’t flash empty/ghosted.
 * Returns a cancel fn. `onProgress(pct 0–100)` fires on each settle.
 */
export function preloadProjectImages(urls, onProgress) {
  const list = [...new Set((urls || []).filter(Boolean))];
  const total = Math.max(1, list.length);
  let done = 0;
  let cancelled = false;

  const tick = () => {
    if (cancelled) return;
    onProgress?.(Math.min(100, Math.round((done / total) * 100)));
  };

  if (!list.length) {
    onProgress?.(100);
    return () => {
      cancelled = true;
    };
  }

  tick();
  list.forEach((src) => {
    const img = new Image();
    const settle = () => {
      if (cancelled) return;
      done += 1;
      tick();
    };
    img.onload = settle;
    img.onerror = settle;
    img.decoding = 'async';
    img.src = src;
  });

  return () => {
    cancelled = true;
  };
}

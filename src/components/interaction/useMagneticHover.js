import { useEffect, useRef } from 'react';
import {
  MAGNETIC_EPSILON,
  resolveMagneticConfig,
} from '../../lib/magneticHover.js';

function supportsMagneticHover() {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return finePointer && !reduced;
}

/**
 * Cursor-tracking magnetic hover: the surface drifts toward the pointer, tilts
 * in 3D, and settles back with inertia. All motion is written straight to the
 * DOM inside a single rAF loop, so hovering never re-renders React.
 *
 * Inner elements can opt into layered parallax with `className="magnetic-layer"`
 * (depth via the `--mag-depth` CSS variable).
 *
 * @param {string|object} preset - key of MAGNETIC_PRESETS, or a config override object
 * @returns {import('react').RefObject} ref to attach to the hover surface
 */
export function useMagneticHover(preset = 'media') {
  const ref = useRef(null);
  const presetRef = useRef(preset);
  const presetKey = typeof preset === 'string' ? preset : JSON.stringify(preset);

  /** Declared first so the latest preset is available to the effect below. */
  useEffect(() => {
    presetRef.current = preset;
  }, [preset]);

  useEffect(() => {
    const el = ref.current;
    if (!el || !supportsMagneticHover()) return undefined;

    const cfg = resolveMagneticConfig(presetRef.current);

    /** Where the cursor wants the surface to be. */
    const target = { nx: 0, ny: 0, hover: 0 };
    /** Where the surface actually is — lerped toward target every frame. */
    const current = { nx: 0, ny: 0, hover: 0 };

    let frame = 0;
    let hovering = false;
    let rect = null;
    let rectDirty = true;

    /**
     * Measure the untransformed box: the live rect already includes our own
     * translate/scale, so feed it back out to avoid a self-reinforcing loop.
     */
    const measure = () => {
      const live = el.getBoundingClientRect();
      const scale = 1 + (cfg.hoverScale - 1) * current.hover;
      const width = live.width / scale;
      const height = live.height / scale;
      rect = {
        centerX: live.left + live.width / 2 - current.nx * cfg.maxTranslate,
        centerY: live.top + live.height / 2 - current.ny * cfg.maxTranslate,
        halfW: Math.max(1, width / 2),
        halfH: Math.max(1, height / 2),
      };
      rectDirty = false;
    };

    const write = () => {
      const { nx, ny, hover } = current;
      const tx = nx * cfg.maxTranslate;
      const ty = ny * cfg.maxTranslate;
      const rotateY = nx * cfg.maxRotate;
      const rotateX = -ny * cfg.maxRotate;
      const scale = 1 + (cfg.hoverScale - 1) * hover;

      el.style.transform =
        `perspective(${cfg.perspective}px) translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) ` +
        `rotateX(${rotateX.toFixed(3)}deg) rotateY(${rotateY.toFixed(3)}deg) scale(${scale.toFixed(4)})`;

      // Consumed by `.magnetic-layer` children and the cursor sheen.
      el.style.setProperty('--mag-tx', `${(tx * cfg.parallax).toFixed(2)}px`);
      el.style.setProperty('--mag-ty', `${(ty * cfg.parallax).toFixed(2)}px`);
      el.style.setProperty('--mag-hover', hover.toFixed(4));
    };

    const settled = () =>
      Math.abs(target.nx - current.nx) < MAGNETIC_EPSILON &&
      Math.abs(target.ny - current.ny) < MAGNETIC_EPSILON &&
      Math.abs(target.hover - current.hover) < MAGNETIC_EPSILON;

    const tick = () => {
      const ease = hovering ? cfg.lerp : cfg.releaseLerp;
      current.nx += (target.nx - current.nx) * ease;
      current.ny += (target.ny - current.ny) * ease;
      current.hover += (target.hover - current.hover) * ease;

      write();

      if (!hovering && settled()) {
        frame = 0;
        current.nx = 0;
        current.ny = 0;
        current.hover = 0;
        el.style.transform = '';
        el.style.willChange = '';
        el.style.removeProperty('--mag-tx');
        el.style.removeProperty('--mag-ty');
        el.style.removeProperty('--mag-hover');
        return;
      }

      frame = requestAnimationFrame(tick);
    };

    const start = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onEnter = (e) => {
      if (e.pointerType === 'touch') return;
      hovering = true;
      target.hover = 1;
      el.style.willChange = 'transform';
      rectDirty = true;
      start();
    };

    const onMove = (e) => {
      if (!hovering) return;
      if (rectDirty || !rect) measure();
      // Clamped so a fast exit across a corner can't overshoot the max offsets.
      target.nx = Math.max(-1, Math.min(1, (e.clientX - rect.centerX) / rect.halfW));
      target.ny = Math.max(-1, Math.min(1, (e.clientY - rect.centerY) / rect.halfH));
      start();
    };

    const onLeave = () => {
      hovering = false;
      target.nx = 0;
      target.ny = 0;
      target.hover = 0;
      start();
    };

    const invalidate = () => {
      rectDirty = true;
    };

    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerleave', onLeave);
    el.addEventListener('pointercancel', onLeave);
    // Capture phase so inner scrollers (e.g. the case-study rail) invalidate too
    document.addEventListener('scroll', invalidate, { passive: true, capture: true });
    window.addEventListener('resize', invalidate);

    return () => {
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointercancel', onLeave);
      document.removeEventListener('scroll', invalidate, { capture: true });
      window.removeEventListener('resize', invalidate);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
      el.style.transform = '';
      el.style.willChange = '';
    };
  }, [presetKey]);

  return ref;
}

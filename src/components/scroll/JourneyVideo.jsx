import { useEffect, useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useScrollProgress } from './scrollProgress.js';
import { SCENE, portalCompactAt } from '../../lib/scrollTimeline.js';
import { finalDeviceSize } from '../../lib/projectPhotoGrid.js';

const SRC = '/media/journey.mp4';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function viewport() {
  return {
    vw: typeof window !== 'undefined' ? window.innerWidth : 1200,
    vh: typeof window !== 'undefined' ? window.innerHeight : 800,
  };
}

/**
 * Journey backdrop — cinematic plate that owns the screen while the tech words
 * land, then collapses into the device rect and hands off to the project grid.
 *
 * The collapse is driven by the same portalCompactAt the mesh uses, so the plate
 * shrinks in lockstep with the gradient underneath it rather than racing it.
 *
 * Sits at the mesh's stacking level but later in DOM order, so it paints over
 * the gradient without affecting the scenes' copy on the layer above.
 */
export function JourneyVideo({ projects = [] }) {
  const { progress, reducedMotion } = useScrollProgress();
  const videoRef = useRef(null);

  /** Journey always resolves to the first project, matching DevicePortal's target. */
  const frame = projects[0]?.previewFrame === 'web' ? 'web' : 'mobile';
  const frameRef = useRef(frame);
  useEffect(() => {
    frameRef.current = frame;
  }, [frame]);

  const [a, b] = SCENE.journey;
  const span = Math.max(0.001, b - a);
  const fadeInEnd = a + span * 0.1;
  /**
   * The plate lives only in the journey chapter. portalCompactAt is symmetric —
   * it returns to 0 once the mesh blooms back open after the projects — so
   * without this hard bound the video would fade back in over About me and
   * every chapter after it, hiding the gradient that owns those scenes.
   */
  const plateEnd = SCENE.shrink[1];

  /** Rises with the chapter, then clears as the collapse reaches device size. */
  const opacity = useTransform(progress, (v) => {
    if (v >= plateEnd) return 0;
    const rise = v <= a ? 0 : v >= fadeInEnd ? 1 : (v - a) / (fadeInEnd - a);
    const c = portalCompactAt(v);
    const collapse = c < 0.72 ? 1 : c < 0.92 ? 1 - (c - 0.72) / 0.2 : 0;
    return Math.min(rise, collapse);
  });

  const scale = useTransform(progress, (v) => {
    const { vw } = viewport();
    const { w } = finalDeviceSize(frameRef.current);
    return lerp(1, w / vw, portalCompactAt(v));
  });

  const x = useTransform(progress, (v) => {
    const { vw } = viewport();
    const { w, left } = finalDeviceSize(frameRef.current);
    return (left + w / 2 - vw / 2) * portalCompactAt(v);
  });

  const y = useTransform(progress, (v) => {
    const { vh } = viewport();
    const { h, top } = finalDeviceSize(frameRef.current);
    return (top + h / 2 - vh / 2) * portalCompactAt(v);
  });

  /** Radius is divided by scale so the corner reads at a constant on-screen size. */
  const borderRadius = useTransform(progress, (v) => {
    const c = portalCompactAt(v);
    if (c <= 0.001) return 0;
    const { vw } = viewport();
    const { w } = finalDeviceSize(frameRef.current);
    const s = lerp(1, w / vw, c);
    const target = frameRef.current === 'web' ? 16 : 48;
    const visualPx = lerp(28, target, Math.pow(Math.min(1, c), 0.4));
    return visualPx / Math.max(s, 0.2);
  });

  /** Slow push-in while the words land; settles before the collapse begins. */
  const mediaScale = useTransform(progress, [a, a + span * 0.86], [1.12, 1]);

  /** Drops the compositing layer for the ~80% of the track it isn't needed. */
  const visibility = useTransform(opacity, (o) => (o <= 0.001 ? 'hidden' : 'visible'));

  /** Decoding a 1080p loop off-screen is wasted work — only run it while visible. */
  useEffect(() => {
    if (reducedMotion) return undefined;
    const sync = (o) => {
      const el = videoRef.current;
      if (!el) return;
      if (o > 0.02) {
        if (el.paused) el.play().catch(() => {});
      } else if (!el.paused) {
        el.pause();
      }
    };
    sync(opacity.get());
    return opacity.on('change', sync);
  }, [opacity, reducedMotion]);

  if (reducedMotion) return null;

  return (
    <motion.div
      className="journey-video"
      style={{ opacity, scale, x, y, borderRadius, visibility }}
      aria-hidden
    >
      <motion.video
        ref={videoRef}
        className="journey-video__media"
        style={{ scale: mediaScale }}
        src={SRC}
        muted
        loop
        playsInline
        preload="auto"
        disablePictureInPicture
      />
      <div className="journey-video__scrim" />
      <div className="journey-video__grain" />
    </motion.div>
  );
}

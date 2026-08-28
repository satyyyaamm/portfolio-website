import { useEffect, useMemo, useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from 'framer-motion';
import { SCROLL_TRACK_VH, hashForProgress, progressForHash } from '../../lib/scrollTimeline.js';
import { ScrollProgressContext, useScrollProgress } from './scrollProgress.js';
import { DevicePortal } from './DevicePortal.jsx';
import { ProjectCameraGrid } from './ProjectCameraGrid.jsx';
import { JourneyVideo } from './JourneyVideo.jsx';

export { useScrollProgress };

function clamp01(n) {
  return Math.max(0, Math.min(1, n));
}

/**
 * Fixed motion canvas + tall scroll track.
 * Progress is bound 1:1 to scroll — no spring lag.
 */
export function ScrollComposition({ children, projects = [], caseOpen = false }) {
  const reducedMotion = useReducedMotion();
  const trackRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ['start start', 'end end'],
  });
  const progress = scrollYProgress;
  const lastHash = useRef('');

  useEffect(() => {
    const unsub = progress.on('change', (v) => {
      const hash = hashForProgress(v, projects);
      if (hash !== lastHash.current) {
        lastHash.current = hash;
        if (window.location.hash !== hash) {
          window.history.replaceState(null, '', hash);
        }
      }
    });
    return unsub;
  }, [progress, projects]);

  const scrollToProgress = (p) => {
    const track = trackRef.current;
    if (!track) return;
    const max = Math.max(1, track.offsetHeight - window.innerHeight);
    window.scrollTo({
      top: track.offsetTop + clamp01(p) * max,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  };

  useEffect(() => {
    const onNavigate = (e) => {
      const raw = e.detail?.hash ?? e.detail?.id;
      if (!raw) return;
      const hash = raw.startsWith('#') ? raw : `#${raw}`;
      scrollToProgress(progressForHash(hash, projects.length, projects));
    };
    window.addEventListener('portfolio:navigate', onNavigate);
    return () => window.removeEventListener('portfolio:navigate', onNavigate);
  });

  useEffect(() => {
    if (window.location.hash && window.location.hash !== '#') {
      requestAnimationFrame(() => {
        scrollToProgress(progressForHash(window.location.hash, projects.length, projects));
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const value = useMemo(
    () => ({ progress, reducedMotion, scrollToProgress }),
    [progress, reducedMotion]
  );

  const stageTransition = { duration: 1.05, ease: [0.22, 1, 0.36, 1] };

  if (reducedMotion) {
    return (
      <ScrollProgressContext.Provider value={value}>
        <div className="scroll-comp scroll-comp--static">
          <div className="scroll-comp__static-bg">
            <DevicePortal projects={projects} progressValue={0.15} />
          </div>
          <div className="scroll-comp__static-flow">{children}</div>
        </div>
      </ScrollProgressContext.Provider>
    );
  }

  return (
    <ScrollProgressContext.Provider value={value}>
      <div className={`scroll-comp${caseOpen ? ' is-case-open' : ''}`}>
        <div
          ref={trackRef}
          className="scroll-comp__track"
          style={{ height: `${SCROLL_TRACK_VH}vh` }}
          aria-hidden
        />
        <motion.div
          className="scroll-comp__stage"
          animate={{ x: caseOpen ? '100%' : 0 }}
          transition={stageTransition}
        >
          <DevicePortal projects={projects} />
          <ProjectCameraGrid projects={projects} />
          {/* After the portal so it paints over the mesh at the same stacking level. */}
          <JourneyVideo projects={projects} />
          <div className="scroll-comp__canvas">{children}</div>
        </motion.div>
      </div>
    </ScrollProgressContext.Provider>
  );
}

const DEFAULT_POSE = { x: 0, y: 0, opacity: 1, scale: 1, rotate: 0 };

/**
 * Layout shell + scrubbed motion.
 * X/Y travel continuously enter→exit (ShaderGradient pass-through).
 * Opacity/scale/rotate use a soft mid-range envelope.
 */
export function ScrollLayer({
  range: [start, end],
  enter,
  hold,
  exit,
  holdRatio = 0.22,
  className = '',
  style,
  children,
  ...rest
}) {
  const { progress, reducedMotion } = useScrollProgress();
  const e = { ...DEFAULT_POSE, ...enter };
  const h = { ...DEFAULT_POSE, ...hold };
  const xpose = { ...DEFAULT_POSE, ...exit };

  const span = Math.max(0.001, end - start);
  const fadeIn = start + span * ((1 - holdRatio) / 2);
  const fadeOut = end - span * ((1 - holdRatio) / 2);
  const opacityKeys = [start, fadeIn, fadeOut, end];

  const x = useTransform(progress, [start, end], [e.x, xpose.x]);
  const y = useTransform(progress, [start, end], [e.y, xpose.y]);
  const opacity = useTransform(progress, opacityKeys, [
    e.opacity,
    h.opacity,
    h.opacity,
    xpose.opacity,
  ]);
  const scale = useTransform(progress, opacityKeys, [e.scale, h.scale, h.scale, xpose.scale]);
  const rotate = useTransform(progress, opacityKeys, [
    e.rotate,
    h.rotate,
    h.rotate,
    xpose.rotate,
  ]);
  /** Invisible layers must not steal clicks from earlier scenes (e.g. contact over FAQ). */
  const pointerEvents = useTransform(opacity, (o) => (o > 0.4 ? 'auto' : 'none'));

  if (reducedMotion) {
    return (
      <div className={`scroll-layer scroll-layer--static ${className}`} style={style} {...rest}>
        {children}
      </div>
    );
  }

  return (
    <div className={`scroll-layer ${className}`} style={style} {...rest}>
      <motion.div
        className="scroll-layer__motion"
        style={{
          opacity,
          x,
          y,
          scale,
          rotate,
          pointerEvents,
          willChange: 'transform, opacity',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}

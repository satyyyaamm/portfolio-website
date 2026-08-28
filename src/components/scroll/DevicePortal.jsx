import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { motion, useTransform, useMotionValueEvent } from 'framer-motion';
import { ShaderBackground } from '../ShaderBackground.jsx';
import { useScrollProgress } from './scrollProgress.js';
import {
  SCENE,
  PROJECT_PHASE,
  portalCompactAt,
  projectPhase,
  projectMorphAmount,
  activeProjectIndex,
} from '../../lib/scrollTimeline.js';
import {
  buildProjectPhotoGrid,
  finalDeviceSize,
  morphPhotoRect,
} from '../../lib/projectPhotoGrid.js';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function frameOf(project) {
  return project?.previewFrame === 'web' ? 'web' : 'mobile';
}

function morphRawAt(v, count) {
  return projectMorphAmount(v, count);
}

/**
 * Mesh shrinks into device bounds on chapter enter/exit.
 * Grid hero morphs into the device well (photo inside); chrome snaps on after zoom.
 */
export function DevicePortal({ projects = [] }) {
  const { progress, reducedMotion } = useScrollProgress();
  const [activeIdx, setActiveIdx] = useState(0);
  const [framed, setFramed] = useState(false);
  const [floatOn, setFloatOn] = useState(false);
  const [, setViewportTick] = useState(0);
  const activeIdxRef = useRef(0);
  const framedRef = useRef(false);
  const floatOnRef = useRef(false);
  const frameRef = useRef('mobile');
  const count = projects.length || 1;
  const layout = useMemo(() => buildProjectPhotoGrid(projects), [projects]);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  const active = projects[activeIdx] ?? projects[0];
  const frame = frameOf(active);
  frameRef.current = frame;

  useLayoutEffect(() => {
    const onResize = () => setViewportTick((n) => n + 1);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const syncFromProgress = (v) => {
    const idx = activeProjectIndex(v, count);
    if (idx !== activeIdxRef.current) {
      activeIdxRef.current = idx;
      setActiveIdx(idx);
    }

    const phase = projectPhase(v, idx, count);
    const { zoomEnd, holdEnd } = PROJECT_PHASE;
    let nextFramed = framedRef.current;
    if (reducedMotion) {
      nextFramed = phase.localT >= zoomEnd && phase.localT < 0.95;
    } else if (framedRef.current) {
      nextFramed = phase.localT >= zoomEnd - 0.06 && phase.localT < holdEnd + 0.04;
    } else {
      nextFramed = phase.localT >= zoomEnd && phase.localT < holdEnd;
    }

    if (nextFramed !== framedRef.current) {
      framedRef.current = nextFramed;
      setFramed(nextFramed);
    }

    const nextFloat = nextFramed && phase.localT > zoomEnd + 0.05;
    if (nextFloat !== floatOnRef.current) {
      floatOnRef.current = nextFloat;
      setFloatOn(nextFloat);
    }
  };

  useLayoutEffect(() => {
    syncFromProgress(progress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(progress, 'change', syncFromProgress);

  const meshScale = useTransform(progress, (v) => {
    const c = portalCompactAt(v);
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const { w } = finalDeviceSize(frameRef.current);
    return lerp(1, w / vw, c);
  });

  const meshX = useTransform(progress, (v) => {
    const c = portalCompactAt(v);
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const { w, left } = finalDeviceSize(frameRef.current);
    const targetCenter = left + w / 2;
    return (targetCenter - vw / 2) * c;
  });

  const meshY = useTransform(progress, (v) => {
    const c = portalCompactAt(v);
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    const { h, top } = finalDeviceSize(frameRef.current);
    const targetCenter = top + h / 2;
    return (targetCenter - vh / 2) * c;
  });

  const meshRadius = useTransform(progress, (v) => {
    const c = portalCompactAt(v);
    if (c <= 0.001) return 0;
    const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const { w } = finalDeviceSize(frameRef.current);
    const scale = lerp(1, w / vw, c);
    const target = frameRef.current === 'web' ? 16 : 48;
    const radiusT = Math.pow(Math.min(1, c), 0.4);
    const visualPx = lerp(28, target, radiusT);
    return visualPx / Math.max(scale, 0.2);
  });

  const morphAmount = useTransform(progress, (v) => morphRawAt(v, count));
  const focusIndexMv = useTransform(progress, (v) => activeProjectIndex(v, count));

  const frameMv = useTransform(progress, (v) => {
    const raw = morphRawAt(v, count);
    return morphPhotoRect(v, layoutRef.current, projects, raw);
  });

  const frameLeft = useTransform(frameMv, (p) => p.left);
  const frameTop = useTransform(frameMv, (p) => p.top);
  const frameW = useTransform(frameMv, (p) => p.w);
  const frameH = useTransform(frameMv, (p) => p.h);
  const frameRadius = useTransform(frameMv, (p) => p.radius);
  const frameRotate = useTransform(frameMv, (p) => p.rotate);

  const frameOpacity = useTransform(morphAmount, (a) => {
    if (a <= 0.001) return 0;
    if (a < 0.06) return a / 0.06;
    return 1;
  });

  const settled = finalDeviceSize(frame);

  const meshOpacity = useTransform(progress, (v) => {
    const c = portalCompactAt(v);
    if (c < 0.72) return 1;
    if (c < 0.92) return 1 - (c - 0.72) / 0.2;
    return 0;
  });

  if (reducedMotion) {
    return (
      <div className="device-portal device-portal--static">
        <ShaderBackground progress={0.15} />
      </div>
    );
  }

  return (
    <div className={`device-portal-root${framed ? ' is-project-open' : ''}`}>
      <motion.div
        className="device-portal__mesh-stage"
        style={{
          scale: meshScale,
          x: meshX,
          y: meshY,
          borderRadius: meshRadius,
          opacity: meshOpacity,
        }}
      >
        <ShaderBackground />
      </motion.div>

      <motion.div
        className="device-float-wrap"
        style={{
          transformOrigin: `${settled.left + settled.w / 2}px ${settled.top + settled.h / 2}px`,
        }}
        animate={
          floatOn
            ? { y: [0, -14, 0], rotate: [-0.45, 0.55, -0.45] }
            : { y: 0, rotate: 0 }
        }
        transition={
          floatOn
            ? { duration: 5.8, repeat: Infinity, ease: 'easeInOut' }
            : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
        }
      >
        <motion.div
          className={`device-frame device-frame--${frame} device-frame--morph${framed ? ' is-framed' : ''}`}
          style={{
            opacity: frameOpacity,
            left: frameLeft,
            top: frameTop,
            width: frameW,
            height: frameH,
            borderRadius: frameRadius,
            rotate: frameRotate,
          }}
        >
          <div className="device-frame__shell" aria-hidden />
          <div className="device-frame__well device-frame__well--morph">
            {projects.map((project, i) => (
              <MorphPhoto key={project.id} project={project} index={i} focusIndexMv={focusIndexMv} />
            ))}
          </div>
          <div className={`device-chrome-wrap device-chrome-wrap--${frame}`}>
            {frame === 'web' ? <BrowserChrome label={active?.name} /> : <PhoneChrome />}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function MorphPhoto({ project, index, focusIndexMv }) {
  const src = project.previewImage ?? project.image;
  const opacity = useTransform(focusIndexMv, (idx) => (idx === index ? 1 : 0));

  if (!src) return null;

  return (
    <motion.img
      className="device-morph-photo__img"
      src={src}
      alt=""
      decoding="async"
      draggable={false}
      style={{ opacity }}
    />
  );
}

function PhoneChrome() {
  return (
    <div className="phone-chrome" aria-hidden>
      <span className="phone-chrome__side phone-chrome__side--silent" />
      <span className="phone-chrome__side phone-chrome__side--vol-up" />
      <span className="phone-chrome__side phone-chrome__side--vol-down" />
      <span className="phone-chrome__side phone-chrome__side--power" />
      <span className="phone-chrome__island" />
      <span className="phone-chrome__home" />
    </div>
  );
}

function BrowserChrome({ label }) {
  return (
    <div className="browser-chrome" aria-hidden>
      <div className="browser-chrome__bar">
        <span className="browser-chrome__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="browser-chrome__url">{label || 'app'}</span>
      </div>
    </div>
  );
}

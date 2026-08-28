import { useMemo, useRef } from 'react';
import { motion, useTransform } from 'framer-motion';
import { useScrollProgress } from './scrollProgress.js';
import {
  SCENE,
  projectMorphAmount,
  activeProjectIndex,
} from '../../lib/scrollTimeline.js';
import { buildProjectPhotoGrid, cameraPoseAt } from '../../lib/projectPhotoGrid.js';

/**
 * Full-viewport photo plane. Scroll pans/zooms like a top-down camera
 * across project heroes before the device frame morphs out of the focused tile.
 */
export function ProjectCameraGrid({ projects = [] }) {
  const { progress, reducedMotion } = useScrollProgress();
  const layout = useMemo(() => buildProjectPhotoGrid(projects), [projects]);
  const layoutRef = useRef(layout);
  layoutRef.current = layout;
  const count = projects.length || 1;

  // One pose eval per scroll tick (avoids triple cameraPoseAt)
  const poseMv = useTransform(progress, (p) => cameraPoseAt(p, layoutRef.current, count));
  const planeX = useTransform(poseMv, (pose) => -pose.x * pose.scale);
  const planeY = useTransform(poseMv, (pose) => -pose.y * pose.scale);
  const poseScale = useTransform(poseMv, (pose) => pose.scale);

  const gridOpacity = useTransform(progress, (p) => {
    const { projectsStart, projectsEnd, expand } = SCENE;
    if (p < projectsStart - 0.02) return 0;
    if (p < projectsStart + 0.02) {
      return (p - (projectsStart - 0.02)) / 0.04;
    }
    if (p <= projectsEnd) return 1;
    if (p < expand[1]) {
      return 1 - (p - projectsEnd) / Math.max(0.001, expand[1] - projectsEnd);
    }
    return 0;
  });

  const focusIndexMv = useTransform(progress, (p) => activeProjectIndex(p, count));
  const morphAmountMv = useTransform(progress, (p) => projectMorphAmount(p, count));

  if (reducedMotion || !layout.cells.length) return null;

  return (
    <motion.div className="project-camera-grid" style={{ opacity: gridOpacity }} aria-hidden>
      <div className="project-camera-grid__viewport">
        <motion.div
          className="project-camera-grid__plane"
          style={{
            x: planeX,
            y: planeY,
            scale: poseScale,
            width: layout.world.w,
            height: layout.world.h,
          }}
        >
          {layout.cells.map((cell) => (
            <GridTile
              key={cell.id}
              cell={cell}
              focusIndexMv={focusIndexMv}
              morphAmountMv={morphAmountMv}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function GridTile({ cell, focusIndexMv, morphAmountMv }) {
  const opacity = useTransform([focusIndexMv, morphAmountMv], ([idx, morph]) => {
    const isFocusHero = cell.isHero && cell.projectIndex === idx;
    // Hand off to morphing device — no ghost tile left on the grid
    if (isFocusHero) return morph <= 0.04 ? 1 : 0;
    const base = cell.isHero ? 0.5 : 0.36;
    const dimmed = cell.isHero ? 0.22 : 0.16;
    return base + (dimmed - base) * Math.min(1, morph);
  });

  const visibility = useTransform(opacity, (o) => (o <= 0.001 ? 'hidden' : 'visible'));

  return (
    <motion.div
      className={`project-camera-grid__tile${cell.isHero ? ' is-hero' : ' is-ambient'}`}
      style={{
        left: `calc(50% + ${cell.x - cell.w / 2}px)`,
        top: `calc(50% + ${cell.y - cell.h / 2}px)`,
        width: cell.w,
        height: cell.h,
        rotate: cell.rotate,
        zIndex: cell.z,
        opacity,
        visibility,
      }}
    >
      <img
        src={cell.src}
        alt=""
        loading={cell.isHero ? 'eager' : 'lazy'}
        decoding="async"
        draggable={false}
      />
    </motion.div>
  );
}

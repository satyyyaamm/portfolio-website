import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const RING_EASE = [0.22, 1, 0.36, 1];

export function AboutPortrait({ src, alt, animating }) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.55 });
  const play = animating && (reducedMotion || isInView);

  return (
    <div
      ref={ref}
      className={`about-portrait${play ? ' about-portrait--active' : ''}${reducedMotion ? ' about-portrait--static' : ''}`}
    >
      <svg className="about-portrait__ring" viewBox="0 0 100 100" aria-hidden>
        <motion.circle
          cx="50"
          cy="50"
          r="47.5"
          fill="none"
          stroke="var(--color-mocha-800, #09090b)"
          strokeWidth="2.75"
          strokeLinecap="round"
          initial={false}
          animate={
            play
              ? { pathLength: 1, opacity: 1 }
              : { pathLength: reducedMotion ? 1 : 0, opacity: reducedMotion ? 1 : 0 }
          }
          transition={{ duration: reducedMotion ? 0 : 1.05, ease: RING_EASE }}
        />
      </svg>

      {!reducedMotion && (
        <motion.span
          className="about-portrait__ring-glow"
          aria-hidden
          initial={false}
          animate={
            play
              ? { scale: [1, 1.045, 1], opacity: [0.45, 0.18, 0.45] }
              : { scale: 1, opacity: 0 }
          }
          transition={
            play
              ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 1.05 }
              : { duration: 0.2 }
          }
        />
      )}

      <div className="about-portrait__photo">
        <motion.img
          src={src}
          alt={alt}
          className="h-full w-full object-cover object-center select-none"
          decoding="async"
          initial={false}
          animate={play ? { scale: 1, opacity: 1 } : { scale: 0.96, opacity: reducedMotion ? 1 : 0.85 }}
          transition={{ duration: reducedMotion ? 0 : 0.65, ease: RING_EASE, delay: reducedMotion ? 0 : 0.12 }}
        />
      </div>
    </div>
  );
}

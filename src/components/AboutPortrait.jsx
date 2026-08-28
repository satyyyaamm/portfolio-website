import { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const PORTRAIT_EASE = [0.22, 1, 0.36, 1];

export function AboutPortrait({ src, alt, animating }) {
  const ref = useRef(null);
  const reducedMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, amount: 0.55 });
  const play = animating && (reducedMotion || isInView);

  return (
    <motion.div
      ref={ref}
      className={`about-portrait${play ? ' about-portrait--active' : ''}${reducedMotion ? ' about-portrait--static' : ''}`}
      initial={false}
      animate={
        play
          ? { opacity: 1, scale: 1 }
          : { opacity: reducedMotion ? 1 : 0.72, scale: reducedMotion ? 1 : 0.97 }
      }
      transition={{ duration: reducedMotion ? 0 : 0.75, ease: PORTRAIT_EASE }}
    >
      <div className="about-portrait__frame">
        <div className="about-portrait__photo">
          <img
            src={src}
            alt={alt}
            className="about-portrait__img"
            decoding="async"
          />
          <span className="about-portrait__mesh-tint" aria-hidden />
          <span className="about-portrait__vignette" aria-hidden />
        </div>
      </div>

      {!reducedMotion && (
        <motion.span
          className="about-portrait__glow"
          aria-hidden
          initial={false}
          animate={
            play
              ? { opacity: [0.35, 0.14, 0.35], scale: [1, 1.03, 1] }
              : { opacity: 0, scale: 1 }
          }
          transition={
            play
              ? { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
        />
      )}
    </motion.div>
  );
}

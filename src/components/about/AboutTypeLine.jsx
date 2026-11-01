import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Scramble, ScrambleHover } from '../landing/Scramble.jsx';

function Media({ item, wide, tall }) {
  if (!item) return null;
  const cls = `about-type__media${wide ? ' about-type__media--wide' : ''}${tall ? ' about-type__media--tall' : ''}`;
  return (
    <span className={cls}>
      {item.kind === 'video' ? (
        <video src={item.src} poster={item.poster || undefined} muted loop playsInline autoPlay preload="metadata" />
      ) : (
        <img src={item.src} alt="" />
      )}
    </span>
  );
}

function Tok({ children, delay = 0, reduced }) {
  return (
    <span className="about-type__tok">
      <motion.span
        className="about-type__tok-in"
        initial={reduced ? false : { y: '110%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

/** Periodic scramble — same idea as Auge’s rotating © year. */
function ScrambleLoop({ text, everyMs = 4200, steps = 14, intervalMs = 36 }) {
  const reduced = useReducedMotion();
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const id = window.setInterval(() => setPulse((n) => n + 1), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs, reduced]);

  return (
    <Scramble
      key={pulse}
      text={text}
      active={!reduced}
      steps={steps}
      intervalMs={intervalMs}
    />
  );
}

/**
 * FROM SKETCH TO LIVE — same lockup design, Satyam’s line.
 * Year + TO LIVE scramble live; the rest stays in the GL warp bake.
 */
export function AboutTypeLine({ media = [] }) {
  const reduced = useReducedMotion();
  const [a, b, c, d] = media;
  const year = new Date().getFullYear();
  const yearLabel = `©${year}`;

  return (
    <p className="about-type">
      <Tok delay={0.02} reduced={reduced}>
        (F<span className="about-type__ital about-type__accent">R</span>
      </Tok>
      <Tok delay={0.06} reduced={reduced}>
        *)
      </Tok>{' '}
      <span className="about-type__year about-type__scramble" aria-label={yearLabel}>
        <ScrambleLoop text={yearLabel} />
      </span>{' '}
      <Media item={a} tall />
      <br />
      <Tok delay={0.1} reduced={reduced}>
        <span className="about-type__arrow">⤷</span>
      </Tok>{' '}
      <Media item={b} />{' '}
      <Tok delay={0.14} reduced={reduced}>
        <span className="about-type__ital about-type__accent">O</span>M,
      </Tok>{' '}
      <Tok delay={0.18} reduced={reduced}>
        <span className="about-type__accent">\</span>
        <span className="about-type__ital about-type__accent">&quot;SK</span>
      </Tok>
      <br />
      <Tok delay={0.22} reduced={reduced}>
        <span className="about-type__ital about-type__accent">E</span>TCH
        <span className="about-type__accent">&quot;</span>
      </Tok>{' '}
      <Media item={c} wide />{' '}
      <Tok delay={0.26} reduced={reduced}>
        <span className="about-type__star">✽</span>
      </Tok>
      <br />
      <Media item={d} wide />{' '}
      <span className="about-type__tok about-type__scramble about-type__closer-wrap">
        <motion.span
          className="about-type__tok-in"
          initial={reduced ? false : { y: '110%' }}
          animate={{ y: '0%' }}
          transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          <span className="about-type__closer">
            <span className="about-type__ital about-type__accent">T</span>
            <ScrambleHover text="O LIVE" steps={12} intervalMs={30} />
          </span>
        </motion.span>
      </span>
    </p>
  );
}

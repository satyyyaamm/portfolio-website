import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { scrambleFrame } from './landing/Scramble.jsx';
import { playScrambleSound } from '../lib/siteSound.js';

export const EASE_SOFT = [0.22, 1, 0.36, 1];
export const EXIT_NAME_MS = 480;
export const EXIT_EASE_CSS = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const HOME_CURTAIN_IN_MS = 1150;
export const HOME_CURTAIN_OUT_MS = 3200;
export const HOME_HOLD_MS = 2100;
const SCRAMBLE_STEPS = 26;
const SCRAMBLE_INTERVAL_MS = 38;

/** Alternate italic / roman Didone glyphs — optionally scramble in. */
export function EditorialLine({ text, scramble = false }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(() => (scramble && !reduced ? scrambleFrame(text, 0) : text));

  useEffect(() => {
    if (!text) return undefined;
    if (!scramble || reduced) {
      setShown(text);
      return undefined;
    }
    let frame = 0;
    setShown(scrambleFrame(text, 0));
    playScrambleSound('curtainTitle');
    const id = window.setInterval(() => {
      frame += 1;
      playScrambleSound('curtainTitle');
      if (frame >= SCRAMBLE_STEPS) {
        setShown(text);
        window.clearInterval(id);
        return;
      }
      setShown(scrambleFrame(text, frame / SCRAMBLE_STEPS));
    }, SCRAMBLE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [text, scramble, reduced]);

  if (!text) return null;
  return (
    <span className="project-open__didone-line" aria-hidden={false}>
      {[...shown].map((ch, i) => (
        <span
          key={`${i}-${ch}`}
          className={
            ch === ' '
              ? 'project-open__didone-space'
              : i % 2 === 0
                ? 'project-open__didone-ital'
                : 'project-open__didone-roman'
          }
        >
          {ch === ' ' ? '\u00a0' : ch}
        </span>
      ))}
    </span>
  );
}

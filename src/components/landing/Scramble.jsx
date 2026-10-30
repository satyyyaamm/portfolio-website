import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

export function scrambleFrame(target, reveal) {
  const count = target.length;
  return [...target]
    .map((ch, i) => {
      if (ch === ' ' || ch === '\n' || ch === '—' || ch === '-' || ch === ',' || ch === '.' || ch === "'" || ch === '©') {
        return ch;
      }
      if (i < reveal * count) return ch;
      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      return ch === ch.toLowerCase() ? glyph.toLowerCase() : glyph;
    })
    .join('');
}

export function Scramble({ text, active = true, steps = 12, intervalMs = 32 }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (!active || reduced) {
      setShown(text);
      return undefined;
    }

    let frame = 0;
    const total = Math.max(1, steps);
    const tick = Math.max(16, intervalMs);
    setShown(scrambleFrame(text, 0));
    const id = window.setInterval(() => {
      frame += 1;
      if (frame >= total) {
        setShown(text);
        window.clearInterval(id);
        return;
      }
      setShown(scrambleFrame(text, frame / total));
    }, tick);
    const done = window.setTimeout(() => setShown(text), total * tick + 80);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(done);
    };
  }, [text, active, reduced, steps, intervalMs]);

  return <span aria-hidden>{shown}</span>;
}

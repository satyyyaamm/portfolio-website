import { useLayoutEffect, useRef } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { useScrollProgress } from './scrollProgress.js';

function visibleCount(progress, start, end, length, reducedMotion) {
  if (reducedMotion) return progress >= start ? length : 0;
  if (progress <= start) return 0;
  if (progress >= end) return length;
  const local = (progress - start) / Math.max(0.001, end - start);
  return Math.min(length, Math.ceil(local * length));
}

/** Reveals text character-by-character as scroll scrubs through `range`. */
export function ScrollTypewriter({
  text,
  range: [start, end],
  className = 'comp-typewriter',
  as: Tag = 'p',
}) {
  const { progress, reducedMotion } = useScrollProgress();
  const textRef = useRef(null);
  const caretRef = useRef(null);
  const countRef = useRef(-1);

  const apply = (p) => {
    const next = visibleCount(p, start, end, text.length, reducedMotion);
    if (next === countRef.current) return;
    countRef.current = next;
    if (textRef.current) {
      textRef.current.textContent = text.slice(0, next);
    }
    if (caretRef.current) {
      caretRef.current.hidden = next <= 0 || next >= text.length;
    }
  };

  useLayoutEffect(() => {
    apply(progress.get());
  }, [progress, start, end, text, reducedMotion]);

  useMotionValueEvent(progress, 'change', apply);

  return (
    <Tag className={className}>
      <span ref={textRef} className="comp-typewriter__text" />
      <span ref={caretRef} className="comp-typewriter__caret" aria-hidden>
        |
      </span>
    </Tag>
  );
}

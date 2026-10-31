import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import './site-cursor.css';

function useFinePointer() {
  const [fine, setFine] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(pointer: fine)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(pointer: fine)');
    const sync = () => setFine(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  return fine;
}

/**
 * Yellow diamond that lerps behind the real pointer.
 * OS cursor stays visible — this is a follower only, portaled above detail too.
 */
export function SiteCursor({ suppressRef }) {
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const [dotEl, setDotEl] = useState(null);
  const enabled = Boolean(finePointer) && !reducedMotion;

  useEffect(() => {
    if (!enabled || !dotEl) return undefined;

    const target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    const pos = { x: target.x, y: target.y };
    let pointerInside = false;
    let suppressStable = false;
    let suppressFrames = 0;
    let shown = false;
    let raf = 0;

    const applyVisibility = (show) => {
      if (show === shown) return;
      shown = show;
      dotEl.style.opacity = show ? '1' : '0';
      dotEl.classList.toggle('is-on', show);
    };

    const onMove = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!pointerInside) {
        pointerInside = true;
        pos.x = target.x;
        pos.y = target.y;
      }
    };

    const onLeave = () => {
      pointerInside = false;
      suppressStable = false;
      suppressFrames = 0;
      applyVisibility(false);
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      dotEl.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;

      const rawSuppress = Boolean(suppressRef?.current);
      if (rawSuppress === suppressStable) {
        suppressFrames = 0;
      } else {
        suppressFrames += 1;
        if (suppressFrames >= (rawSuppress ? 2 : 6)) {
          suppressStable = rawSuppress;
          suppressFrames = 0;
        }
      }

      applyVisibility(pointerInside && !suppressStable);
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      applyVisibility(false);
    };
  }, [enabled, dotEl, suppressRef]);

  if (!enabled || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={setDotEl} className="site-cursor-dot" aria-hidden />,
    document.body
  );
}

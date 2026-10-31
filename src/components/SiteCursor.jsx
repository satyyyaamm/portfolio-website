import { useEffect, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Scramble } from './landing/Scramble.jsx';
import './site-cursor.css';

const DIAMOND = 11;
const LABEL_W = 126;
const LABEL_H = 36;
const LABEL_PAD_X = 14;
const MORPH_LERP = 0.09;
const MORPH_SNAP = 0.001;

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

function easeOutCubic(t) {
  return 1 - (1 - t) ** 3;
}

/**
 * Yellow diamond that lerps behind the real pointer.
 * On carousel hover it expands into the "View project" tag.
 * OS cursor stays visible — this is a follower only, portaled above detail too.
 */
export function SiteCursor({ suppressRef }) {
  const reducedMotion = useReducedMotion();
  const finePointer = useFinePointer();
  const [dotEl, setDotEl] = useState(null);
  const [labelEl, setLabelEl] = useState(null);
  const [labelOn, setLabelOn] = useState(false);
  const enabled = Boolean(finePointer) && !reducedMotion;

  useEffect(() => {
    if (!enabled || !dotEl || !labelEl) return undefined;

    const target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    const pos = { x: target.x, y: target.y };
    let pointerInside = false;
    let morph = 0;
    let morphTarget = 0;
    let labelLive = false;
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
      morphTarget = 0;
      applyVisibility(false);
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;

      // Never expand into "View project" while the yellow overlay is up.
      const overlayUp = document.body.classList.contains('project-open-active');
      morphTarget = !overlayUp && suppressRef?.current ? 1 : 0;
      morph += (morphTarget - morph) * MORPH_LERP;
      if (Math.abs(morphTarget - morph) < MORPH_SNAP) morph = morphTarget;

      const eased = easeOutCubic(morph);
      const w = DIAMOND + (LABEL_W - DIAMOND) * eased;
      const h = DIAMOND + (LABEL_H - DIAMOND) * eased;
      const padX = LABEL_PAD_X * eased;
      // Rounded square @ 45° = soft diamond; un-rotates into the tag.
      const rot = 45 * (1 - eased);
      const radius = 2.5 + 3.5 * eased;
      // Diamond stays centered on the lag; label sits at the old tip offset (+18, +14).
      const ox = 18 * eased;
      const oy = 14 * eased;
      const center = 50 * (1 - eased);

      dotEl.style.width = `${w}px`;
      dotEl.style.height = `${h}px`;
      dotEl.style.padding = `0 ${padX}px`;
      dotEl.style.borderRadius = `${radius}px`;
      dotEl.style.transform = `translate3d(${pos.x + ox}px, ${pos.y + oy}px, 0) translate(${-center}%, ${-center}%) rotate(${rot}deg)`;
      dotEl.style.mixBlendMode = eased > 0.28 ? 'normal' : 'difference';

      const textOpacity = Math.max(0, (eased - 0.28) / 0.5);
      labelEl.style.opacity = String(textOpacity * textOpacity);
      labelEl.style.transform = `rotate(${-rot}deg)`;

      const nextLabel = eased > 0.42;
      if (nextLabel !== labelLive) {
        labelLive = nextLabel;
        setLabelOn(nextLabel);
      }

      applyVisibility(pointerInside);
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
      setLabelOn(false);
    };
  }, [enabled, dotEl, labelEl, suppressRef]);

  if (!enabled || typeof document === 'undefined') return null;

  return createPortal(
    <div ref={setDotEl} className="site-cursor-dot" aria-hidden>
      <span ref={setLabelEl} className="site-cursor-dot__label">
        <Scramble text="View project" active={labelOn} steps={14} intervalMs={32} />
      </span>
    </div>,
    document.body
  );
}

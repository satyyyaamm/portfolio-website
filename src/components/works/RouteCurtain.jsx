import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { playSound } from '../../lib/siteSound.js';
import {
  EASE_SOFT,
  EditorialLine,
  EXIT_EASE_CSS,
  EXIT_NAME_MS,
  HOME_CURTAIN_IN_MS,
  HOME_CURTAIN_OUT_MS,
  HOME_HOLD_MS,
} from '../curtainShared.jsx';
import '../project-open.css';

const PAGE_IN_MS = 700;
const PAGE_HOLD_MS = 280;
const PAGE_OUT_MS = 900;

const EDITORIAL = new Set(['HOME', 'WORKS', 'ABOUT', "LET'S TALK", 'CONTACTS', 'CONTACT']);

/**
 * Yellow page curtain — HOME / WORKS share the detail-logo close
 * (rise from below → hold Didone word → slow lift).
 */
export function RouteCurtain({ active, label = '', onCovered, onDone }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(active ? 'in' : 'idle');
  const onCoveredRef = useRef(onCovered);
  const onDoneRef = useRef(onDone);
  onCoveredRef.current = onCovered;
  onDoneRef.current = onDone;

  const editorial = EDITORIAL.has(String(label).toUpperCase());
  const inMs = editorial ? HOME_CURTAIN_IN_MS : PAGE_IN_MS;
  const holdMs = editorial ? HOME_HOLD_MS : PAGE_HOLD_MS;
  const outMs = editorial ? HOME_CURTAIN_OUT_MS : PAGE_OUT_MS;

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return undefined;
    }
    if (reducedMotion) {
      onCoveredRef.current?.();
      onDoneRef.current?.();
      setPhase('idle');
      return undefined;
    }
    setPhase('in');
    playSound('raiseCurtain', { delay: 0.12 });
    const a = window.setTimeout(() => {
      onCoveredRef.current?.();
      setPhase('hold');
    }, inMs);
    const b = window.setTimeout(() => setPhase('out'), inMs + holdMs);
    const c = window.setTimeout(() => {
      setPhase('idle');
      onDoneRef.current?.();
    }, inMs + holdMs + outMs);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
    };
  }, [active, label, inMs, holdMs, outMs, reducedMotion]);

  if (phase === 'idle') return null;

  const out = phase === 'out';
  const rising = phase === 'in';
  const showTitle = phase === 'hold' || phase === 'out';

  return createPortal(
    <div
      className={`project-open${editorial ? ' project-open--home' : ''}`}
      style={{ zIndex: 200, pointerEvents: phase === 'idle' ? 'none' : 'auto' }}
      aria-hidden
    >
      <motion.div
        className="project-open__curtain"
        aria-hidden
        initial={rising ? { y: '118%' } : false}
        animate={{ y: out ? '-135%' : '0%' }}
        transition={{
          duration: (out ? outMs : inMs) / 1000,
          ease: EASE_SOFT,
        }}
      />
      {showTitle && label ? (
        <div
          className={`project-open__yellow-title project-open__yellow-title--home${
            out ? ' project-open__yellow-title--collapse' : ' project-open__yellow-title--in'
          }`}
          style={
            out
              ? {
                  clipPath: 'inset(0 0 100% 0)',
                  transition: `clip-path ${EXIT_NAME_MS}ms ${EXIT_EASE_CSS}`,
                }
              : undefined
          }
        >
          <p className="project-open__didone">
            <EditorialLine text={String(label).toUpperCase()} scramble />
          </p>
        </div>
      ) : null}
    </div>,
    document.body
  );
}

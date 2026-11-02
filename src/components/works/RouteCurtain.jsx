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
const PAGE_HOLD_MS = 480;
const PAGE_OUT_MS = 900;
/** Extra wait only if the destination still isn’t interactive after the full hold */
const READY_MAX_WAIT_MS = 8000;

const EDITORIAL = new Set(['HOME', 'WORKS', 'ABOUT', "LET'S TALK", 'CONTACTS', 'CONTACT']);

/**
 * Yellow page curtain — always plays the full in → hold → out animation.
 * If the destination isn’t ready when the hold ends, stay covered until it is.
 */
export function RouteCurtain({ active, label = '', ready = false, onCovered, onDone }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(active ? 'in' : 'idle');
  const onCoveredRef = useRef(onCovered);
  const onDoneRef = useRef(onDone);
  const holdStartedRef = useRef(0);
  onCoveredRef.current = onCovered;
  onDoneRef.current = onDone;

  const labelKey = String(label).toUpperCase();
  const editorial = EDITORIAL.has(labelKey);
  /* WORKS / ABOUT / CONTACT share the long Didone hold — ready never shortens it */
  const inMs = editorial ? HOME_CURTAIN_IN_MS : PAGE_IN_MS;
  const holdMs = editorial ? HOME_HOLD_MS : PAGE_HOLD_MS;
  const outMs = editorial ? HOME_CURTAIN_OUT_MS : PAGE_OUT_MS;

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      holdStartedRef.current = 0;
      return undefined;
    }
    if (reducedMotion) {
      onCoveredRef.current?.();
      onDoneRef.current?.();
      setPhase('idle');
      return undefined;
    }
    setPhase('in');
    holdStartedRef.current = 0;
    playSound('raiseCurtain', { delay: 0.12 });
    const a = window.setTimeout(() => {
      onCoveredRef.current?.();
      holdStartedRef.current = performance.now();
      setPhase('hold');
    }, inMs);
    return () => window.clearTimeout(a);
  }, [active, label, inMs, reducedMotion]);

  useEffect(() => {
    if (phase !== 'hold') return undefined;
    const tryLift = () => {
      const started = holdStartedRef.current || performance.now();
      const elapsed = performance.now() - started;
      if (ready && elapsed >= holdMs) {
        setPhase('out');
        return true;
      }
      return false;
    };
    if (tryLift()) return undefined;
    const id = window.setInterval(() => {
      if (tryLift()) window.clearInterval(id);
    }, 40);
    const max = window.setTimeout(() => setPhase('out'), holdMs + READY_MAX_WAIT_MS);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(max);
    };
  }, [phase, ready, holdMs]);

  useEffect(() => {
    if (phase !== 'out') return undefined;
    const c = window.setTimeout(() => {
      setPhase('idle');
      onDoneRef.current?.();
    }, outMs);
    return () => window.clearTimeout(c);
  }, [phase, outMs]);

  if (phase === 'idle') return null;

  const out = phase === 'out';
  const rising = phase === 'in';
  const showTitle = phase === 'hold' || phase === 'out';
  /* Block until lift starts — destination is ready by then */
  const blocking = phase === 'in' || phase === 'hold';

  return createPortal(
    <div
      className={`project-open${editorial ? ' project-open--home' : ''}`}
      style={{
        zIndex: 200,
        pointerEvents: blocking ? 'auto' : 'none',
      }}
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

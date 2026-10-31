import { useEffect, useRef, useState } from 'react';
import { playSound } from '../../lib/siteSound.js';
import '../project-open.css';

const IN_MS = 700;
const HOLD_MS = 280;
const OUT_MS = 900;

/**
 * Yellow page curtain for landing ↔ works index.
 * phase: covering (in) → hold → revealing (out) → gone
 */
export function RouteCurtain({ active, label = '', onCovered, onDone }) {
  const [phase, setPhase] = useState(active ? 'in' : 'idle');
  const onCoveredRef = useRef(onCovered);
  const onDoneRef = useRef(onDone);
  onCoveredRef.current = onCovered;
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) {
      setPhase('idle');
      return undefined;
    }
    setPhase('in');
    playSound('raiseCurtain', { delay: 0.12 });
    const a = window.setTimeout(() => {
      onCoveredRef.current?.();
      setPhase('hold');
    }, IN_MS);
    const b = window.setTimeout(() => setPhase('out'), IN_MS + HOLD_MS);
    const c = window.setTimeout(() => {
      setPhase('idle');
      onDoneRef.current?.();
    }, IN_MS + HOLD_MS + OUT_MS);
    return () => {
      window.clearTimeout(a);
      window.clearTimeout(b);
      window.clearTimeout(c);
    };
  }, [active]);

  if (phase === 'idle' && !active) return null;

  const out = phase === 'out';
  return (
    <div
      className={`project-open project-open--home${phase === 'in' || phase === 'hold' ? '' : ''}`}
      style={{ zIndex: 90, pointerEvents: phase === 'idle' ? 'none' : 'auto' }}
      aria-hidden
    >
      <div
        className="project-open__curtain"
        style={{
          transform: out ? 'translateY(-118%)' : 'translateY(0)',
          transition: `transform ${out ? OUT_MS : IN_MS}ms cubic-bezier(0.76, 0, 0.24, 1)`,
        }}
      />
      {label && (phase === 'hold' || phase === 'out') ? (
        <p
          className={`project-open__yellow-title project-open__yellow-title--home${
            out ? ' project-open__yellow-title--collapse' : ' project-open__yellow-title--in'
          }`}
        >
          {label}
        </p>
      ) : null}
    </div>
  );
}

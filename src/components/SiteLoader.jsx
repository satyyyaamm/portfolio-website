import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SiteReadyContext } from '../context/SiteReadyContext.jsx';

const MIN_LOAD_MS = 1800;
const SPLIT_DURATION = 0.9;
const SPLIT_EASE = [0.76, 0, 0.24, 1];
/** Pause after the split begins before hero / page animations run. */
export const SITE_ANIMATION_DELAY_MS = 520;

export function SiteLoader({ children }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(reducedMotion ? 'done' : 'loading');
  const [animationsEnabled, setAnimationsEnabled] = useState(Boolean(reducedMotion));
  const isActive = phase !== 'done';
  const splitting = phase === 'splitting';
  const siteReady = phase !== 'loading';

  useEffect(() => {
    if (reducedMotion) {
      setAnimationsEnabled(true);
      return undefined;
    }
    if (!siteReady) {
      setAnimationsEnabled(false);
      return undefined;
    }
    const tid = window.setTimeout(() => setAnimationsEnabled(true), SITE_ANIMATION_DELAY_MS);
    return () => window.clearTimeout(tid);
  }, [siteReady, reducedMotion]);

  useEffect(() => {
    if (!isActive) return undefined;
    document.body.classList.add('site-loader-active');
    return () => document.body.classList.remove('site-loader-active');
  }, [isActive]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    let cancelled = false;
    const started = performance.now();

    const beginSplit = () => {
      const remain = MIN_LOAD_MS - (performance.now() - started);
      window.setTimeout(() => {
        if (!cancelled) setPhase('splitting');
      }, Math.max(0, remain));
    };

    if (document.readyState === 'complete') beginSplit();
    else window.addEventListener('load', beginSplit, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', beginSplit);
    };
  }, [reducedMotion]);

  return (
    <SiteReadyContext.Provider value={animationsEnabled}>
      {/* Keep children in a stable wrapper so App never remounts after the split */}
      <div className="site-loader-main" {...(isActive ? { inert: true } : {})}>
        {children}
      </div>

      {isActive && (
        <div
          className="site-loader-overlay"
          role="status"
          aria-live="polite"
          aria-label={splitting ? 'Opening site' : 'Loading portfolio'}
        >
          <motion.div
            className="site-loader-panel site-loader-panel--left"
            initial={false}
            animate={{ x: splitting ? '-100%' : '0%' }}
            transition={{ duration: SPLIT_DURATION, ease: SPLIT_EASE }}
            onAnimationComplete={() => {
              if (splitting) setPhase('done');
            }}
          />
          <motion.div
            className="site-loader-panel site-loader-panel--right"
            initial={false}
            animate={{ x: splitting ? '100%' : '0%' }}
            transition={{ duration: SPLIT_DURATION, ease: SPLIT_EASE }}
          />

          {!splitting && (
            <div className="site-loader-content">
              <p className="site-loader-eyebrow">Portfolio</p>
              <p className="site-loader-name">Satyam Tiwari</p>
              <div className="site-loader-progress" aria-hidden>
                <motion.span
                  className="site-loader-progress__bar"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 0.92 }}
                  transition={{ duration: MIN_LOAD_MS / 1000, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </SiteReadyContext.Provider>
  );
}

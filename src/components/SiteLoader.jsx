import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SiteReadyContext } from '../context/SiteReadyContext.jsx';

const MIN_LOAD_MS = 1700;
const REVEAL_MS = 1.1;
const EASE = [0.22, 1, 0.36, 1];

export function SiteLoader({ children }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(reducedMotion ? 'done' : 'loading');
  const [animationsEnabled, setAnimationsEnabled] = useState(Boolean(reducedMotion));
  const isActive = phase !== 'done';
  const exiting = phase === 'exiting';

  useEffect(() => {
    if (reducedMotion) return undefined;
    import('@shadergradient/react').catch(() => {});
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion || phase === 'exiting' || phase === 'done') {
      setAnimationsEnabled(true);
    }
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (!isActive) return undefined;
    document.body.classList.add('site-loader-active');
    return () => document.body.classList.remove('site-loader-active');
  }, [isActive]);

  useEffect(() => {
    if (reducedMotion) return undefined;

    let cancelled = false;
    const started = performance.now();

    const finish = () => {
      const remain = MIN_LOAD_MS - (performance.now() - started);
      window.setTimeout(() => {
        if (!cancelled) setPhase('exiting');
      }, Math.max(0, remain));
    };

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener('load', finish);
    };
  }, [reducedMotion]);

  return (
    <SiteReadyContext.Provider value={animationsEnabled}>
      <div className="site-loader-main" {...(isActive ? { inert: true } : {})}>
        {children}
      </div>

      {isActive && (
        <motion.div
          className="site-loader-overlay"
          role="status"
          aria-live="polite"
          aria-label={exiting ? 'Opening site' : 'Loading portfolio'}
          initial={{ opacity: 1 }}
          animate={{ opacity: exiting ? 0 : 1 }}
          transition={{ duration: exiting ? REVEAL_MS : 0.3, ease: EASE }}
          onAnimationComplete={() => {
            if (exiting) setPhase('done');
          }}
        >
          {!exiting && (
            <motion.div
              className="site-loader-content"
              initial={reducedMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <p className="site-loader-label">Loading</p>
              <div className="site-loader-progress" aria-hidden>
                <motion.span
                  className="site-loader-progress__bar"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: MIN_LOAD_MS / 1000, ease: EASE }}
                />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </SiteReadyContext.Provider>
  );
}

import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { scrambleFrame } from './landing/Scramble.jsx';
import { SiteReadyContext } from '../context/SiteReadyContext.jsx';

const MIN_LOAD_MS = 3200;
const WORD_RISE_MS = 780;
const SUB_RISE_MS = 720;
const SUB_SCRAMBLE_MS = 900;
const INK_RISE_MS = 1400;
const INK_HOLD_MS = 380;
const REVEAL_MS = 1400;
const EASE_EXPO = [0.16, 1, 0.3, 1];
const EASE_SOFT = [0.22, 1, 0.36, 1];
const SUBTITLE = 'Tiwari';

function pad3(n) {
  return String(Math.max(0, Math.min(100, n))).padStart(3, '0');
}

export function SiteLoader({ children }) {
  const reducedMotion = useReducedMotion();
  const [phase, setPhase] = useState(reducedMotion ? 'done' : 'loading');
  const [progress, setProgress] = useState(0);
  const [showWord, setShowWord] = useState(false);
  const [showSub, setShowSub] = useState(false);
  const [inkRising, setInkRising] = useState(false);
  const [inkCovered, setInkCovered] = useState(false);
  const [subtitle, setSubtitle] = useState('');
  const [animationsEnabled, setAnimationsEnabled] = useState(Boolean(reducedMotion));
  const [brandGone, setBrandGone] = useState(false);
  const dotRef = useRef(null);
  const inkStarted = useRef(false);
  const inkCoveredRef = useRef(false);
  const finishStarted = useRef(false);
  const isActive = phase !== 'done';
  const revealing = phase === 'revealing';

  useEffect(() => {
    if (reducedMotion || phase === 'revealing' || phase === 'done') {
      setAnimationsEnabled(true);
    }
  }, [phase, reducedMotion]);

  useEffect(() => {
    if (!isActive) {
      document.body.classList.remove('site-loader-active', 'site-loader-revealing');
      return undefined;
    }
    document.body.classList.add('site-loader-active');
    return () => {
      document.body.classList.remove('site-loader-active', 'site-loader-revealing');
    };
  }, [isActive]);

  useEffect(() => {
    if (revealing) document.body.classList.add('site-loader-revealing');
    else document.body.classList.remove('site-loader-revealing');
  }, [revealing]);

  // Choreography: cream → Satyam rise → Tiwari scramble/rise → ink → reveal
  useEffect(() => {
    if (reducedMotion) return undefined;

    let cancelled = false;
    let raf = 0;
    let loadDone = document.readyState === 'complete';
    const started = performance.now();
    const holdAt = 86 + Math.floor(8 * Math.random());
    const timers = [];

    const later = (fn, ms) => {
      const id = window.setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
      timers.push(id);
      return id;
    };

    const onLoad = () => {
      loadDone = true;
    };
    window.addEventListener('load', onLoad, { once: true });

    // 1) Cream holds briefly, then Satyam rises from bottom
    later(() => setShowWord(true), 180);

    // 2) After Satyam settles, Tiwari rises + scrambles
    later(() => setShowSub(true), 180 + WORD_RISE_MS + 120);

    const tick = (now) => {
      if (cancelled) return;
      const elapsed = now - started;
      const t = Math.min(1, elapsed / MIN_LOAD_MS);
      const eased = 1 - (1 - t) ** 2.2;

      // 3) Black curtain with curvy top — after brand intro
      const brandReady = elapsed > 180 + WORD_RISE_MS + SUB_RISE_MS + 280;
      if (brandReady && eased >= 0.55 && !inkStarted.current) {
        inkStarted.current = true;
        setInkRising(true);
        // Color flip once ink is mostly behind the type
        later(() => {
          inkCoveredRef.current = true;
          setInkCovered(true);
        }, INK_RISE_MS * 0.55);
      }

      const readyToFinish = t >= 1 && loadDone && inkCoveredRef.current;
      if (!readyToFinish) {
        const p = Math.min(holdAt, Math.round(eased * holdAt));
        setProgress(p);
        raf = window.requestAnimationFrame(tick);
        return;
      }

      if (finishStarted.current) return;
      finishStarted.current = true;

      // 4) Hold on black, brand exits, curtain lifts (curvy bottom) + landing rises
      setProgress(100);
      later(() => setBrandGone(true), 80);
      later(() => {
        setAnimationsEnabled(true);
        setPhase('revealing');
      }, INK_HOLD_MS);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf);
      window.removeEventListener('load', onLoad);
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [reducedMotion]);

  // Tiwari scramble while it rises
  useEffect(() => {
    if (reducedMotion || !showSub || brandGone || revealing) return undefined;
    let frame = 0;
    const steps = Math.max(12, Math.round(SUB_SCRAMBLE_MS / 45));
    setSubtitle(scrambleFrame(SUBTITLE, 0));
    const id = window.setInterval(() => {
      frame += 1;
      if (frame >= steps) {
        setSubtitle(SUBTITLE);
        window.clearInterval(id);
        return;
      }
      setSubtitle(scrambleFrame(SUBTITLE, frame / steps));
    }, 45);
    return () => window.clearInterval(id);
  }, [reducedMotion, showSub, brandGone, revealing]);

  // Loader diamond follower
  useEffect(() => {
    const dot = dotRef.current;
    if (!dot || reducedMotion || !isActive) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return undefined;
    }

    const target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    const pos = { x: target.x, y: target.y };
    let visible = false;
    let raf = 0;

    const onMove = (event) => {
      target.x = event.clientX;
      target.y = event.clientY;
      if (!visible) {
        visible = true;
        pos.x = target.x;
        pos.y = target.y;
        dot.classList.add('is-on');
      }
    };
    const onLeave = () => {
      visible = false;
      dot.classList.remove('is-on');
    };
    const loop = () => {
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;
      raf = window.requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    raf = window.requestAnimationFrame(loop);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reducedMotion, isActive]);

  return (
    <SiteReadyContext.Provider value={animationsEnabled}>
      <div
        className="site-loader-main"
        data-page-content="true"
        {...(isActive ? { inert: true } : {})}
      >
        {children}
      </div>

      {isActive && (
        <div
          className={[
            'site-loader-overlay',
            inkRising ? 'is-ink-rising' : '',
            inkCovered ? 'is-ink' : '',
            revealing ? 'is-revealing' : '',
            brandGone ? 'is-brand-gone' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="status"
          aria-live="polite"
          aria-label={revealing ? 'Opening site' : `Loading ${progress}%`}
        >
          <div className="site-loader-cream" aria-hidden />

          {/* Curvy top on the way up; curvy bottom on the way out */}
          <motion.div
            className="site-loader-ink"
            aria-hidden
            initial={{ y: '118%' }}
            animate={{
              y: revealing ? '-118%' : inkRising || inkCovered ? '0%' : '118%',
            }}
            transition={{
              duration: revealing ? REVEAL_MS / 1000 : INK_RISE_MS / 1000,
              ease: EASE_SOFT,
            }}
            onAnimationComplete={() => {
              if (revealing) setPhase('done');
            }}
          />

          <div ref={dotRef} className="site-loader-diamond" aria-hidden />

          <div className="site-loader-brand">
            <div className="site-loader-line">
              <motion.p
                className="site-loader-word"
                initial={{ y: '120%', opacity: 0 }}
                animate={
                  brandGone || revealing
                    ? { y: '-130%', opacity: 0 }
                    : showWord
                      ? { y: '0%', opacity: 1 }
                      : { y: '120%', opacity: 0 }
                }
                transition={{
                  duration: brandGone || revealing ? 0.55 : WORD_RISE_MS / 1000,
                  ease: EASE_EXPO,
                }}
              >
                Satyam
              </motion.p>
            </div>

            <div className="site-loader-line">
              <motion.p
                className="site-loader-sub"
                aria-hidden
                initial={{ y: '140%', opacity: 0 }}
                animate={
                  brandGone || revealing
                    ? { y: '-140%', opacity: 0 }
                    : showSub
                      ? { y: '0%', opacity: 1 }
                      : { y: '140%', opacity: 0 }
                }
                transition={{
                  duration: brandGone || revealing ? 0.5 : SUB_RISE_MS / 1000,
                  ease: EASE_EXPO,
                  delay: brandGone || revealing ? 0.04 : 0,
                }}
              >
                {subtitle || '\u00a0'}
              </motion.p>
            </div>
          </div>

          <motion.p
            className="site-loader-count"
            aria-hidden
            initial={{ y: '120%', opacity: 0 }}
            animate={{
              y: brandGone || revealing ? '-120%' : showWord ? '0%' : '120%',
              opacity: brandGone || revealing ? 0 : showWord ? 1 : 0,
            }}
            transition={{
              duration: brandGone || revealing ? 0.45 : 0.65,
              ease: EASE_EXPO,
              delay: brandGone || revealing ? 0 : 0.2,
            }}
          >
            {pad3(progress)}
          </motion.p>
        </div>
      )}
    </SiteReadyContext.Provider>
  );
}

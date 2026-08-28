import {
  Children,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  useMotionValue,
  useSpring,
  useReducedMotion,
} from 'framer-motion';
import { ShaderBackground } from './ShaderBackground.jsx';
import { slideHashFromIndex, slideIndexFromHash } from '../lib/slides.js';

/** Heavy, controlled — follows scroll without fighting it. */
const SPRING = { stiffness: 95, damping: 28, mass: 0.8 };

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Scroll-driven card journey (Shader Gradient–inspired).
 * Tall track + fixed stage; each card's y/scale/opacity = f(scroll progress).
 */
export function CardJourney({ cards, children }) {
  const reducedMotion = useReducedMotion();
  const trackRef = useRef(null);
  const childList = useMemo(() => Children.toArray(children), [children]);
  const count = cards.length;

  const [active, setActive] = useState(() =>
    typeof window !== 'undefined' ? slideIndexFromHash(window.location.hash, cards) : 0
  );
  const activeRef = useRef(active);
  const progressMV = useMotionValue(0);
  const progressSpring = useSpring(progressMV, reducedMotion ? { stiffness: 400, damping: 40 } : SPRING);
  const [bgProgress, setBgProgress] = useState(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    if (import.meta.env.DEV && childList.length !== count) {
      console.warn(`[CardJourney] children (${childList.length}) !== cards (${count})`);
    }
  }, [childList.length, count]);

  useEffect(() => {
    let raf = 0;
    const unsub = progressSpring.on('change', (v) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        setBgProgress(count <= 1 ? 0 : clamp(v / (count - 1), 0, 1));
      });
    });
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, [progressSpring, count]);

  const setHash = useCallback(
    (index, { replace = false } = {}) => {
      const hash = slideHashFromIndex(index, cards);
      if (window.location.hash === hash) return;
      if (replace) window.history.replaceState(null, '', hash);
      else window.history.pushState(null, '', hash);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
    [cards]
  );

  const scrollToIndex = useCallback(
    (index, { replace = false } = {}) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = clamp(index, 0, count - 1);
      window.scrollTo({
        top: track.offsetTop + clamped * window.innerHeight,
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
      setActive(clamped);
      setHash(clamped, { replace });
    },
    [count, reducedMotion, setHash]
  );

  useEffect(() => {
    const onScroll = () => {
      const track = trackRef.current;
      if (!track) return;
      const raw = (window.scrollY - track.offsetTop) / window.innerHeight;
      const p = clamp(raw, 0, Math.max(0, count - 1));
      progressMV.set(p);

      const nearest = clamp(Math.round(p), 0, count - 1);
      if (nearest !== activeRef.current) {
        setActive(nearest);
        setHash(nearest, { replace: true });
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [count, progressMV, setHash]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.defaultPrevented) return;
      const tag = e.target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || e.target?.isContentEditable) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        e.preventDefault();
        scrollToIndex(activeRef.current + 1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        scrollToIndex(activeRef.current - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        scrollToIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        scrollToIndex(count - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [count, scrollToIndex]);

  useEffect(() => {
    const onNavigate = (e) => {
      const raw = e.detail?.hash ?? e.detail?.id;
      if (!raw) return;
      scrollToIndex(slideIndexFromHash(raw, cards));
    };
    window.addEventListener('portfolio:navigate', onNavigate);
    return () => window.removeEventListener('portfolio:navigate', onNavigate);
  }, [cards, scrollToIndex]);

  useEffect(() => {
    const onPop = () => {
      scrollToIndex(slideIndexFromHash(window.location.hash, cards), { replace: true });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [cards, scrollToIndex]);

  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#') {
      setHash(0, { replace: true });
      return;
    }
    const start = slideIndexFromHash(window.location.hash, cards);
    requestAnimationFrame(() => scrollToIndex(start, { replace: true }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="card-journey">
      <div
        ref={trackRef}
        className="card-journey__track"
        style={{ height: `${count * 100}vh` }}
        aria-hidden
      />

      <div className="card-journey__stage">
        <ShaderBackground progress={bgProgress} />

        <div className="card-journey__field">
          {cards.map((card, i) => (
            <JourneyCard
              key={card.id}
              index={i}
              card={card}
              progress={progressSpring}
              reducedMotion={reducedMotion}
              isActive={i === active}
            >
              {childList[i]}
            </JourneyCard>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Scroll progress → card transform.
 * d = progress - index: 0 = focused, <0 upcoming from below, >0 leaving upward.
 */
function JourneyCard({ index, card, progress, reducedMotion, isActive, children }) {
  const [style, setStyle] = useState(() => ({
    opacity: index === 0 ? 1 : 0,
    transform: 'translate3d(-50%, -50%, 0) scale(1)',
    zIndex: index === 0 ? 10 : 1,
    pointerEvents: index === 0 ? 'auto' : 'none',
  }));

  useEffect(() => {
    const update = (p) => {
      const d = p - index;
      const abs = Math.abs(d);

      if (reducedMotion) {
        const on = abs < 0.5;
        setStyle({
          opacity: on ? 1 : 0,
          transform: 'translate3d(-50%, -50%, 0) scale(1)',
          zIndex: on ? 10 : 1,
          pointerEvents: on ? 'auto' : 'none',
        });
        return;
      }

      // Out of range — fully hidden (GPU-friendly)
      if (abs > 1.35) {
        setStyle({
          opacity: 0,
          transform: `translate3d(-50%, calc(-50% + ${d > 0 ? -70 : 70}vh), 0) scale(0.82)`,
          zIndex: 1,
          pointerEvents: 'none',
        });
        return;
      }

      const y = clamp(d * -42, -78, 78);
      const scale = clamp(1 - abs * 0.16, 0.72, 1);
      const opacity = clamp(1 - abs * 0.72, 0, 1);

      setStyle({
        opacity,
        transform: `translate3d(-50%, calc(-50% + ${y}vh), 0) scale(${scale})`,
        zIndex: Math.round(20 - abs * 10),
        pointerEvents: abs < 0.42 ? 'auto' : 'none',
      });
    };

    update(progress.get());
    return progress.on('change', update);
  }, [index, progress, reducedMotion]);

  return (
    <article
      id={card.id}
      data-journey-card={card.type}
      aria-hidden={!isActive}
      className={`journey-card journey-card--${card.type}${isActive ? ' is-active' : ''}`}
      style={style}
    >
      <div className="journey-card__inner">{children}</div>
    </article>
  );
}

export { CardJourney as SlideJourney };

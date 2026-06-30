import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useSpring, useReducedMotion } from 'framer-motion';
import sa1 from '../assets/sa/sa1.png';
import { HERO_PHONE_SCREENS } from './HeroPhoneScreens.jsx';
import { useSiteAnimationsEnabled } from '../context/SiteReadyContext.jsx';

const STATIC_FALLBACK = {
  'safe-again': sa1,
  vault: sa1,
  route: sa1,
};

const TILT = 8;
const SCREEN_INTERVAL_MS = 6500;

export function HeroPhone() {
  const reducedMotion = useReducedMotion();
  const animating = useSiteAnimationsEnabled();
  const [index, setIndex] = useState(0);
  const rotateX = useSpring(0, { stiffness: 160, damping: 24 });
  const rotateY = useSpring(0, { stiffness: 160, damping: 24 });

  const slide = HERO_PHONE_SCREENS[index];
  const Screen = slide.Screen;

  useEffect(() => {
    if (reducedMotion || !animating) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % HERO_PHONE_SCREENS.length);
    }, SCREEN_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [reducedMotion, animating]);

  const handleMove = (e) => {
    if (reducedMotion || !animating) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * TILT * 2);
    rotateX.set(-py * TILT * 2);
  };

  const handleLeave = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  const entranceHidden = { opacity: 0, y: 28 };
  const entranceVisible = { opacity: 1, y: 0 };

  return (
    <motion.div
      className="hero-phone-wrap"
      initial={reducedMotion ? false : entranceHidden}
      animate={reducedMotion ? undefined : animating ? entranceVisible : entranceHidden}
      transition={{ delay: animating ? 0.15 : 0, duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="hero-phone-ambient" aria-hidden />
      <motion.div
        className="hero-phone-tilt"
        style={
          reducedMotion || !animating
            ? undefined
            : {
                rotateX,
                rotateY,
                transformPerspective: 1400,
              }
        }
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
      >
        <motion.div
          className="hero-phone-float"
          animate={reducedMotion || !animating ? undefined : { y: [0, -8, 0] }}
          transition={
            reducedMotion || !animating
              ? undefined
              : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          }
        >
          <div className="hero-phone-device" role="img" aria-label={slide.label}>
            <div className="hero-phone-bezel">
              <div className="hero-phone-island" aria-hidden>
                <span className="hero-phone-island-lens" />
              </div>
              <div className="hero-phone-screen">
                {reducedMotion ? (
                  <img
                    src={STATIC_FALLBACK[slide.id]}
                    alt={slide.label}
                    className="hero-phone-shot"
                    draggable={false}
                  />
                ) : !animating ? (
                  <div className="hero-phone-app hero-phone-app--hold" aria-hidden />
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={slide.id}
                      className="hero-phone-app"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
                    >
                      <Screen />
                    </motion.div>
                  </AnimatePresence>
                )}
                <div className="hero-phone-glare" aria-hidden />
                <div className="hero-phone-home-indicator" aria-hidden />
              </div>
            </div>
            <div className="hero-phone-btn hero-phone-btn--silent" aria-hidden />
            <div className="hero-phone-btn hero-phone-btn--volume-up" aria-hidden />
            <div className="hero-phone-btn hero-phone-btn--volume-down" aria-hidden />
            <div className="hero-phone-btn hero-phone-btn--power" aria-hidden />
          </div>

          <p className="hero-phone-caption">{animating ? slide.label : ''}</p>

          <div className="hero-phone-dots" role="tablist" aria-label="Featured apps">
            {HERO_PHONE_SCREENS.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={item.label}
                className={`hero-phone-dot${i === index ? ' hero-phone-dot--active' : ''}`}
                onClick={() => setIndex(i)}
                disabled={!animating}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
      <div className="hero-phone-shadow" aria-hidden />
    </motion.div>
  );
}

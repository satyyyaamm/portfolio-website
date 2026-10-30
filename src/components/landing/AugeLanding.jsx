import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ABOUT_PARAGRAPH } from '../../lib/slides.js';
import { useSiteAnimationsEnabled } from '../../context/SiteReadyContext.jsx';
import { Scramble } from './Scramble.jsx';
import { GlProjectStrip } from './gl/GlProjectStrip.jsx';
import './auge-landing.css';

/** Fast lift, then settle into place (Auge-like expo feel). */
const RISE_EASE = [0.05, 0.9, 0.1, 1];

function riseProps(ready, reduced, settled, { from = '28vh', delay = 0, duration = 1.05 } = {}) {
  if (reduced) return { initial: false };
  // After the intro, lock at y:0 with no transition so Framer drops the
  // ongoing transform layer (keeps WebGL from compositing-flicker).
  if (settled) {
    return { initial: false, animate: { y: 0 }, transition: { duration: 0 } };
  }
  return {
    initial: { y: from },
    animate: ready ? { y: 0 } : { y: from },
    transition: { duration, ease: RISE_EASE, delay },
  };
}

export function AugeLanding({
  projects,
  onOpenProject,
  stripPaused = false,
  socialItems = [],
  EMAIL_MAILTO,
  PHONE_DISPLAY,
  PHONE_TEL,
  formData,
  setFormData,
  contactFormStatus,
  contactFormError,
  contactHoneypot,
  setContactHoneypot,
  handleContactSubmit,
}) {
  const reducedMotion = useReducedMotion();
  const siteReady = useSiteAnimationsEnabled();
  const stageRef = useRef(null);
  const stripRef = useRef(null);
  const lowerRef = useRef(null);
  const cursorTipRef = useRef(null);
  const cursorDotRef = useRef(null);
  const viewTipOnRef = useRef(false);
  const cardHoverRef = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLink, setDrawerLink] = useState(null);
  const [viewTipOn, setViewTipOn] = useState(false);
  const [spreadPct, setSpreadPct] = useState(60);
  const [strengthPct, setStrengthPct] = useState(200);
  const [markHover, setMarkHover] = useState(false);
  const [labelScrambleKey, setLabelScrambleKey] = useState(0);
  // Drop Framer transforms after the rise so the WebGL layer isn't left in a
  // composited transform (that was flashing the stage on some GPUs).
  const [riseSettled, setRiseSettled] = useState(Boolean(reducedMotion));

  useEffect(() => {
    if (reducedMotion || !siteReady || riseSettled) return undefined;
    const id = window.setTimeout(() => setRiseSettled(true), 1600);
    return () => window.clearTimeout(id);
  }, [reducedMotion, siteReady, riseSettled]);

  const triggerLabelScramble = () => {
    if (reducedMotion) return;
    setLabelScrambleKey((n) => n + 1);
  };

  const syncViewTip = (x, y, visible) => {
    const tip = cursorTipRef.current;
    if (tip) {
      tip.style.transform = `translate3d(${x + 18}px, ${y + 14}px, 0)`;
      tip.style.opacity = visible ? '1' : '0';
    }
    if (viewTipOnRef.current !== visible) {
      viewTipOnRef.current = visible;
      setViewTipOn(visible);
    }
  };

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    if (reducedMotion) return undefined;
    triggerLabelScramble();
    const id = window.setInterval(() => triggerLabelScramble(), 4200);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Yellow cursor follower — lerps behind the pointer for a soft offset.
  useEffect(() => {
    const dot = cursorDotRef.current;
    if (!dot || reducedMotion) return undefined;
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) {
      return undefined;
    }

    const target = { x: window.innerWidth * 0.5, y: window.innerHeight * 0.5 };
    const pos = { x: target.x, y: target.y };
    let pointerInside = false;
    let overCardStable = false;
    let overCardFrames = 0;
    let shown = false;
    let raf = 0;

    const applyVisibility = (show) => {
      if (show === shown) return;
      shown = show;
      // Instant hide/show — opacity transitions were reading as flicker at card edges.
      dot.style.opacity = show ? '1' : '0';
      dot.classList.toggle('is-on', show);
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
      overCardStable = false;
      overCardFrames = 0;
      applyVisibility(false);
    };

    const tick = () => {
      pos.x += (target.x - pos.x) * 0.14;
      pos.y += (target.y - pos.y) * 0.14;
      dot.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%)`;

      // Hysteresis: need a few consistent frames before flipping over-card state.
      const rawOver = cardHoverRef.current || viewTipOnRef.current;
      if (rawOver === overCardStable) {
        overCardFrames = 0;
      } else {
        overCardFrames += 1;
        if (overCardFrames >= (rawOver ? 2 : 6)) {
          overCardStable = rawOver;
          overCardFrames = 0;
        }
      }

      applyVisibility(pointerInside && !overCardStable);
      raf = window.requestAnimationFrame(tick);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
    };
  }, [reducedMotion]);

  return (
    <div className="auge-track" id="top">
      <div ref={cursorDotRef} className="auge-cursor-dot" aria-hidden />
      <div
        ref={cursorTipRef}
        className={`auge-view-tip${viewTipOn ? ' is-on' : ''}`}
        aria-hidden={!viewTipOn}
      >
        <Scramble text="View project" active={viewTipOn} steps={10} intervalMs={28} />
      </div>

      <div className="auge-stage" ref={stageRef}>
        <motion.a
          href="#top"
          className="auge-mark"
          aria-label="Satyam"
          onPointerEnter={() => setMarkHover(true)}
          onPointerLeave={() => setMarkHover(false)}
          onFocus={() => setMarkHover(true)}
          onBlur={() => setMarkHover(false)}
          {...riseProps(siteReady, reducedMotion, riseSettled, { from: '18vh', delay: 0.16, duration: 0.95 })}
        >
          <Scramble text="S" active={markHover} steps={36} intervalMs={120} />
          <span className="auge-sr">Satyam</span>
        </motion.a>

        {/* Carousel sits under the loader curtain, then rises fast→slow into place */}
        <motion.div
          className="auge-rise auge-rise--strip"
          {...riseProps(siteReady, reducedMotion, riseSettled, { from: '42vh', delay: 0, duration: 1.2 })}
        >
          <GlProjectStrip
            ref={stripRef}
            projects={projects}
            menuOpen={menuOpen}
            stripPaused={stripPaused}
            reducedMotion={Boolean(reducedMotion)}
            spreadPct={spreadPct}
            strengthPct={strengthPct}
            onOpenProject={onOpenProject}
            onViewTip={syncViewTip}
            onHoverChange={(item) => {
              cardHoverRef.current = Boolean(item);
            }}
            labelScrambleKey={labelScrambleKey}
          />
        </motion.div>

        <motion.div
          className="auge-lower auge-lower--ghost"
          ref={lowerRef}
          {...riseProps(siteReady, reducedMotion, riseSettled, { from: '36vh', delay: 0.05, duration: 1.15 })}
        >
          <h1 className="auge-word">Satyam</h1>
          <div className="auge-copy" onPointerEnter={triggerLabelScramble}>
            <p className="auge-copy__label">Satyam Tiwari©</p>
            <p className="auge-copy__body">{ABOUT_PARAGRAPH}</p>
          </div>
        </motion.div>

        <motion.footer
          className="auge-footer"
          {...riseProps(siteReady, reducedMotion, riseSettled, { from: '22vh', delay: 0.12, duration: 1 })}
        >
          <p>© {new Date().getFullYear()} Satyam Tiwari</p>
        </motion.footer>

        <motion.div
          className="auge-corner"
          {...riseProps(siteReady, reducedMotion, riseSettled, { from: '26vh', delay: 0.08, duration: 1.05 })}
        >
          <div
            className={`auge-drawer${drawerOpen ? ' is-open' : ''}`}
            onPointerEnter={() => setDrawerOpen(true)}
            onPointerLeave={() => {
              setDrawerOpen(false);
              setDrawerLink(null);
            }}
            onFocus={() => setDrawerOpen(true)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDrawerOpen(false);
                setDrawerLink(null);
              }
            }}
          >
            <div className="auge-drawer__panel" id="auge-drawer-menu">
              <nav className="auge-drawer__nav" aria-label="Site">
                <button
                  type="button"
                  className="auge-drawer__link"
                  onPointerEnter={() => setDrawerLink('works')}
                  onPointerLeave={() => setDrawerLink(null)}
                  onFocus={() => setDrawerLink('works')}
                  onClick={() => {
                    setDrawerOpen(false);
                    stripRef.current?.wrap?.scrollIntoView?.({ block: 'nearest' });
                  }}
                >
                  <span className="auge-drawer__label">
                    <Scramble text="Works" active={drawerOpen && drawerLink === 'works'} />
                  </span>
                  <span className="auge-sr">Works</span>
                </button>
                <button
                  type="button"
                  className="auge-drawer__link"
                  onPointerEnter={() => setDrawerLink('about')}
                  onPointerLeave={() => setDrawerLink(null)}
                  onFocus={() => setDrawerLink('about')}
                  onClick={() => {
                    setDrawerOpen(false);
                    setMenuOpen(true);
                  }}
                >
                  <span className="auge-drawer__label">
                    <Scramble text="About" active={drawerOpen && drawerLink === 'about'} />
                  </span>
                  <span className="auge-sr">About</span>
                </button>
                <button
                  type="button"
                  className="auge-drawer__link"
                  onPointerEnter={() => setDrawerLink('talk')}
                  onPointerLeave={() => setDrawerLink(null)}
                  onFocus={() => setDrawerLink('talk')}
                  onClick={() => {
                    setDrawerOpen(false);
                    setMenuOpen(true);
                  }}
                >
                  <span className="auge-drawer__label">
                    <Scramble text="Let's talk" active={drawerOpen && drawerLink === 'talk'} />
                  </span>
                  <span className="auge-sr">Let's talk</span>
                </button>
              </nav>

              <div
                className="auge-drawer__tune"
                onPointerDown={(e) => e.stopPropagation()}
              >
                <label className="auge-drawer__tune-row">
                  <span className="auge-drawer__tune-label">
                    Spread <em>{spreadPct}%</em>
                  </span>
                  <input
                    type="range"
                    min={5}
                    max={150}
                    step={1}
                    value={spreadPct}
                    onChange={(e) => setSpreadPct(Number(e.target.value))}
                    aria-label="Distortion spread"
                  />
                </label>
                <label className="auge-drawer__tune-row">
                  <span className="auge-drawer__tune-label">
                    Strength <em>{strengthPct}%</em>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={300}
                    step={1}
                    value={strengthPct}
                    onChange={(e) => setStrengthPct(Number(e.target.value))}
                    aria-label="Distortion strength"
                  />
                </label>
              </div>

              <span className="auge-drawer__bars" aria-hidden>
                <span />
                <span />
              </span>
            </div>
          </div>

          <nav className="auge-footer__links" aria-label="Social links">
            {socialItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith('mailto:') ? undefined : '_blank'}
                rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </motion.div>
      </div>

      {menuOpen ? (
        <div
          className="auge-overlay"
          id="auge-menu"
          role="dialog"
          aria-modal="true"
          aria-label="About and contact"
        >
          <div className="auge-overlay__bar">
            <button
              type="button"
              className="auge-overlay__close"
              onClick={() => setMenuOpen(false)}
              autoFocus
            >
              Close
            </button>
          </div>
          <div className="auge-overlay__grid">
            <section>
              <h2>About</h2>
              <p>{ABOUT_PARAGRAPH}</p>
            </section>
            <section>
              <h2>Contact</h2>
              <div className="auge-overlay__links">
                <a href={EMAIL_MAILTO}>satyamt5152@gmail.com</a>
                <a href={PHONE_TEL}>{PHONE_DISPLAY}</a>
              </div>
              <form className="auge-form" onSubmit={handleContactSubmit} noValidate>
                <div className="auge-sr" aria-hidden>
                  <label htmlFor="company_website">Company</label>
                  <input
                    id="company_website"
                    name="company_website"
                    tabIndex={-1}
                    autoComplete="off"
                    value={contactHoneypot}
                    onChange={(e) => setContactHoneypot(e.target.value)}
                  />
                </div>
                <label>
                  Name
                  <input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData((d) => ({ ...d, name: e.target.value }))}
                  />
                </label>
                <label>
                  Email
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData((d) => ({ ...d, email: e.target.value }))}
                  />
                </label>
                <label>
                  Message
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData((d) => ({ ...d, message: e.target.value }))}
                  />
                </label>
                {contactFormError ? <p className="auge-form__error">{contactFormError}</p> : null}
                <button type="submit" disabled={contactFormStatus === 'sending'}>
                  {contactFormStatus === 'sending'
                    ? 'Sending…'
                    : contactFormStatus === 'success'
                      ? 'Sent'
                      : 'Send message'}
                </button>
              </form>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}

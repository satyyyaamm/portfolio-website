import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ABOUT_PARAGRAPH } from '../../lib/slides.js';
import { useSiteAnimationsEnabled } from '../../context/SiteReadyContext.jsx';
import { Scramble } from './Scramble.jsx';
import { GlProjectStrip } from './gl/GlProjectStrip.jsx';
import { SoundToggle } from '../SoundToggle.jsx';
import { playHoverSound, playSound } from '../../lib/siteSound.js';
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
  onOpenWorksIndex,
  onOpenAbout,
  onOpenContact,
  stripPaused = false,
  cursorSuppressRef,
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
  const viewTipOnRef = useRef(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLink, setDrawerLink] = useState(null);
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

  // Drive SiteCursor label morph (diamond → View project), not a separate tip.
  const syncCursorLabel = () => {
    if (!cursorSuppressRef) return;
    cursorSuppressRef.current = Boolean(viewTipOnRef.current);
  };

  const syncViewTip = (_x, _y, visible) => {
    if (viewTipOnRef.current === visible) return;
    viewTipOnRef.current = visible;
    syncCursorLabel();
  };

  useEffect(() => {
    if (stripPaused) {
      viewTipOnRef.current = false;
      syncCursorLabel();
      return;
    }
    // Returning from detail — tip/cursor re-armed by the strip hit-test on resume
    syncCursorLabel();
  }, [stripPaused, cursorSuppressRef]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    playSound('openMenu');
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

  return (
    <div className="auge-track" id="top">
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

        {/* After rise, drop Framer transforms so difference blend reaches the stage */}
        <motion.footer
          className="auge-footer"
          {...(riseSettled
            ? { initial: false }
            : riseProps(siteReady, reducedMotion, riseSettled, { from: '22vh', delay: 0.12, duration: 1 }))}
        >
          <p>© {new Date().getFullYear()} Satyam Tiwari</p>
          <SoundToggle className="auge-footer__sound" />
        </motion.footer>

        <motion.div
          className="auge-corner"
          {...(riseSettled
            ? { initial: false }
            : riseProps(siteReady, reducedMotion, riseSettled, { from: '26vh', delay: 0.08, duration: 1.05 }))}
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
                  onPointerEnter={() => {
                    setDrawerLink('works');
                    playHoverSound('hoverButton');
                  }}
                  onPointerLeave={() => setDrawerLink(null)}
                  onFocus={() => setDrawerLink('works')}
                  onClick={() => {
                    playSound('clickMenuItem');
                    setDrawerOpen(false);
                    if (onOpenWorksIndex) onOpenWorksIndex();
                    else stripRef.current?.wrap?.scrollIntoView?.({ block: 'nearest' });
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
                  onPointerEnter={() => {
                    setDrawerLink('about');
                    playHoverSound('hoverButton');
                  }}
                  onPointerLeave={() => setDrawerLink(null)}
                  onFocus={() => setDrawerLink('about')}
                  onClick={() => {
                    playSound('clickMenuItem');
                    setDrawerOpen(false);
                    if (onOpenAbout) onOpenAbout();
                    else setMenuOpen(true);
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
                  onPointerEnter={() => {
                    setDrawerLink('talk');
                    playHoverSound('hoverButton');
                  }}
                  onPointerLeave={() => setDrawerLink(null)}
                  onFocus={() => setDrawerLink('talk')}
                  onClick={() => {
                    playSound('clickMenuItem');
                    setDrawerOpen(false);
                    if (onOpenContact) onOpenContact();
                    else setMenuOpen(true);
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
                onPointerEnter={() => playHoverSound('hoverFooterItem')}
                onClick={() => playSound('clickMenuItem')}
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
              onClick={() => {
                playSound('clickMenuItem');
                setMenuOpen(false);
              }}
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

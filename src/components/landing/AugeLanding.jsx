import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ABOUT_PARAGRAPH } from '../../lib/slides.js';
import './auge-landing.css';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOOP_COPIES = 4;
/** px per second — cards enter tall on the right and shrink as they travel left */
const SPEED = 160;
const GAP = 0;
/** Fixed lean (deg) while the strip is moving from user input — not scaled by scroll amount */
const SCROLL_SKEW = 8;
/** Auto-scroll only soft-stops after the pointer rests on a card this long */
const HOVER_PAUSE_MS = 500;

function projectKind(project) {
  const raw = project.meta?.split('·')[0]?.trim() || project.role || 'Project';
  return raw;
}

function scrambleFrame(target, reveal) {
  const count = target.length;
  return [...target]
    .map((ch, i) => {
      if (ch === ' ' || ch === '\n' || ch === '—' || ch === '-' || ch === ',' || ch === '.' || ch === "'") {
        return ch;
      }
      if (i < reveal * count) return ch;
      const glyph = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      return ch === ch.toLowerCase() ? glyph.toLowerCase() : glyph;
    })
    .join('');
}

function Scramble({ text, active = true }) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(text);

  useEffect(() => {
    if (!active || reduced) {
      setShown(text);
      return undefined;
    }

    let frame = 0;
    const steps = 12;
    setShown(scrambleFrame(text, 0));
    const id = window.setInterval(() => {
      frame += 1;
      if (frame >= steps) {
        setShown(text);
        window.clearInterval(id);
        return;
      }
      setShown(scrambleFrame(text, frame / steps));
    }, 32);
    const done = window.setTimeout(() => setShown(text), steps * 32 + 50);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(done);
    };
  }, [text, active, reduced]);

  return <span aria-hidden>{shown}</span>;
}

function cardWidthFor(index, vw) {
  const scales = [1, 1.1, 0.96, 1.14, 0.98, 1.06, 1.08];
  const scale = scales[index % scales.length];
  return Math.round(Math.min(vw * 0.38, 520) * scale);
}

/**
 * Right edge of the rail window = tallest.
 * Left edge = shortest. Cards shrink gently as they travel left.
 */
function heightForCenterX(centerX, viewportW, maxH, minH) {
  if (viewportW <= 0) return maxH;
  const t = Math.max(0, Math.min(1, centerX / viewportW));
  const eased = t * t * (3 - 2 * t);
  return minH + (maxH - minH) * eased;
}

function normalizeWheelDelta(event) {
  let raw =
    Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  if (event.deltaMode === 1) raw *= 16;
  if (event.deltaMode === 2) raw *= typeof window !== 'undefined' ? window.innerHeight : 800;
  return raw;
}

export function AugeLanding({
  projects,
  onOpenProject,
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
  const railRef = useRef(null);
  const windowRef = useRef(null);
  const stageRef = useRef(null);
  const lowerRef = useRef(null);
  const offsetRef = useRef(0);
  const setWidthRef = useRef(0);
  const hoverRef = useRef(null);
  const hoverSinceRef = useRef(0);
  const hoverBrakeStartedRef = useRef(false);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const focusRef = useRef(0);
  const userVelocityRef = useRef(0);
  /** 1 = slide right, -1 = slide left — follows last scroll/drag direction */
  const autoDirRef = useRef(-1);
  const dragRef = useRef({ active: false, x: 0, moved: false });
  const resumeAutoAtRef = useRef(0);
  const skewRef = useRef(0);
  const skewTargetRef = useRef(0);
  /** Skew only from real wheel/drag — not from hover soft-brake coast. */
  const skewArmedRef = useRef(false);

  const [hoverIndex, setHoverIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLink, setDrawerLink] = useState(null);
  /** Project chrome (name / View) only after 0.5s hover and strip fully at rest */
  const [stripIdle, setStripIdle] = useState(true);
  const [hoverHeld, setHoverHeld] = useState(false);
  const stripIdleRef = useRef(true);
  const hoverHeldRef = useRef(false);

  const wrapOffset = (value) => {
    const setW = setWidthRef.current;
    if (setW <= 0) return value;
    let next = value;
    while (next <= -setW) next += setW;
    while (next > 0) next -= setW;
    return next;
  };

  const paintTransform = () => {
    const skew = `${skewRef.current.toFixed(3)}deg`;
    if (railRef.current) {
      railRef.current.style.transform = `translate3d(${offsetRef.current}px,0,0) skewX(${skew})`;
    }
    if (lowerRef.current) {
      lowerRef.current.style.transform = `skewX(${skew})`;
    }
  };

  const nudgeOffset = (deltaPx) => {
    offsetRef.current = wrapOffset(offsetRef.current + deltaPx);
    paintTransform();
  };

  /** Constant skew while interacting — direction only, same lean whether soft or hard scroll. */
  const setScrollSkew = (direction, { arm = false } = {}) => {
    if (arm) skewArmedRef.current = true;
    if (!direction) {
      skewTargetRef.current = 0;
      return;
    }
    if (!skewArmedRef.current) return;
    // Lean opposite travel so motion reads as a fast pass.
    skewTargetRef.current = direction > 0 ? -SCROLL_SKEW : SCROLL_SKEW;
  };

  const disarmSkew = () => {
    skewArmedRef.current = false;
    skewTargetRef.current = 0;
  };

  const loop = useMemo(() => {
    if (!projects.length) return [];
    const out = [];
    for (let copy = 0; copy < LOOP_COPIES; copy += 1) {
      projects.forEach((project, i) => {
        out.push({
          project,
          projectIndex: i,
          key: `${project.id}-${copy}`,
          copy,
        });
      });
    }
    return out;
  }, [projects]);

  const measureSetWidth = () => {
    const rail = railRef.current;
    if (!rail || !projects.length) return;
    const cards = [...rail.querySelectorAll('[data-card]')];
    if (cards.length < projects.length) return;
    const first = cards[0];
    const boundary = cards[projects.length];
    if (boundary) {
      setWidthRef.current = Math.max(1, boundary.offsetLeft - first.offsetLeft);
      return;
    }
    const last = cards[projects.length - 1];
    setWidthRef.current = Math.max(1, last.offsetLeft + last.offsetWidth + GAP);
  };

  const paintHeights = () => {
    const rail = railRef.current;
    const win = windowRef.current;
    if (!rail || !win) return;

    const vw = win.clientWidth || window.innerWidth;
    const maxH = win.clientHeight * 0.9;
    const minH = maxH * 0.5;
    const cards = rail.querySelectorAll('[data-card]');
    let best = focusRef.current;
    let bestScore = -Infinity;

    cards.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      // Same-frame update for every card — height shrinks from the bottom (top-aligned rail).
      const height = heightForCenterX(centerX, vw, maxH, minH);
      el.style.height = `${height}px`;

      const inView = centerX > -rect.width && centerX < vw + rect.width;
      if (!inView) return;

      // Prefer the taller card near the right-center of the stage.
      const focusX = vw * 0.62;
      const proximity = 1 - Math.min(1, Math.abs(centerX - focusX) / (vw * 0.55));
      const tallness = (height - minH) / Math.max(1, maxH - minH);
      const score = proximity * 0.55 + tallness * 0.45;
      if (score > bestScore) {
        bestScore = score;
        best = Number(el.dataset.projectIndex);
      }
    });

    if (best !== focusRef.current && Number.isFinite(best)) {
      focusRef.current = best;
    }
  };

  useLayoutEffect(() => {
    measureSetWidth();
    offsetRef.current = 0;
    skewRef.current = 0;
    skewTargetRef.current = 0;
    paintTransform();
    paintHeights();
    const onResize = () => {
      measureSetWidth();
      offsetRef.current = wrapOffset(offsetRef.current);
      paintTransform();
      paintHeights();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return undefined;

    const onWheel = (event) => {
      if (menuOpen) return;
      const raw = normalizeWheelDelta(event);
      if (!raw) return;
      event.preventDefault();
      // Stronger wheel response — more travel per scroll tick, with a longer coast.
      const impulse = -raw * 0.82;
      nudgeOffset(impulse);
      if (impulse !== 0) autoDirRef.current = impulse > 0 ? 1 : -1;
      userVelocityRef.current = Math.max(
        -980,
        Math.min(980, userVelocityRef.current * 0.5 + impulse * 4.4)
      );
      setScrollSkew(impulse !== 0 ? Math.sign(impulse) : autoDirRef.current, { arm: true });
      resumeAutoAtRef.current = performance.now() + 900;
    };

    stage.addEventListener('wheel', onWheel, { passive: false });
    return () => stage.removeEventListener('wheel', onWheel);
  }, [menuOpen]);

  useEffect(() => {
    const win = windowRef.current;
    if (!win) return undefined;

    const onPointerDown = (event) => {
      if (event.button !== 0) return;
      dragRef.current = { active: true, x: event.clientX, moved: false };
      userVelocityRef.current = 0;
      resumeAutoAtRef.current = Number.POSITIVE_INFINITY;
      win.setPointerCapture?.(event.pointerId);
    };

    const onPointerMove = (event) => {
      if (!dragRef.current.active) return;
      const dx = event.clientX - dragRef.current.x;
      if (Math.abs(dx) > 2) dragRef.current.moved = true;
      dragRef.current.x = event.clientX;
      nudgeOffset(dx);
      if (dx !== 0) autoDirRef.current = dx > 0 ? 1 : -1;
      userVelocityRef.current = Math.max(-720, Math.min(720, dx * 16));
      if (dx !== 0) setScrollSkew(Math.sign(dx), { arm: true });
    };

    const endDrag = (event) => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      if (userVelocityRef.current !== 0) {
        autoDirRef.current = userVelocityRef.current > 0 ? 1 : -1;
      }
      // Ease skew back once the drag ends — coast still carries velocity briefly.
      resumeAutoAtRef.current = performance.now() + 1200;
      try {
        win.releasePointerCapture?.(event.pointerId);
      } catch {
        /* noop */
      }
    };

    win.addEventListener('pointerdown', onPointerDown);
    win.addEventListener('pointermove', onPointerMove);
    win.addEventListener('pointerup', endDrag);
    win.addEventListener('pointercancel', endDrag);
    return () => {
      win.removeEventListener('pointerdown', onPointerDown);
      win.removeEventListener('pointermove', onPointerMove);
      win.removeEventListener('pointerup', endDrag);
      win.removeEventListener('pointercancel', endDrag);
    };
  }, [projects.length]);

  useEffect(() => {
    if (reducedMotion) {
      skewRef.current = 0;
      skewTargetRef.current = 0;
      paintTransform();
      paintHeights();
      return undefined;
    }

    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(48, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      // Pause only after resting on a card ≥0.5s. Mid-scroll on a card still skews.
      const hoverLongEnough =
        Boolean(hoverRef.current) && ts - hoverSinceRef.current >= HOVER_PAUSE_MS;
      if (hoverLongEnough !== hoverHeldRef.current) {
        hoverHeldRef.current = hoverLongEnough;
        setHoverHeld(hoverLongEnough);
      }
      const hoveringIdle =
        hoverLongEnough &&
        !dragRef.current.active &&
        !skewArmedRef.current &&
        Math.abs(userVelocityRef.current) <= 6;

      if (hoveringIdle) {
        if (!hoverBrakeStartedRef.current) {
          hoverBrakeStartedRef.current = true;
          if (Math.abs(userVelocityRef.current) < 6) {
            userVelocityRef.current = autoDirRef.current * SPEED;
          }
        }
        disarmSkew();
        let delta = userVelocityRef.current * dt;
        userVelocityRef.current *= Math.pow(0.012, dt);
        if (Math.abs(userVelocityRef.current) < 5) {
          userVelocityRef.current = 0;
        }
        if (delta !== 0) nudgeOffset(delta);
      } else if (!menuOpen && !dragRef.current.active) {
        let delta = userVelocityRef.current * dt;
        userVelocityRef.current *= Math.pow(0.0008, dt);

        if (Math.abs(userVelocityRef.current) > 6) {
          if (skewArmedRef.current) {
            setScrollSkew(Math.sign(userVelocityRef.current));
          } else {
            setScrollSkew(0);
          }
        } else {
          userVelocityRef.current = 0;
          disarmSkew();
          // Keep auto-driving through brief card passes; hold only after a held hover.
          if (!hoverLongEnough && ts >= resumeAutoAtRef.current) {
            delta += autoDirRef.current * SPEED * dt;
          }
        }

        if (delta !== 0) {
          nudgeOffset(delta);
        }
      } else if (dragRef.current.active) {
        setScrollSkew(autoDirRef.current, { arm: true });
      }

      // Snappy on (~10–15°), quick straighten when scroll stops.
      const skewEase = skewTargetRef.current === 0
        ? 1 - Math.pow(0.00008, dt)
        : 1 - Math.pow(0.000015, dt);
      skewRef.current += (skewTargetRef.current - skewRef.current) * skewEase;
      if (Math.abs(skewRef.current) < 0.05 && skewTargetRef.current === 0) {
        skewRef.current = 0;
      }
      paintTransform();

      const idle =
        !dragRef.current.active &&
        Math.abs(userVelocityRef.current) < 6 &&
        !skewArmedRef.current &&
        Math.abs(skewRef.current) < 0.15 &&
        skewTargetRef.current === 0;
      if (idle !== stripIdleRef.current) {
        stripIdleRef.current = idle;
        setStripIdle(idle);
      }

      paintHeights();
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      lastTsRef.current = 0;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion, menuOpen, projects.length]);

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

  return (
    <div className="auge-track">
      <div className="auge-stage" ref={stageRef}>
          <div
            className="auge-rail-window"
            ref={windowRef}
            onPointerLeave={() => {
              if (hoverRef.current && hoverBrakeStartedRef.current) {
                resumeAutoAtRef.current = performance.now() + 400;
              }
              hoverRef.current = null;
              hoverSinceRef.current = 0;
              hoverBrakeStartedRef.current = false;
              hoverHeldRef.current = false;
              setHoverHeld(false);
              setHoverIndex(null);
            }}
          >
            <div className="auge-rail" ref={railRef} aria-label="Projects">
              {loop.map((item) => {
                const hot =
                  stripIdle &&
                  hoverHeld &&
                  hoverIndex === item.projectIndex &&
                  hoverRef.current === item.key;
                const width = cardWidthFor(item.projectIndex, typeof window !== 'undefined' ? window.innerWidth : 1200);
                return (
                  <button
                    key={item.key}
                    type="button"
                    data-card
                    data-project-index={item.projectIndex}
                    className={`auge-card${hot ? ' is-hot' : ''}`}
                    style={{ width: `${width}px` }}
                    onMouseEnter={() => {
                      hoverRef.current = item.key;
                      hoverSinceRef.current = performance.now();
                      hoverBrakeStartedRef.current = false;
                      hoverHeldRef.current = false;
                      setHoverHeld(false);
                      setHoverIndex(item.projectIndex);
                    }}
                    onPointerEnter={() => {
                      hoverRef.current = item.key;
                      hoverSinceRef.current = performance.now();
                      hoverBrakeStartedRef.current = false;
                      hoverHeldRef.current = false;
                      setHoverHeld(false);
                      setHoverIndex(item.projectIndex);
                    }}
                    onMouseLeave={() => {
                      if (hoverRef.current === item.key) {
                        const wasPaused = hoverBrakeStartedRef.current;
                        hoverRef.current = null;
                        hoverSinceRef.current = 0;
                        hoverBrakeStartedRef.current = false;
                        hoverHeldRef.current = false;
                        setHoverHeld(false);
                        setHoverIndex(null);
                        if (wasPaused) {
                          resumeAutoAtRef.current = performance.now() + 450;
                        }
                      }
                    }}
                    onFocus={() => {
                      hoverRef.current = item.key;
                      hoverSinceRef.current = performance.now();
                      hoverBrakeStartedRef.current = false;
                      hoverHeldRef.current = false;
                      setHoverHeld(false);
                      setHoverIndex(item.projectIndex);
                    }}
                    onBlur={() => {
                      if (hoverRef.current === item.key) {
                        const wasPaused = hoverBrakeStartedRef.current;
                        hoverRef.current = null;
                        hoverSinceRef.current = 0;
                        hoverBrakeStartedRef.current = false;
                        hoverHeldRef.current = false;
                        setHoverHeld(false);
                        setHoverIndex(null);
                        if (wasPaused) {
                          resumeAutoAtRef.current = performance.now() + 450;
                        }
                      }
                    }}
                    onClick={(event) => {
                      if (dragRef.current.moved) {
                        event.preventDefault();
                        dragRef.current.moved = false;
                        return;
                      }
                      onOpenProject?.(item.projectIndex);
                    }}
                  >
                    <img src={item.project.image} alt="" />
                    <span className="auge-card__view">View project</span>
                    <span className="auge-card__meta">
                      <span className="auge-card__name">
                        <Scramble text={item.project.name} active={hot} />
                      </span>
                      <span className="auge-card__kind">
                        <Scramble text={projectKind(item.project)} active={hot} />
                      </span>
                    </span>
                    <span className="auge-sr">{`View ${item.project.name}`}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="auge-lower" ref={lowerRef}>
            <h1 className="auge-word">Satyam</h1>
            <div className="auge-copy">
              <p className="auge-copy__label">Satyam Tiwari©</p>
              <p className="auge-copy__body">{ABOUT_PARAGRAPH}</p>
            </div>
          </div>

          <footer className="auge-footer">
            <p>© {new Date().getFullYear()} Satyam Tiwari</p>
          </footer>

          <div className="auge-corner">
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
                      windowRef.current?.scrollIntoView?.({ block: 'nearest' });
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
          </div>
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

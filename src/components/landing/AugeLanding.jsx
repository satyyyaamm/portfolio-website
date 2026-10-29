import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ABOUT_PARAGRAPH } from '../../lib/slides.js';
import './auge-landing.css';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOOP_COPIES = 4;
/** px per second — cards enter tall on the right and shrink as they travel left */
const SPEED = 160;
const GAP = 0;

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
  const offsetRef = useRef(0);
  const setWidthRef = useRef(0);
  const hoverRef = useRef(null);
  const rafRef = useRef(0);
  const lastTsRef = useRef(0);
  const focusRef = useRef(0);
  const userVelocityRef = useRef(0);
  /** 1 = slide right, -1 = slide left — follows last scroll/drag direction */
  const autoDirRef = useRef(-1);
  const dragRef = useRef({ active: false, x: 0, moved: false });
  const resumeAutoAtRef = useRef(0);

  const [hoverIndex, setHoverIndex] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const wrapOffset = (value) => {
    const setW = setWidthRef.current;
    if (setW <= 0) return value;
    let next = value;
    while (next <= -setW) next += setW;
    while (next > 0) next -= setW;
    return next;
  };

  const paintTransform = () => {
    if (railRef.current) {
      railRef.current.style.transform = `translate3d(${offsetRef.current}px,0,0)`;
    }
  };

  const nudgeOffset = (deltaPx) => {
    offsetRef.current = wrapOffset(offsetRef.current + deltaPx);
    paintTransform();
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
      // Soft impulse — avoid 1:1 pixel jumps that make the strip feel hyper.
      const impulse = -raw * 0.42;
      nudgeOffset(impulse);
      if (impulse !== 0) autoDirRef.current = impulse > 0 ? 1 : -1;
      userVelocityRef.current = Math.max(
        -620,
        Math.min(620, userVelocityRef.current * 0.55 + impulse * 3.2)
      );
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
    };

    const endDrag = (event) => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      if (userVelocityRef.current !== 0) {
        autoDirRef.current = userVelocityRef.current > 0 ? 1 : -1;
      }
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
      paintHeights();
      return undefined;
    }

    const tick = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = Math.min(48, ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;

      if (!menuOpen && !dragRef.current.active) {
        let delta = userVelocityRef.current * dt;
        userVelocityRef.current *= Math.pow(0.0008, dt);

        if (Math.abs(userVelocityRef.current) < 6) {
          userVelocityRef.current = 0;
          if (ts >= resumeAutoAtRef.current) {
            delta += autoDirRef.current * SPEED * dt;
          }
        }

        if (delta !== 0) {
          nudgeOffset(delta);
        }
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
            hoverRef.current = null;
            setHoverIndex(null);
          }}
        >
          <div className="auge-rail" ref={railRef} aria-label="Projects">
            {loop.map((item) => {
              const hot = hoverIndex === item.projectIndex && hoverRef.current === item.key;
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
                    setHoverIndex(item.projectIndex);
                  }}
                  onPointerEnter={() => {
                    hoverRef.current = item.key;
                    setHoverIndex(item.projectIndex);
                  }}
                  onMouseLeave={() => {
                    if (hoverRef.current === item.key) {
                      hoverRef.current = null;
                      setHoverIndex(null);
                    }
                  }}
                  onFocus={() => {
                    hoverRef.current = item.key;
                    setHoverIndex(item.projectIndex);
                  }}
                  onBlur={() => {
                    if (hoverRef.current === item.key) {
                      hoverRef.current = null;
                      setHoverIndex(null);
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

        <div className="auge-lower">
          <h1 className="auge-word">Satyam</h1>
          <div className="auge-copy">
            <p className="auge-copy__label">Satyam Tiwari©</p>
            <p className="auge-copy__body">{ABOUT_PARAGRAPH}</p>
          </div>
        </div>

        <footer className="auge-footer">
          <p>© {new Date().getFullYear()} Satyam Tiwari</p>
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
        </footer>

        <button
          type="button"
          className="auge-menu-btn"
          aria-expanded={menuOpen}
          aria-controls="auge-menu"
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
          <span className="auge-sr">Open menu</span>
        </button>
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

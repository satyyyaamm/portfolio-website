import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Lenis from 'lenis';
import { useRouteInteractive } from '../../lib/useRouteInteractive.js';
import { Scramble, ScrambleHover } from '../landing/Scramble.jsx';
import { AugeChrome } from '../chrome/AugeChrome.jsx';
import { playHoverSound, playSound } from '../../lib/siteSound.js';
import {
  CONTACT_EMAIL,
  CONTACT_EMAIL_HREF,
  CONTACT_HERO,
  CONTACT_HERO_GIF,
  CONTACT_PANELS,
  CONTACT_SUBTITLE,
  contactMediaFromProjects,
} from '../../lib/contactContent.js';
import { ContactSurfaceWarp } from './ContactSurfaceWarp.jsx';
import '../landing/auge-landing.css';
import './contact.css';

const RISE = [0.16, 1, 0.3, 1];

/** Periodic scramble — same idea as About year / Auge rotating glyphs. */
function ScrambleLoop({ text, everyMs = 3800, steps = 12, intervalMs = 34 }) {
  const reduced = useReducedMotion();
  const [pulse, setPulse] = useState(0);

  useEffect(() => {
    if (reduced) return undefined;
    const id = window.setInterval(() => setPulse((n) => n + 1), everyMs);
    return () => window.clearInterval(id);
  }, [everyMs, reduced]);

  return (
    <Scramble key={pulse} text={text} active={!reduced} steps={steps} intervalMs={intervalMs} />
  );
}

function Glyph({ part }) {
  const cls = [
    part.bold ? 'contact-hero__bold' : '',
    part.ital ? 'contact-hero__ital' : '',
    part.accent ? 'contact-hero__accent' : '',
    part.scramble ? 'contact-hero__scramble' : '',
    part.q ? 'contact-hero__q' : '',
  ]
    .filter(Boolean)
    .join(' ');
  const body = part.scramble ? <ScrambleLoop text={part.text} /> : part.text;
  return (
    <span className={cls || undefined} aria-label={part.scramble ? part.text : undefined}>
      {body}
    </span>
  );
}

function Tok({ children, delay = 0, reduced, settled = false }) {
  return (
    <span className="contact-hero__tok">
      <motion.span
        className="contact-hero__tok-in"
        initial={reduced || settled ? false : { y: '110%' }}
        animate={{ y: '0%' }}
        transition={{ duration: 0.95, ease: RISE, delay }}
      >
        {children}
      </motion.span>
    </span>
  );
}

function PanelMedia({ item, className = '' }) {
  if (!item) return null;
  return (
    <div className={`contact-panel__media ${className}`.trim()}>
      <div className="contact-panel__media-in">
        {item.kind === 'video' ? (
          <video
            src={item.src}
            poster={item.poster || undefined}
            muted
            loop
            playsInline
            autoPlay
            preload="metadata"
          />
        ) : (
          <img src={item.src} alt="" />
        )}
      </div>
    </div>
  );
}

function OfficePanel({ panel, media, socialItems, index, revealed }) {
  const reduced = useReducedMotion();
  const style = {
    backgroundColor: panel.bg,
    color: panel.color,
    zIndex: index + 1,
  };

  return (
    <section
      className="contact-panel contact-panel--office"
      style={style}
      aria-label={panel.kicker}
      data-contact-panel={panel.id}
    >
      <div className="contact-panel__grid">
        <div>
          <p className="contact-kicker">
            <ScrambleHover text={panel.kicker} />
          </p>
          <p className="contact-panel__city">
            {panel.titleLines.map((line, i) => (
              <span className="contact-panel__city-line" key={`${panel.id}-${line}`}>
                <motion.span
                  className="contact-panel__city-in"
                  initial={reduced ? false : { y: '110%' }}
                  animate={reduced || revealed ? { y: '0%' } : { y: '110%' }}
                  transition={{ duration: 0.95, ease: RISE, delay: 0.04 + i * 0.06 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </p>
        </div>

        <div>
          <p className="contact-kicker">
            <ScrambleHover text={panel.addressKicker} />
          </p>
          <div className="contact-panel__body">
            <div className="contact-panel__address-row">
              {panel.social ? (
                <ul className="contact-panel__social">
                  {(socialItems.length
                    ? socialItems
                    : panel.lines.map((label) => ({ label, href: '#' }))
                  ).map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target={item.href?.startsWith('mailto:') ? undefined : '_blank'}
                        rel={
                          item.href?.startsWith('mailto:') ? undefined : 'noopener noreferrer'
                        }
                        onPointerEnter={() => playHoverSound('hoverFooterItem')}
                        onClick={() => playSound('clickMenuItem')}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="contact-panel__lines">{panel.lines.join('\n')}</p>
              )}
              {panel.link ? (
                <a
                  className="contact-panel__link"
                  href={panel.link.href}
                  target={panel.link.href.startsWith('mailto:') ? undefined : '_blank'}
                  rel={
                    panel.link.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'
                  }
                  onPointerEnter={() => playHoverSound('hoverButton')}
                  onClick={() => playSound('clickMenuItem')}
                >
                  <span>{panel.link.label}</span>
                  <span aria-hidden>→</span>
                </a>
              ) : null}
            </div>
            <PanelMedia item={media} className="contact-panel__media--desktop" />
          </div>
        </div>
      </div>
      <PanelMedia item={media} className="contact-panel__media--mobile" />
    </section>
  );
}

export function ContactPage({
  projects = [],
  socialItems = [],
  emailMailto = CONTACT_EMAIL_HREF,
  readyRequestId = 0,
  onInteractive,
  onHome,
  onOpenWorks,
  onOpenAbout,
}) {
  const scrollRef = useRef(null);
  const [warpOn, setWarpOn] = useState(() =>
    typeof window !== 'undefined' ? !window.matchMedia('(max-width: 720px)').matches : true
  );
  useEffect(() => {
    if (warpOn) return undefined;
    const t = window.setTimeout(() => setWarpOn(true), 700);
    return () => window.clearTimeout(t);
  }, [warpOn]);
  const lockupRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const media = useMemo(() => contactMediaFromProjects(projects), [projects]);
  const heroMedia = CONTACT_HERO_GIF;
  const emailLabel = emailMailto.replace(/^mailto:/i, '') || CONTACT_EMAIL;
  const [revealed, setRevealed] = useState(() => new Set(reducedMotion ? CONTACT_PANELS.map((p) => p.id) : []));
  const [fitTick, setFitTick] = useState(0);
  const [riseDone, setRiseDone] = useState(Boolean(reducedMotion));
  const isReady = useCallback(() => {
    const root = scrollRef.current;
    if (!root) return false;
    const box = root.getBoundingClientRect();
    /* Layout + first font-fit — don’t wait on the 1.4s rise animation */
    return box.width > 2 && box.height > 2 && (fitTick > 0 || reducedMotion);
  }, [fitTick, reducedMotion]);
  useRouteInteractive(readyRequestId, onInteractive, isReady);
  const contentKey = [
    'warp-no-lockup-box-v9',
    CONTACT_HERO_GIF.src,
    ...CONTACT_PANELS.map((p) => p.gif?.src || p.id),
    `fit-${fitTick}`,
  ].join('|');

  useEffect(() => {
    if (reducedMotion) {
      setRiseDone(true);
      return undefined;
    }
    const id = window.setTimeout(() => setRiseDone(true), 1400);
    return () => window.clearTimeout(id);
  }, [reducedMotion]);

  /* Scale lockup to panel width, then signal warp to (re)bake at settled size. */
  useEffect(() => {
    const el = lockupRef.current;
    if (!el) return undefined;
    let fitTimer = 0;

    const fit = () => {
      const rows = [...el.querySelectorAll('.contact-hero__row')];
      if (!rows.length) return;

      el.style.fontSize = '';
      rows.forEach((row) => {
        row.style.width = 'max-content';
      });

      const base = parseFloat(getComputedStyle(el).fontSize);
      const avail = el.clientWidth;
      let longest = 0;
      rows.forEach((row) => {
        longest = Math.max(longest, row.getBoundingClientRect().width);
      });

      rows.forEach((row) => {
        row.style.width = '';
      });

      if (!base || longest < 1 || avail < 1) return;
      const next = base * ((avail * 0.9) / longest);
      el.style.fontSize = `${Math.max(16, Math.min(next, base))}px`;
      window.clearTimeout(fitTimer);
      fitTimer = window.setTimeout(() => setFitTick((n) => n + 1), 80);
    };

    const schedule = () => {
      requestAnimationFrame(() => requestAnimationFrame(fit));
    };
    schedule();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(schedule) : null;
    ro?.observe(el);
    if (el.parentElement) ro?.observe(el.parentElement);
    window.addEventListener('resize', schedule);
    const fontsReady = document.fonts?.ready?.then?.(schedule);
    return () => {
      window.clearTimeout(fitTimer);
      ro?.disconnect();
      window.removeEventListener('resize', schedule);
      fontsReady?.catch?.(() => {});
    };
  }, [heroMedia, reducedMotion]);

  useEffect(() => {
    const root = scrollRef.current;
    const content = root?.firstElementChild;
    if (!root || !(content instanceof HTMLElement) || reducedMotion) return undefined;

    const lenis = new Lenis({
      wrapper: root,
      content,
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: true,
      syncTouchLerp: 0.07,
      touchInertiaExponent: 1.55,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.3,
      overscroll: false,
    });
    root.classList.add('contact-page__scroll--smooth');
    return () => {
      root.classList.remove('contact-page__scroll--smooth');
      lenis.destroy();
    };
  }, [reducedMotion]);

  // Lenis breaks Framer whileInView — reveal city lines via the contact scroller
  useEffect(() => {
    if (reducedMotion) return undefined;
    const root = scrollRef.current;
    if (!root) return undefined;
    const nodes = [...root.querySelectorAll('[data-contact-panel]')];
    if (!nodes.length) return undefined;
    const io = new IntersectionObserver(
      (entries) => {
        setRevealed((prev) => {
          const next = new Set(prev);
          let changed = false;
          entries.forEach((entry) => {
            const id = entry.target.getAttribute('data-contact-panel');
            if (id && entry.isIntersecting && !next.has(id)) {
              next.add(id);
              changed = true;
            }
          });
          return changed ? next : prev;
        });
      },
      { root, threshold: 0.28 }
    );
    nodes.forEach((node) => io.observe(node));
    return () => io.disconnect();
  }, [reducedMotion]);

  return createPortal(
    <div className="contact-page">
      <div className="contact-page__scroll" ref={scrollRef}>
        <div className="contact-page__stack">
          <section className="contact-panel contact-panel--hero" aria-label="Contact">
            <h1 className="contact-hero__lockup" ref={lockupRef} aria-label="Ready to be in touch?">
              <span className="contact-hero__row">
                {CONTACT_HERO.line1.map((tok, i) => (
                  <Tok key={tok.key} delay={0.04 + i * 0.08} reduced={reducedMotion} settled={riseDone}>
                    {tok.parts.map((part, pi) => (
                      <Glyph key={`${tok.key}-${pi}`} part={part} />
                    ))}
                  </Tok>
                ))}
              </span>
              <br />
              <span className="contact-hero__row">
                {CONTACT_HERO.line2.map((tok, i) => {
                  if (tok.arrow) {
                    return (
                      <Tok key={tok.key} delay={0.32} reduced={reducedMotion} settled={riseDone}>
                        <span className="contact-hero__arrow" aria-hidden>
                          <svg viewBox="0 0 64 72" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path
                              d="M18 6c2 18 4 34 22 46"
                              stroke="currentColor"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                            />
                            <path
                              d="M28 46c8 2 14 4 16 8l-12 2 4-14"
                              stroke="currentColor"
                              strokeWidth="3.2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </Tok>
                    );
                  }
                  if (tok.media) {
                    if (!heroMedia) return null;
                    return (
                      <span className="contact-hero__media" key={tok.key} aria-hidden>
                        {heroMedia.kind === 'video' ? (
                          <video
                            src={heroMedia.src}
                            poster={heroMedia.poster || undefined}
                            muted
                            loop
                            playsInline
                            autoPlay
                            preload="metadata"
                          />
                        ) : (
                          <img src={heroMedia.src} alt="" />
                        )}
                      </span>
                    );
                  }
                  return (
                    <Tok key={tok.key} delay={0.4 + i * 0.06} reduced={reducedMotion} settled={riseDone}>
                      {tok.parts.map((part, pi) => (
                        <Glyph key={`${tok.key}-${pi}`} part={part} />
                      ))}
                    </Tok>
                  );
                })}
              </span>
            </h1>

            <div className="contact-hero__meta">
              <p className="contact-kicker">
                <ScrambleHover text={CONTACT_SUBTITLE} />
              </p>
              <div className="contact-hero__meta-link">
                <a
                  className="contact-email"
                  href={emailMailto}
                  onPointerEnter={() => playHoverSound('hoverButton')}
                  onClick={() => playSound('clickMenuItem')}
                >
                  <span className="contact-email__label">{emailLabel}</span>
                  <span className="contact-email__arrow" aria-hidden>
                    →
                  </span>
                </a>
              </div>
            </div>
          </section>

          {CONTACT_PANELS.map((panel, index) => (
            <OfficePanel
              key={panel.id}
              panel={panel}
              index={index}
              revealed={revealed.has(panel.id)}
              media={panel.gif || media[panel.imageKey] || media[0] || null}
              socialItems={socialItems}
            />
          ))}
        </div>
      </div>

      {riseDone && fitTick > 0 && warpOn ? (
        <ContactSurfaceWarp scrollRef={scrollRef} contentKey={contentKey} />
      ) : null}

      <AugeChrome
        socialItems={socialItems}
        onHome={onHome}
        navItems={[
          { id: 'works', label: 'Works', onClick: onOpenWorks },
          { id: 'about', label: 'About', onClick: onOpenAbout },
          { id: 'home', label: 'Home', onClick: onHome },
        ]}
      />
    </div>,
    document.body
  );
}

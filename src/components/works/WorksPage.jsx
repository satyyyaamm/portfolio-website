import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { Scramble } from '../landing/Scramble.jsx';
import { SoundToggle } from '../SoundToggle.jsx';
import { playHoverSound, playSound } from '../../lib/siteSound.js';
import { WorksCarousel } from './WorksCarousel.jsx';
import { WorksSurfaceWarp } from './WorksSurfaceWarp.jsx';
import '../landing/auge-landing.css';
import './works.css';

export function WorksPage({
  projects,
  paused = false,
  cursorSuppressRef,
  socialItems = [],
  onOpenProject,
  onHome,
  onOpenAbout,
  onOpenWorks,
  emailMailto = 'mailto:satyamt5152@gmail.com',
}) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef(null);
  const carouselHostRef = useRef(null);
  const velocityRef = useRef(0);
  const dragRef = useRef(false);
  const pulseRef = useRef(null);
  const glRectsRef = useRef({ media: [], thumbs: [], fill: null });
  const viewTipOnRef = useRef(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerLink, setDrawerLink] = useState(null);
  const [markHover, setMarkHover] = useState(false);

  const syncTip = (_x, _y, visible) => {
    if (viewTipOnRef.current === visible) return;
    viewTipOnRef.current = visible;
    if (cursorSuppressRef) cursorSuppressRef.current = visible;
  };

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevH = html.style.overflow;
    const prevB = body.style.overflow;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    return () => {
      html.style.overflow = prevH;
      body.style.overflow = prevB;
      if (cursorSuppressRef) cursorSuppressRef.current = false;
    };
  }, [cursorSuppressRef]);

  return (
    <div className="works-page is-locked" ref={rootRef}>
      <div ref={carouselHostRef} style={{ position: 'absolute', inset: 0 }}>
        <WorksCarousel
          projects={projects}
          paused={paused}
          onOpenProject={onOpenProject}
          onViewTip={syncTip}
          velocityRef={velocityRef}
          dragRef={dragRef}
          pulseRef={pulseRef}
          glRectsRef={glRectsRef}
        >
          <WorksSurfaceWarp
            rootRef={carouselHostRef}
            projects={projects}
            velocityRef={velocityRef}
            dragRef={dragRef}
            glRectsRef={glRectsRef}
            reducedMotion={Boolean(reducedMotion)}
          />
        </WorksCarousel>
      </div>

      <div className="works-chrome">
        <a
          href="/"
          className="auge-mark"
          aria-label="Home"
          onPointerEnter={() => setMarkHover(true)}
          onPointerLeave={() => setMarkHover(false)}
          onClick={(event) => {
            event.preventDefault();
            playSound('clickMenuItem');
            onHome?.();
          }}
        >
          <Scramble text="S" active={markHover} steps={36} intervalMs={120} />
          <span className="auge-sr">Satyam</span>
        </a>

        <footer className="auge-footer">
          <p>© {new Date().getFullYear()} Satyam Tiwari</p>
          <SoundToggle className="auge-footer__sound" />
        </footer>

        <div className="auge-corner">
          <div
            className={`auge-drawer${drawerOpen ? ' is-open' : ''}`}
            onPointerEnter={() => setDrawerOpen(true)}
            onPointerLeave={() => {
              setDrawerOpen(false);
              setDrawerLink(null);
            }}
          >
            <div className="auge-drawer__panel">
              <nav className="auge-drawer__nav" aria-label="Site">
                <button
                  type="button"
                  className="auge-drawer__link"
                  onPointerEnter={() => {
                    setDrawerLink('works');
                    playHoverSound('hoverButton');
                  }}
                  onPointerLeave={() => setDrawerLink(null)}
                  onClick={() => {
                    playSound('clickMenuItem');
                    onOpenWorks?.();
                  }}
                >
                  <span className="auge-drawer__label">
                    <Scramble text="Works" active={drawerOpen && drawerLink === 'works'} />
                  </span>
                </button>
                <button
                  type="button"
                  className="auge-drawer__link"
                  onPointerEnter={() => {
                    setDrawerLink('about');
                    playHoverSound('hoverButton');
                  }}
                  onPointerLeave={() => setDrawerLink(null)}
                  onClick={() => {
                    playSound('clickMenuItem');
                    onOpenAbout?.();
                  }}
                >
                  <span className="auge-drawer__label">
                    <Scramble text="About" active={drawerOpen && drawerLink === 'about'} />
                  </span>
                </button>
                <a
                  className="auge-drawer__link"
                  href={emailMailto}
                  onPointerEnter={() => {
                    setDrawerLink('talk');
                    playHoverSound('hoverButton');
                  }}
                  onPointerLeave={() => setDrawerLink(null)}
                  onClick={() => playSound('clickMenuItem')}
                >
                  <span className="auge-drawer__label">
                    <Scramble text="Let's talk" active={drawerOpen && drawerLink === 'talk'} />
                  </span>
                </a>
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
                onPointerEnter={() => playHoverSound('hoverFooterItem')}
                onClick={() => playSound('clickMenuItem')}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

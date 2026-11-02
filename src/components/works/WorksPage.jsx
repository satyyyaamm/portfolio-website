import { useCallback, useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useRouteInteractive } from '../../lib/useRouteInteractive.js';
import { AugeChrome } from '../chrome/AugeChrome.jsx';
import { WorksCarousel } from './WorksCarousel.jsx';
import { WorksSurfaceWarp } from './WorksSurfaceWarp.jsx';
import '../landing/auge-landing.css';
import './works.css';

export function WorksPage({
  projects,
  paused = false,
  cursorSuppressRef,
  socialItems = [],
  readyRequestId = 0,
  onInteractive,
  onOpenProject,
  onHome,
  onOpenAbout,
  onOpenContact,
  onOpenWorks,
}) {
  const reducedMotion = useReducedMotion();
  const [warpOn, setWarpOn] = useState(() =>
    typeof window !== 'undefined' ? !window.matchMedia('(max-width: 720px)').matches : true
  );
  useEffect(() => {
    if (warpOn) return undefined;
    /* Short defer — page must scroll immediately; warp is cosmetic */
    const t = window.setTimeout(() => setWarpOn(true), 280);
    return () => window.clearTimeout(t);
  }, [warpOn]);
  const rootRef = useRef(null);
  const carouselHostRef = useRef(null);
  const velocityRef = useRef(0);
  const dragRef = useRef(false);
  const pulseRef = useRef(null);
  const glRectsRef = useRef({ media: [], thumbs: [], fill: null });
  const viewTipOnRef = useRef(false);

  const isReady = useCallback(() => {
    const host = carouselHostRef.current;
    if (!host) return false;
    const box = host.getBoundingClientRect();
    return box.width > 2 && box.height > 2;
  }, []);
  useRouteInteractive(readyRequestId, onInteractive, isReady);

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
          {warpOn ? (
            <WorksSurfaceWarp
              rootRef={carouselHostRef}
              projects={projects}
              velocityRef={velocityRef}
              dragRef={dragRef}
              glRectsRef={glRectsRef}
              reducedMotion={Boolean(reducedMotion)}
              paused={paused}
            />
          ) : null}
        </WorksCarousel>
      </div>

      <AugeChrome
        socialItems={socialItems}
        onHome={onHome}
        navItems={[
          { id: 'works', label: 'Works', onClick: onOpenWorks },
          { id: 'about', label: 'About', onClick: onOpenAbout },
          { id: 'talk', label: "Let's talk", onClick: onOpenContact },
        ]}
      />
    </div>
  );
}

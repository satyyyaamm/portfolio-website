import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';
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
  onOpenProject,
  onHome,
  onOpenAbout,
  onOpenContact,
  onOpenWorks,
}) {
  const reducedMotion = useReducedMotion();
  const rootRef = useRef(null);
  const carouselHostRef = useRef(null);
  const velocityRef = useRef(0);
  const dragRef = useRef(false);
  const pulseRef = useRef(null);
  const glRectsRef = useRef({ media: [], thumbs: [], fill: null });
  const viewTipOnRef = useRef(false);

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

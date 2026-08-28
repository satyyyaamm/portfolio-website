import { useLayoutEffect, useRef, useState } from 'react';
import { useMotionValueEvent } from 'framer-motion';
import { useScrollProgress } from './scrollProgress.js';
import { SCENE } from '../../lib/scrollTimeline.js';

function phaseFromProgress(v) {
  if (v <= SCENE.intro[1]) return 'hero';
  if (v >= SCENE.contact[0]) return 'contact';
  return 'dock';
}

/**
 * Hero: full icons. Mid-scroll: line (hover expands).
 * Contact: dock hides — icons live in the contact panel.
 */
export function SocialDock({ items = [] }) {
  const { progress, reducedMotion } = useScrollProgress();
  const rootRef = useRef(null);
  const phaseRef = useRef('hero');
  const [hovered, setHovered] = useState(false);

  const sync = (v) => {
    const el = rootRef.current;
    if (!el) return;

    const next = phaseFromProgress(v);
    el.dataset.phase = next;
    if (next !== phaseRef.current) {
      phaseRef.current = next;
      if (next !== 'dock') setHovered(false);
    }
  };

  useLayoutEffect(() => {
    sync(progress.get());
    document.documentElement.style.removeProperty('--social-drop-t');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useMotionValueEvent(progress, 'change', sync);

  const forceOpen = reducedMotion || hovered;

  return (
    <div
      ref={rootRef}
      className={`social-dock${forceOpen ? ' is-hover' : ''}${reducedMotion ? ' is-reduced' : ''}`}
      data-phase="hero"
      onMouseEnter={() => {
        if (phaseRef.current === 'dock') setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => {
        if (phaseRef.current === 'dock') setHovered(true);
      }}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setHovered(false);
      }}
      onClick={() => {
        if (phaseRef.current === 'dock' && !hovered) setHovered(true);
      }}
    >
      <div className="social-dock__shell" role="navigation" aria-label="Social links">
        <div className="social-dock__icons">
          {items.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target={item.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={item.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className="social-icon-btn"
              aria-label={item.label}
            >
              {item.icon}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

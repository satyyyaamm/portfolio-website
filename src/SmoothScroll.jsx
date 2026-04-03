import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenisInstance } from './lib/lenisInstance';

import 'lenis/dist/lenis.css';

/** Fixed navbar clearance — matches ~py-3 nav + border */
const NAV_SCROLL_OFFSET = -64;

export function SmoothScroll({ children }) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.085,
      smoothWheel: true,
      wheelMultiplier: 0.92,
    });
    setLenisInstance(lenis);

    const scrollToHashTarget = (hash) => {
      if (!hash || hash === '#') return;
      const id = hash.startsWith('#') ? hash.slice(1) : hash;
      if (!id || /[/.]/.test(id)) return;
      const el = document.getElementById(id);
      if (!el) return;
      lenis.scrollTo(el, { offset: NAV_SCROLL_OFFSET });
    };

    const onClickCapture = (e) => {
      if (!(e.target instanceof Element)) return;
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      const id = href.slice(1);
      if (!id || /[/.]/.test(id)) return;
      const el = document.getElementById(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: NAV_SCROLL_OFFSET });
      window.history.pushState(null, '', href);
    };

    document.addEventListener('click', onClickCapture, true);

    const onPopState = () => {
      scrollToHashTarget(window.location.hash);
    };
    window.addEventListener('popstate', onPopState);

    requestAnimationFrame(() => {
      scrollToHashTarget(window.location.hash);
    });

    return () => {
      document.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('popstate', onPopState);
      lenis.destroy();
      setLenisInstance(null);
    };
  }, []);

  return children;
}

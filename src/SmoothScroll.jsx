import { useEffect } from 'react';
import Lenis from 'lenis';
import { setLenisInstance } from './lib/lenisInstance';

import 'lenis/dist/lenis.css';

/** Fixed navbar clearance — matches ~py-3 nav + border */
const NAV_SCROLL_OFFSET = -64;

export function SmoothScroll({ children }) {
  /** Full reload without a hash: browsers often restore old scroll (e.g. mid-page). Reset to top. */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
    } catch {
      /* noop */
    }
    const hash = window.location.hash;
    if (hash && hash !== '#') return;

    const goTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };
    goTop();
    requestAnimationFrame(goTop);
    const t0 = window.setTimeout(goTop, 0);
    const t1 = window.setTimeout(goTop, 100);
    return () => {
      window.clearTimeout(t0);
      window.clearTimeout(t1);
    };
  }, []);

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

    const h = window.location.hash;
    if (!h || h === '#') {
      lenis.scrollTo(0, { immediate: true });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToHashTarget(window.location.hash);
      });
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

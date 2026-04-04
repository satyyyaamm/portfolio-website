import { useEffect, useLayoutEffect } from 'react';
import Lenis from 'lenis';
import { setLenisInstance } from './lib/lenisInstance';

import 'lenis/dist/lenis.css';

/** Fixed navbar clearance — matches ~py-3 nav + border */
const NAV_SCROLL_OFFSET = -64;

function forceWindowScrollTop() {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function SmoothScroll({ children }) {
  /**
   * Before paint: disable restoration, drop hash on reload (otherwise #contact persists
   * and the browser + Lenis jump to the form), and pin scroll to top.
   */
  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }
    } catch {
      /* noop */
    }

    const nav = performance.getEntriesByType('navigation')[0];
    if (nav?.type === 'reload' && window.location.hash) {
      history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    }

    forceWindowScrollTop();
  }, []);

  /** Extra resets after layout (restoration / Lenis timing). */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    forceWindowScrollTop();
    requestAnimationFrame(forceWindowScrollTop);
    const t0 = window.setTimeout(forceWindowScrollTop, 0);
    const t1 = window.setTimeout(forceWindowScrollTop, 100);
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
      lenis.scrollTo(0, { immediate: true, force: true });
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollToHashTarget(window.location.hash);
      });
    });

    const onPageshow = (e) => {
      if (!e.persisted) return;
      forceWindowScrollTop();
      lenis.scrollTo(0, { immediate: true, force: true });
    };
    window.addEventListener('pageshow', onPageshow);

    return () => {
      document.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('popstate', onPopState);
      window.removeEventListener('pageshow', onPageshow);
      lenis.destroy();
      setLenisInstance(null);
    };
  }, []);

  return children;
}

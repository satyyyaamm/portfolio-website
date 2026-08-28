import { useEffect, useLayoutEffect } from 'react';
import { setLenisInstance } from './lib/lenisInstance';
import { scrollToSection } from './lib/scrollToSection';

/** Hash → journey navigation. Document scroll drives the card track. */
export function SmoothScroll({ children }) {
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
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setLenisInstance(null);

    const onClickCapture = (e) => {
      if (!(e.target instanceof Element)) return;
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = a.getAttribute('href');
      if (!href || href === '#') return;
      if (scrollToSection(href)) {
        e.preventDefault();
      }
    };

    document.addEventListener('click', onClickCapture, true);

    const onPopState = () => {
      const hash = window.location.hash;
      if (hash) scrollToSection(hash);
    };
    window.addEventListener('popstate', onPopState);

    return () => {
      document.removeEventListener('click', onClickCapture, true);
      window.removeEventListener('popstate', onPopState);
    };
  }, []);

  return children;
}

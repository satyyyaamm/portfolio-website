import { useEffect } from 'react';
import {
  initAnalytics,
  isAnalyticsEnabled,
  trackEvent,
  trackPageView,
} from '../lib/analytics';

/**
 * GA4: acquisition (source / medium / referrer), geography, pages, and outbound clicks.
 * Set VITE_GA_MEASUREMENT_ID in .env.local (e.g. G-XXXXXXXXXX).
 */
export function Analytics() {
  useEffect(() => {
    if (!isAnalyticsEnabled()) return;

    initAnalytics();

    const onNavigate = () => trackPageView();

    window.addEventListener('hashchange', onNavigate);
    window.addEventListener('popstate', onNavigate);

    const onClick = (e) => {
      if (!(e.target instanceof Element)) return;
      const anchor = e.target.closest('a[href]');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return;
      }

      let url;
      try {
        url = new URL(href, window.location.origin);
      } catch {
        return;
      }

      if (url.origin === window.location.origin) return;

      trackEvent('click_outbound', {
        link_url: url.href,
        link_text: (anchor.textContent || anchor.getAttribute('aria-label') || '').trim().slice(0, 80),
      });
    };

    document.addEventListener('click', onClick, true);

    return () => {
      window.removeEventListener('hashchange', onNavigate);
      window.removeEventListener('popstate', onNavigate);
      document.removeEventListener('click', onClick, true);
    };
  }, []);

  return null;
}

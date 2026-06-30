const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim() || 'G-RGB7SXQS6T';

export function isAnalyticsEnabled() {
  return /^G-[A-Z0-9]+$/i.test(GA_ID);
}

function getGtag() {
  if (typeof window === 'undefined') return null;
  return typeof window.gtag === 'function' ? window.gtag : null;
}

/** Load GA4 and disable auto page views — we track SPA/hash navigation manually. */
export function initAnalytics() {
  if (!isAnalyticsEnabled() || typeof window === 'undefined') return;
  if (window.__portfolioAnalyticsInit) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    send_page_view: false,
    anonymize_ip: true,
  });

  window.__portfolioAnalyticsInit = true;
}

export function getAnalyticsPagePath() {
  if (typeof window === 'undefined') return '/';
  const section = window.location.hash.replace(/^#/, '') || 'home';
  return `/${section}`;
}

export function trackPageView(pagePath = getAnalyticsPagePath()) {
  const gtag = getGtag();
  if (!gtag) return;

  gtag('event', 'page_view', {
    page_path: pagePath,
    page_title: document.title,
    page_location: `${window.location.origin}${window.location.pathname}${window.location.hash || '#home'}`,
  });
}

export function trackEvent(eventName, params = {}) {
  const gtag = getGtag();
  if (!gtag) return;
  gtag('event', eventName, params);
}

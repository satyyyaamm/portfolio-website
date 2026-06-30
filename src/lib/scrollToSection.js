/** Fixed navbar clearance — matches nav height + border */
export const NAV_SCROLL_MARGIN = '4.75rem';

/**
 * Scroll to an in-page section by id or hash. Updates the URL hash for sharing / analytics.
 * @param {string} idOrHash — e.g. "work" or "#work"
 */
export function scrollToSection(idOrHash) {
  if (typeof window === 'undefined') return false;

  const hash = idOrHash.startsWith('#') ? idOrHash : `#${idOrHash}`;
  const id = hash.slice(1);
  if (!id || /[/.]/.test(id)) return false;

  const el = document.getElementById(id);
  if (!el) return false;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({
    behavior: reducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });

  if (window.location.hash !== hash) {
    window.history.pushState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  }

  return true;
}

export function handleSectionLinkClick(e, idOrHash) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (scrollToSection(idOrHash)) {
    e.preventDefault();
  }
}

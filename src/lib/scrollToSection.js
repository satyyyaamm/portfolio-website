/** Fixed navbar clearance */
export const NAV_SCROLL_MARGIN = '4.75rem';

/**
 * Navigate to a journey card by id/hash.
 * Dispatches `portfolio:navigate` for the card journey engine.
 */
export function scrollToSection(idOrHash) {
  if (typeof window === 'undefined') return false;

  const hash = idOrHash.startsWith('#') ? idOrHash : `#${idOrHash}`;
  const id = hash.slice(1);
  if (!id || /[/.]/.test(id)) return false;

  const alias = {
    services: 'build',
    faq: 'faq',
    home: 'home',
    work: 'work',
    journey: 'journey',
    build: 'build',
  };
  const targetHash = `#${alias[id] ?? id}`;

  window.dispatchEvent(
    new CustomEvent('portfolio:navigate', {
      detail: { hash: targetHash, id: targetHash.slice(1) },
    })
  );

  return true;
}

export function handleSectionLinkClick(e, idOrHash) {
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  if (scrollToSection(idOrHash)) {
    e.preventDefault();
  }
}

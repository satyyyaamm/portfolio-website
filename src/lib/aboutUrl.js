/** `/about` helpers (History API, no router). */

export function aboutPath() {
  return '/about';
}

export function isAboutPath(pathname = '') {
  return /^\/about\/?$/i.test(String(pathname));
}

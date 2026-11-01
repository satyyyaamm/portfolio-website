/** `/contacts` helpers (History API, no router). */

export function contactPath() {
  return '/contacts';
}

export function isContactPath(pathname = '') {
  return /^\/contacts?\/?$/i.test(String(pathname));
}

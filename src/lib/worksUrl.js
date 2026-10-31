/** `/works/picksy` ↔ project slug helpers (History API, no router). */

export function worksPath(slug) {
  if (!slug) return '/';
  return `/works/${slug}`;
}

export function parseWorksSlug(pathname = '') {
  const match = String(pathname).match(/^\/works\/([^/]+)\/?$/i);
  return match ? decodeURIComponent(match[1]).toLowerCase() : null;
}

export function findProjectIndexBySlug(projects, slug) {
  if (!slug) return -1;
  const key = String(slug).toLowerCase();
  return projects.findIndex((p) => String(p.slug || '').toLowerCase() === key);
}

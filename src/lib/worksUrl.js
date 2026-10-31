/** `/works` index + `/works/picksy` slug helpers (History API, no router). */

export function worksIndexPath() {
  return '/works';
}

export function isWorksIndex(pathname = '') {
  return /^\/works\/?$/i.test(String(pathname));
}

export function worksPath(slug) {
  if (!slug) return worksIndexPath();
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

export function projectCategory(project) {
  if (project?.kind) return String(project.kind);
  if (project?.previewFrame === 'mobile') return 'App';
  return 'Website';
}

export function splitTitleLines(name = '') {
  const raw = String(name).trim();
  if (!raw) return [''];
  if (raw.includes('|')) {
    return raw
      .split('|')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => part.toUpperCase());
  }
  const parts = raw.split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return [raw.toUpperCase()];
  if (parts.length === 2) return [parts[0].toUpperCase(), parts[1].toUpperCase()];
  const mid = Math.ceil(parts.length / 2);
  return [parts.slice(0, mid).join(' ').toUpperCase(), parts.slice(mid).join(' ').toUpperCase()];
}

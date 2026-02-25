import { join, normalize } from 'node:path';

/**
 * Join path parts to a base path, normalizing separators.
 */
export function appendPath(base, ...parts) {
  return normalize(join(base, ...parts));
}

/**
 * Ensure a path ends with a trailing slash.
 */
export function ensureTrailingSlash(p) {
  return p.endsWith('/') ? p : p + '/';
}

/**
 * Remove trailing slash from a path (unless it's the root `/`).
 */
export function stripTrailingSlash(p) {
  if (p === '/') return p;
  return p.endsWith('/') ? p.slice(0, -1) : p;
}

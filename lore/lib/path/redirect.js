/**
 * Create a path redirect mapping.
 */
export function createRedirect(from, to) {
  return { from, to };
}

/**
 * Apply redirects to resolve a path. If the path starts with a redirect's
 * `from` prefix, replace it with the `to` value.
 */
export function resolveRedirect(path, redirects) {
  for (const { from, to } of redirects) {
    if (path === from || path.startsWith(from + '/')) {
      return path.replace(from, to);
    }
  }
  return path;
}

/**
 * Return standard lore path redirects.
 */
export function defaultRedirects() {
  return [
    createRedirect('~skills', 'lore/skills'),
    createRedirect('~commands', 'lore/commands'),
    createRedirect('~agents', 'lore/agents'),
    createRedirect('~lib', 'lore/lib'),
  ];
}

/**
 * Convenience: resolve a path using the default redirects.
 */
export function redirect(path) {
  return resolveRedirect(path, defaultRedirects());
}

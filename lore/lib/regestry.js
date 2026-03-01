const registry = new Map();
const listeners = new Set();

export function onRegistryChange(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifyListeners(event, type, name, data) {
  for (const listener of listeners) {
    try {
      listener({ event, type, name, data });
    } catch {
      // Swallow listener errors to avoid breaking registry operations
    }
  }
}

export function register(type, name, metadata = {}) {
  if (!registry.has(type)) {
    registry.set(type, new Map());
  }
  const entry = { type, name, ...metadata };
  registry.get(type).set(name, entry);
  notifyListeners('register', type, name, entry);
}

export function unregister(type, name) {
  const typeMap = registry.get(type);
  if (typeMap) {
    const entry = typeMap.get(name);
    typeMap.delete(name);
    if (typeMap.size === 0) registry.delete(type);
    notifyListeners('unregister', type, name, entry);
  }
}

export function get(type, name) {
  const typeMap = registry.get(type);
  return typeMap ? typeMap.get(name) ?? null : null;
}

export function list(type) {
  const typeMap = registry.get(type);
  return typeMap ? Array.from(typeMap.values()) : [];
}

export function listAll() {
  const result = {};
  for (const [type, typeMap] of registry) {
    result[type] = Array.from(typeMap.values());
  }
  return result;
}

export function clear() {
  registry.clear();
  notifyListeners('clear', null, null, null);
}

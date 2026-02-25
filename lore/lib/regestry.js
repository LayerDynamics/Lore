const registry = new Map();

export function register(type, name, metadata = {}) {
  if (!registry.has(type)) {
    registry.set(type, new Map());
  }
  registry.get(type).set(name, { type, name, ...metadata });
}

export function unregister(type, name) {
  const typeMap = registry.get(type);
  if (typeMap) {
    typeMap.delete(name);
    if (typeMap.size === 0) registry.delete(type);
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
}

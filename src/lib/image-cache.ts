/**
 * In-memory cache of successfully loaded image URLs.
 * Survives across React component mounts/unmounts within the same SPA session.
 * Used by OptimizedImage to skip the skeleton for already-seen images.
 */
const loaded = new Set<string>();

export const imageCache = {
  has: (src: string) => loaded.has(src),
  add: (src: string) => { loaded.add(src); },
};

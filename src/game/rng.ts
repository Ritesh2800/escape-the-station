/**
 * Seeded PRNG (mulberry32) for reproducible game rounds
 */
export function createRNG(seed: number) {
  let s = seed >>> 0;
  return function rng(): number {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomChoice<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function shuffleArray<T>(rng: () => number, array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function getUrlParams(): { game?: string; era?: string; seed?: number } {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const game = params.get('game') || undefined;
  const era = params.get('era') || undefined;
  const seedStr = params.get('seed');
  const seed = seedStr ? parseInt(seedStr, 10) : undefined;
  return { game, era, seed };
}

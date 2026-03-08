export function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createRng(seed: number) {
  const rng = mulberry32(seed);
  return {
    next: rng,
    int: (min: number, max: number) => Math.floor(rng() * (max - min + 1)) + min,
    pick: <T>(arr: T[]): T => arr[Math.floor(rng() * arr.length)],
    chance: (pct: number) => rng() * 100 < pct,
  };
}
// Small, pure math helpers. Everything in this project is a function of time,
// so every frame can be rendered on its own and always looks the same.

export type Vec = { x: number; y: number };

export const TAU = Math.PI * 2;

export const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mix = (a: Vec, b: Vec, t: number): Vec => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

/** 0→1 progress of t inside [a, b], clamped. */
export const progress = (t: number, a: number, b: number) => clamp((t - a) / (b - a));

export const smooth = (x: number) => x * x * (3 - 2 * x);
export const inOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const inCubic = (x: number) => x * x * x;
export const outCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const outExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
export const inQuad = (x: number) => x * x;
export const outBack = (x: number, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);

export type Ease = (x: number) => number;

export type Key<T> = { t: number; v: T; ease?: Ease };

/** Piecewise interpolation through keys; `ease` on a key shapes the segment that ends at it. */
export const keyed = (keys: Key<number>[], t: number): number => {
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t <= k.t) {
      const p = keys[i - 1];
      const e = (k.ease ?? inOutCubic)((t - p.t) / (k.t - p.t));
      return lerp(p.v, k.v, e);
    }
  }
  return keys[keys.length - 1].v;
};

export const keyedVec = (keys: Key<Vec>[], t: number): Vec => {
  if (t <= keys[0].t) return keys[0].v;
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (t <= k.t) {
      const p = keys[i - 1];
      return mix(p.v, k.v, (k.ease ?? inOutCubic)((t - p.t) / (k.t - p.t)));
    }
  }
  return keys[keys.length - 1].v;
};

/** Closed-form damped oscillation; t in seconds since the trigger. */
export const dampedSettle = (t: number, freq: number, damping: number) =>
  t <= 0 ? 0 : Math.exp(-damping * t) * Math.sin(TAU * freq * t);

/** Signed shortest angular distance a - b, in (-π, π]. */
export const angDist = (a: number, b: number) => {
  let d = (a - b) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d <= -Math.PI) d += TAU;
  return d;
};

export const rotate = (p: Vec, a: number): Vec => {
  const c = Math.cos(a);
  const s = Math.sin(a);
  return { x: p.x * c - p.y * s, y: p.x * s + p.y * c };
};

/** Deterministic hash → [0, 1). Integer arithmetic only. */
export const hash01 = (n: number) => {
  let a = (n | 0) + 0x6d2b79f5;
  a = Math.imul(a ^ (a >>> 15), 1 | a);
  a = (a + Math.imul(a ^ (a >>> 7), 61 | a)) ^ a;
  return ((a ^ (a >>> 14)) >>> 0) / 4294967296;
};

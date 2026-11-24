// Splines and seeded noise. The whole piece is authored in "reference units":
// the 941 px wide frame of the approved stills. The SVG viewBox scales it up.

import { type Vec, clamp, hash01, mix, TAU } from "./math";

export const W = 941;
export const H = 1672.9; // 9:16
export const PX = W / 1080; // one output pixel in reference units

export const v = (x: number, y: number): Vec => ({ x, y });

/** Uniform Catmull-Rom through the points at t in [0, 1]. Morph-safe: t is the point index, not length. */
export const spline = (p: Vec[], t: number): Vec => {
  const n = p.length - 1;
  const f = clamp(t) * n;
  const i = Math.min(n - 1, Math.floor(f));
  const u = f - i;
  const a = p[Math.max(0, i - 1)];
  const b = p[i];
  const c = p[i + 1];
  const d = p[Math.min(n, i + 2)];
  const cr = (k: "x" | "y") =>
    0.5 *
    (2 * b[k] +
      (c[k] - a[k]) * u +
      (2 * a[k] - 5 * b[k] + 4 * c[k] - d[k]) * u * u +
      (3 * b[k] - a[k] - 3 * c[k] + d[k]) * u * u * u);
  return { x: cr("x"), y: cr("y") };
};

export const sample = (p: Vec[], count: number): Vec[] =>
  Array.from({ length: count }, (_, i) => spline(p, i / (count - 1)));

/** Gaussian smoothing along a line; the ends stay where they are. */
export const soften = (p: Vec[], sigma: number): Vec[] => {
  const n = p.length - 1;
  return p.map((_, i) => {
    const s = Math.min(sigma, i / 3, (n - i) / 3);
    if (s < 0.2) return p[i];
    const R = Math.floor(s * 3);
    let x = 0;
    let y = 0;
    let w = 0;
    for (let d = -R; d <= R; d++) {
      const g = Math.exp(-(d * d) / (2 * s * s));
      x += g * p[i + d].x;
      y += g * p[i + d].y;
      w += g;
    }
    return { x: x / w, y: y / w };
  });
};

/** Evenly spaced resampling by arc length. */
export const even = (p: Vec[], count: number): Vec[] => {
  const acc = [0];
  for (let i = 1; i < p.length; i++)
    acc.push(acc[i - 1] + Math.hypot(p[i].x - p[i - 1].x, p[i].y - p[i - 1].y));
  const total = acc[acc.length - 1];
  let j = 0;
  return Array.from({ length: count }, (_, i) => {
    const s = (i / (count - 1)) * total;
    while (j < p.length - 2 && acc[j + 1] < s) j++;
    const len = acc[j + 1] - acc[j] || 1;
    return mix(p[j], p[j + 1], clamp((s - acc[j]) / len));
  });
};

export const mixPts = (a: Vec[], b: Vec[], t: number): Vec[] =>
  a.map((p, i) => mix(p, b[i], t));

/** Smooth 1-D noise in about [-1, 1]: three seeded sines, so it animates by moving x. */
export const wobble = (x: number, seed: number) => {
  let s = 0;
  for (let i = 0; i < 3; i++) {
    const f = (0.5 + 0.42 * i) * (0.8 + 0.4 * hash01(seed * 7 + i));
    s += Math.sin(TAU * (f * x + hash01(seed * 13 + i + 101))) / (1 + i * 0.7);
  }
  return s / 2.02;
};

export const toPath = (p: Vec[]) =>
  p
    .map((q, i) => `${i ? "L" : "M"}${q.x.toFixed(2)} ${q.y.toFixed(2)}`)
    .join("");

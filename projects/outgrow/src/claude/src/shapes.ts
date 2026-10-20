// Shared outlines for the soul and its tail, used in world and screen space.

import { type Vec, TAU } from "./math";

const f1 = (n: number) => n.toFixed(1);

/**
 * Soul outline in local space (x along the heading). A round body that
 * sharpens into a teardrop seed: blunt end leading, point trailing.
 */
export const soulShape = (rx: number, ry: number, seed: number) => {
  const n = 48;
  let d = "";
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * TAU;
    // pinch the trailing side into a point as the soul becomes a seed
    const back = Math.max(0, -Math.cos(a));
    const pinch = 1 - seed * 0.75 * Math.pow(back, 1.6);
    const x = Math.cos(a) * rx * (1 + seed * 0.25 * back);
    const y = Math.sin(a) * ry * pinch;
    d += `${k ? "L" : "M"}${f1(x)} ${f1(y)}`;
  }
  return d + "Z";
};

/** Filled tail polygon: full width at the soul, tapering to nothing. */
export const taperedPolygon = (pts: Vec[], width: number) => {
  if (pts.length < 3) return null;
  const left: Vec[] = [];
  const right: Vec[] = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[Math.max(0, k - 1)];
    const b = pts[Math.min(pts.length - 1, k + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const w = width * Math.pow(1 - k / (pts.length - 1), 1.4);
    left.push({ x: pts[k].x - (dy / len) * w, y: pts[k].y + (dx / len) * w });
    right.push({ x: pts[k].x + (dy / len) * w, y: pts[k].y - (dx / len) * w });
  }
  const ring = [...left, ...right.reverse()];
  return ring.map((p, j) => `${j ? "L" : "M"}${f1(p.x)} ${f1(p.y)}`).join("") + "Z";
};

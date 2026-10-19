// The white shell: a fixed set of closed curves that never break and never get
// replaced. Every curve is sampled at the same parameter θ in every shape, so
// morphing is a per-point blend and the same lines travel from rings to wings.

import {
  type Vec,
  TAU,
  angDist,
  clamp,
  dampedSettle,
  lerp,
  progress,
  rotate,
  smooth,
} from "./math";
import {
  IMPACTS,
  WAVES,
  type ShapeId,
  breakthroughFlood,
  pushWeight,
  shapeBlend,
  soulPos,
} from "./timeline";

export const LINE_COUNT = 24;
export const SAMPLES = 540;

/** Ring radius of line i in the opening circle. */
const ringRadius = (u: number) => 150 + 340 * u;

/** Smooth petal bump: 1 on the petal axis, 0 at ±width. */
const petal = (theta: number, axis: number, width: number, power: number) => {
  const d = Math.abs(angDist(theta, axis));
  return d >= width ? 0 : Math.pow(Math.cos((Math.PI / 2) * (d / width)), power);
};

/** Swirl that rotates inner points more than outer ones. */
const vortex = (p: Vec, strength: number, reach: number): Vec => {
  const d = Math.hypot(p.x, p.y);
  return rotate(p, strength * Math.max(0, 1 - d / reach));
};

const polar = (r: number, theta: number): Vec => ({ x: r * Math.cos(theta), y: r * Math.sin(theta) });

/** Base position of line u at parameter θ for a given shape. */
const shapePoint = (shape: ShapeId, u: number, theta: number, t: number): Vec => {
  const R = ringRadius(u);
  // a hair of separation at pinch points so lines meet as a dense knot, not one dot
  const eps = 0.035 + 0.05 * u;

  switch (shape) {
    case "circle":
      return polar(R, theta);

    case "oval": {
      const p = polar(R, theta);
      const up = Math.max(0, -Math.sin(theta)); // the soul pushed upward: the top gives more
      return { x: p.x * 0.8, y: p.y * (1.26 + 0.16 * up) };
    }

    case "eight": {
      const f = Math.pow(Math.abs(Math.sin(theta)), 0.8);
      const p = polar(R * 1.28 * (eps + (1 - eps) * f), theta);
      const q = { x: p.x * 1.02, y: p.y * 1.12 };
      // asymmetric twist: upper and lower lobes lean opposite ways; it straightens
      // out before the breakthrough so the eight opens cleanly into wings
      const twist = 0.42 * (1 - smooth(progress(t, 7.5, 8.3)));
      return rotate(q, twist * Math.tanh(q.y / 260));
    }

    case "spiral": {
      const f = Math.pow(Math.abs(Math.sin(theta)), 0.8);
      const p = polar(R * 1.3 * (eps + (1 - eps) * f), theta);
      const spin = 0.9 * (t - 5.75);
      return vortex(rotate({ x: p.x * 1.05, y: p.y * 1.05 }, spin), 2.6, 900);
    }

    case "rosette": {
      const spin = 0.55 * (t - 6.45);
      const f = Math.pow(Math.abs(Math.cos(2.5 * (theta - spin))), 0.9);
      const p = polar(R * 1.42 * (eps + (1 - eps) * f), theta);
      return vortex(p, -0.9, 1100);
    }

    case "wings": {
      // two upper wings and two lower lobes, all meeting at the central node
      // petals never overlap: a narrow channel stays open above and below the node
      const up = Math.PI / 2;
      const f =
        petal(theta, -up - 0.44, 0.42, 0.7) +
        petal(theta, -up + 0.44, 0.42, 0.7) +
        0.8 * petal(theta, up + 0.47, 0.46, 0.75) +
        0.8 * petal(theta, up - 0.47, 0.46, 0.75);
      const Rw = 140 + 1500 * Math.pow(u, 1.1);
      const p = polar(Rw * (0.006 + 0.032 * u + f), theta);
      // fan the wings open toward their tips, round the lower lobes outward
      const d = Math.hypot(p.x, p.y);
      const k = Math.pow(d / 1640, 1.5);
      // a slow wingbeat: tips move most, the node stays put
      const flap = 1 + 0.035 * k * Math.sin(TAU * 0.45 * (t - 10.4));
      const y = p.y * (1.05 - 0.12 * k);
      // pull the node apart vertically: the lines run side by side through a narrow waist
      return { x: p.x * (1 + (p.y < 0 ? 0.85 : 0.7) * k) * flap, y: (y + 120 * Math.tanh(y / 28)) * (2 - flap) };
    }
  }
};

export type LinePoint = Vec & { orange: number };

/** Signed radial push of the rings by the soul's body. */
const pushFrom = (p: Vec, soul: Vec, i: number, weight: number) => {
  if (weight <= 0) return { p, contact: 0 };
  const rho = Math.hypot(p.x, p.y);
  const theta = Math.atan2(p.y, p.x);
  const rs = Math.hypot(soul.x, soul.y);
  if (rs < 1) return { p, contact: 0 };
  const psi = Math.atan2(soul.y, soul.x);
  const k = Math.exp(-Math.pow(angDist(theta, psi) / 0.42, 2));
  // rings stack and compress: line i can be pushed only as far as soul + gap
  const target = rs + 26 + 8 * i;
  const over = Math.max(0, target - rho);
  const d = over * k * weight;
  if (d <= 0) return { p, contact: 0 };
  const scale = (rho + d) / Math.max(rho, 1e-3);
  return { p: { x: p.x * scale, y: p.y * scale }, contact: clamp((d / 22) * k) };
};

export const buildLine = (i: number, t: number): LinePoint[] => {
  const u = (i + 1) / LINE_COUNT;
  const { from, to, b } = shapeBlend(t);
  const soul = soulPos(t);
  const pw = pushWeight(t);
  const flood = breakthroughFlood(t);
  const breathe = 1 + 0.012 * Math.sin(TAU * 0.55 * t + u * 2.4);
  const pts: LinePoint[] = [];

  for (let s = 0; s < SAMPLES; s++) {
    const theta = (s / SAMPLES) * TAU;
    const a = shapePoint(from, u, theta, t);
    let p = b > 0 ? lerpVec(a, shapePoint(to, u, theta, t), b) : a;
    p = { x: p.x * breathe, y: p.y * breathe };

    // the soul's body pressing into the rings, flashing orange at the contact
    const pushed = pushFrom(p, soul, i, pw);
    p = pushed.p;
    let orange = pushed.contact;

    const rho = Math.hypot(p.x, p.y);
    const ang = Math.atan2(p.y, p.x);

    // impact resonance: each ring rings like a membrane, outer rings a beat later
    for (const imp of IMPACTS) {
      const dt = t - imp.t - i * 0.011;
      if (dt <= 0 || dt > 1.6) continue;
      const kAng = Math.exp(-Math.pow(angDist(ang, imp.angle) / 0.95, 2));
      const ring = imp.strength * 26 * dampedSettle(dt, 2.6, 4.2) * kAng * (1 - 0.45 * u);
      const sc = (rho + ring) / Math.max(rho, 1e-3);
      p = { x: p.x * sc, y: p.y * sc };
      // orange travels along the ring away from the contact, both ways
      const travel = 3.4 * dt;
      const along = Math.max(
        Math.exp(-Math.pow(angDist(ang, imp.angle + travel) / 0.28, 2)),
        Math.exp(-Math.pow(angDist(ang, imp.angle - travel) / 0.28, 2)),
      );
      orange = Math.max(orange, along * Math.exp(-dt * 2.4) * (1 - 0.6 * u) * imp.strength);
    }

    // sound waves rolling outward from the soul, tinting the lines they cross
    for (const w of WAVES) {
      const dt = t - w.t;
      if (dt <= 0 || dt > 2.2) continue;
      const dx = p.x - w.origin.x;
      const dy = p.y - w.origin.y;
      const dist = Math.hypot(dx, dy) || 1;
      const front = w.speed * dt;
      const env = Math.exp(-Math.pow((dist - front) / 85, 2)) * Math.exp(-dt * 1.3);
      const disp = w.amp * env;
      p = { x: p.x + (dx / dist) * disp, y: p.y + (dy / dist) * disp };
      orange = Math.max(orange, env * w.tint);
    }

    // breakthrough: orange floods outward from the node and drains back to white
    if (flood > 0) {
      const front = (1 - flood) * 2200;
      orange = Math.max(orange, flood * smooth(clamp(1 - Math.abs(Math.hypot(p.x, p.y) - front) / 900)));
    }

    pts.push({ x: p.x, y: p.y, orange: clamp(orange) });
  }
  return pts;
};

const lerpVec = (a: Vec, b: Vec, t: number): Vec => ({ x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) });

/** Opacity of the line set: lines arrive from the centre in the first frames. */
export const lineOpacity = (i: number, t: number) => {
  const u = (i + 1) / LINE_COUNT;
  return 0.35 + 0.65 * smooth(progress(t, u * 0.25, u * 0.25 + 0.3));
};

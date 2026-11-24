// The topographic waves around the house. Each line is the house's silhouette
// pushed outward by a running sum of uneven gaps, so lines bunch and open but
// never enter the room. Polar around the middle of the floor.

import { type Vec, clamp, hash01, lerp, smooth, TAU } from "./math";
import { spline, v, wobble } from "./curves";
import { FLOOR, type House, type Ripple, groundY, silhouette } from "./house";

export type WaveState = {
  amount: number; // 0..1
  bounce: number; // vertical lobes (spring)
  swirl: number; // clockwise sweep (wheel)
  below: number; // strata under the ground line
  phase: number;
  guest: { x: number; y: number; rx: number; ry: number };
};

export type WaveLine = { pts: Vec[]; alpha: number[] };

const C = v(390, FLOOR);
const S = 260;
const COUNT = 12;

const gauss = (a: number[], sigma: number) => {
  const R = Math.ceil(sigma * 3);
  return a.map((_, i) => {
    let s = 0;
    let w = 0;
    for (let d = -R; d <= R; d++) {
      const g = Math.exp(-(d * d) / (2 * sigma * sigma));
      s += g * a[clamp(i + d, 0, a.length - 1)];
      w += g;
    }
    return s / w;
  });
};

const cast = (poly: Vec[], dx: number, dy: number) => {
  let best = 0;
  for (let i = 1; i < poly.length; i++) {
    const a = poly[i - 1];
    const b = poly[i];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const det = dx * -ey + ex * dy;
    if (Math.abs(det) < 1e-6) continue;
    const ax = a.x - C.x;
    const ay = a.y - C.y;
    const t = (ax * -ey + ex * ay) / det;
    const u = (dx * ay - dy * ax) / det;
    if (t > 0 && u >= 0 && u <= 1) best = Math.max(best, t);
  }
  return best;
};

export const waves = (h: House, w: WaveState, ripple: Ripple): WaveLine[] => {
  if (w.amount <= 0) return [];
  const dirs = Array.from({ length: S + 1 }, (_, i) => {
    const a = Math.PI * (i / S);
    return v(-Math.cos(a), -Math.sin(a));
  });
  const sil = silhouette(h);
  sil.unshift(v(sil[0].x, FLOOR + 30));
  sil.push(v(sil[sil.length - 1].x, FLOOR + 30));
  const g = w.guest;
  const blob = Array.from({ length: 41 }, (_, i) =>
    v(
      g.x + Math.cos((i / 40) * TAU) * g.rx,
      g.y + Math.sin((i / 40) * TAU) * g.ry,
    ),
  );
  const rHouse = dirs.map((d) => cast(sil, d.x, d.y));
  const rGuest = dirs.map((d, i) => Math.max(rHouse[i], cast(blob, d.x, d.y)));

  const out: WaveLine[] = [];
  let acc = new Array(S + 1).fill(0);
  for (let k = 0; k < COUNT; k++) {
    const around = k >= 5;
    const base = around ? rGuest : rHouse;
    const wide = gauss(base, 3 + k * 0.9);
    let r0 = gauss(
      base.map((r, i) => Math.max(r, wide[i])),
      4 + (around ? 5 : 0) + k * 0.3,
    );
    const lack = gauss(
      r0.map((r, i) => Math.max(0, rHouse[i] + 6 - r)),
      6,
    );
    r0 = r0.map((r, i) => Math.max(r + lack[i] * 2.1, rHouse[i] + 3));
    acc = acc.map((a: number, i: number) => {
      const s = i / S;
      const gap =
        1.5 +
        (21 + k * 1.7) *
          Math.pow(
            0.5 +
              0.5 *
                wobble(
                  s * 4.2 + k * 0.17 + w.phase * 0.1,
                  30 + Math.floor(k / 4),
                ),
            2,
          ) +
        4 * hash01(k + 5);
      const sweep = lerp(1, 0.3 + 1.2 * smooth(s), w.swirl);
      return a + gap * sweep;
    });
    const spread = k / (COUNT - 1);
    const s0 = lerp(-0.02, 0.02 + 0.2 * hash01(k + 60), w.swirl);
    const s1 =
      lerp(1.02, 0.97 - 0.2 * hash01(k + 61) * (around ? 1 : 0), w.swirl) -
      (around ? 0 : lerp(0.16, 0.14, w.swirl) - 0.02 * k);
    const pts: Vec[] = [];
    const alpha: number[] = [];
    for (let i = 0; i <= S; i++) {
      const s = i / S;
      const d = dirs[i];
      const anis = lerp(d.x > 0 ? 0.1 : 0.27, 1, Math.pow(Math.abs(d.y), 1.1));
      const lobe =
        w.bounce *
          (62 *
            (0.12 + spread) *
            Math.pow(
              0.5 +
                0.5 * Math.sin(TAU * (4.1 * s + 0.33) + spread * 1.7 + w.phase),
              1.3,
            ) +
            24 *
              (0.15 + spread) *
              (0.5 + 0.5 * wobble(s * 4 + 0.05 * k, 300 + (k % 4)))) +
        w.swirl *
          (66 *
            (0.06 + spread) *
            Math.pow(
              0.5 + 0.5 * Math.sin(TAU * (3.4 * s - 0.55 * spread) + w.phase),
              1.2,
            ) +
            26 * spread * (0.5 + 0.5 * wobble(s * 3, 310 + (k % 3))));
      const r = r0[i] + (acc[i] * 0.78 + lobe * 0.85) * anis;
      let x = C.x + d.x * r;
      let y = C.y + d.y * r;
      // feet run out along the ground instead of stopping dead
      const foot = clamp((y - (FLOOR - 70)) / 70);
      x += Math.sign(d.x) * foot * foot * (10 + 26 * spread);
      y = Math.min(y, groundY(x, ripple) - 4 - 2 * hash01(k + 9));
      pts.push(v(x, y));
      const ends =
        smooth(clamp((s - s0) / 0.12)) * smooth(clamp((s1 - s) / 0.12));
      const breath = 0.72 + 0.28 * wobble(s * 2 + k * 0.37, 90 + k);
      const tone =
        lerp(1.25, 0.24, Math.pow(spread, 0.8)) *
        (0.62 + 0.38 * hash01(k * 3 + 8));
      alpha.push(w.amount * tone * breath * ends);
    }
    out.push({ pts, alpha });
  }

  const strata = 7;
  let depth = 0;
  for (let k = 0; k < strata && w.below > 0; k++) {
    depth += 7 + k * 5 + 10 * hash01(k + 130);
    const pts: Vec[] = [];
    const alpha: number[] = [];
    const a = 30 - 14 * hash01(k + 3) + k * 6;
    const b = 915 - k * 8 * hash01(k + 4);
    for (let i = 0; i <= 160; i++) {
      const t = i / 160;
      const x = lerp(a, b, t);
      const swell =
        (8 + k * 4) *
          Math.sin((x / 330) * Math.PI * 1.45 + 2.6 + k * 0.13 + w.phase) +
        (4 + 2 * k) * wobble(t * 1.8 + k * 0.1, 140);
      const env = Math.sin(Math.PI * t);
      pts.push(
        v(
          x,
          groundY(x, ripple) +
            depth *
              (0.35 + 0.65 * env) *
              (0.8 + 0.3 * wobble(t * 1.5 + k * 0.21, 150)) +
            Math.max(-depth * 0.55, swell * env),
        ),
      );
      alpha.push(
        w.amount *
          w.below *
          lerp(0.7, 0.14, k / (strata - 1)) *
          smooth(clamp(t / 0.16)) *
          smooth(clamp((1 - t) / 0.16)),
      );
    }
    out.push({ pts, alpha });
  }
  return out;
};

/** Knock ripples: uneven, broken arcs from the touch point, outside only. */
export const knock = (at: Vec, age: number): WaveLine[] =>
  Array.from({ length: 4 }, (_, k) => {
    const pts: Vec[] = [];
    const alpha: number[] = [];
    const r = (24 + k * 17 + 9 * k * hash01(k + 210)) * age;
    const from = -1.45 + 0.4 * hash01(k + 220);
    const to = 1.4 - 0.5 * hash01(k + 230);
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const a = lerp(from, to, t);
      const rr = r * (1 + 0.13 * wobble(t * 0.9 + k * 0.4, 240 + k));
      const x = at.x + 1 + Math.cos(a) * rr * 0.8;
      pts.push(v(Math.max(at.x + 2.5, x), at.y + Math.sin(a) * rr * 1.12));
      alpha.push(
        (0.75 - k * 0.17) *
          smooth(clamp(t / 0.25)) *
          smooth(clamp((1 - t) / 0.3)),
      );
    }
    return { pts, alpha };
  });

// Drawn by hand, from the tangle's torn loops to the wall they break against.
const SURF: Vec[][] = [
  [
    v(862, 1008),
    v(898, 955),
    v(900, 880),
    v(872, 806),
    v(815, 764),
    v(760, 728),
    v(690, 700),
    v(622, 714),
    v(562, 744),
    v(508, 768),
    v(467, 768),
  ],
  [
    v(850, 1006),
    v(880, 950),
    v(880, 888),
    v(848, 836),
    v(795, 812),
    v(735, 772),
    v(668, 742),
    v(612, 760),
    v(574, 794),
    v(538, 806),
    v(506, 800),
    v(489, 785),
  ],
  [
    v(838, 1004),
    v(860, 955),
    v(858, 908),
    v(826, 868),
    v(778, 846),
    v(715, 810),
    v(650, 788),
    v(606, 806),
    v(584, 838),
    v(560, 848),
    v(540, 838),
  ],
  [
    v(822, 1004),
    v(842, 965),
    v(838, 926),
    v(806, 896),
    v(760, 878),
    v(708, 864),
    v(656, 874),
    v(633, 898),
    v(625, 926),
  ],
  [
    v(806, 1004),
    v(822, 975),
    v(812, 942),
    v(776, 920),
    v(735, 900),
    v(695, 886),
    v(665, 898),
    v(652, 924),
    v(650, 952),
  ],
  [
    v(790, 1006),
    v(800, 982),
    v(785, 957),
    v(750, 946),
    v(715, 930),
    v(691, 932),
    v(678, 958),
    v(681, 990),
    v(676, 1020),
  ],
  [
    v(774, 1010),
    v(778, 990),
    v(758, 975),
    v(728, 966),
    v(704, 972),
    v(693, 998),
    v(688, 1028),
    v(676, 1056),
  ],
  [
    v(755, 1020),
    v(750, 1005),
    v(732, 997),
    v(713, 1006),
    v(701, 1034),
    v(689, 1064),
    v(675, 1088),
  ],
];
const SPRAY: Vec[] = [
  v(880, 1018),
  v(910, 985),
  v(912, 930),
  v(897, 880),
  v(903, 830),
  v(916, 796),
];

/**
 * Surf: the tangle sends waves, the calm house stops them. Each line breaks off
 * against the right roof slope or the door; nothing passes left of that wall.
 */
export const surf = (amount: number): WaveLine[] => {
  const wallX = (y: number) =>
    y >= 974 ? 666 : lerp(448, 666, clamp((y - 754) / (974 - 754)));
  const N = 160;
  const out: WaveLine[] = SURF.map((ctrl, k) => {
    const tone = lerp(0.8, 1, hash01(k + 540)) * lerp(0.85, 1, clamp(k / 3));
    const pts: Vec[] = [];
    const alpha: number[] = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const p = spline(ctrl, t);
      p.x = Math.max(p.x, wallX(p.y) + 5);
      pts.push(p);
      alpha.push(
        amount *
          tone *
          lerp(0.5, 1, smooth(clamp((t - 0.1) / 0.6))) *
          smooth(clamp(t / 0.12)) *
          smooth(clamp((1 - t) / 0.06)),
      );
    }
    return { pts, alpha };
  });
  const pts = Array.from({ length: 101 }, (_, i) => spline(SPRAY, i / 100));
  out.push({
    pts,
    alpha: pts.map(
      (_, i) => amount * 0.55 * smooth(clamp(i / 12)) * (1 - i / 100),
    ),
  });
  return out;
};

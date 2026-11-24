// The soul's body: one family of lines, in every gesture the film needs.
// Each gesture is a function (line, u) -> point with u = 0 at the left root,
// so gestures blend point by point.

import { type Vec, hash01, lerp, mix } from "./math";
import { mixPts, sample as raw, soften, spline, v, wobble } from "./curves";

const sample = (p: Vec[], n: number) => soften(raw(p, n), 3.2);

export const LINES = 13;
export const POINTS = 110;

// uneven spacing between the upper and lower guide curves
const SPREAD: number[] = (() => {
  const g = Array.from(
    { length: LINES },
    (_, i) => 0.35 + hash01(i + 77) * 1.3,
  );
  const acc = [0];
  for (let i = 1; i < LINES; i++) acc.push(acc[i - 1] + g[i]);
  return acc.map((a) => a / acc[LINES - 1]);
})();

export type Gesture = { pts: Vec[][]; fadeIn: number; fadeOut: number };

const between = (
  top: Vec[],
  bottom: Vec[],
  drift: number,
  clampY = 1370,
): Vec[][] =>
  SPREAD.map((s, k) =>
    Array.from({ length: POINTS }, (_, i) => {
      const u = i / (POINTS - 1);
      // lines change rank slightly along the way, so they bunch and cross like water
      const env = Math.sin(Math.PI * u);
      const rank =
        s +
        0.13 * drift * env * wobble(u * 1.3 + k * 0.11, 9) +
        0.05 * drift * env * wobble(u * 1.1, 50 + k);
      const p = mix(spline(top, u), spline(bottom, u), rank);
      p.y += drift * 4 * env * wobble(u * 1.6 + 0.05 * k, 17);
      return { x: p.x, y: Math.min(p.y, clampY) };
    }),
  );

/** Frame 1: a wave bed. */
export const bed = (): Gesture => ({
  pts: between(
    [
      v(162, 1300),
      v(205, 1277),
      v(250, 1277),
      v(290, 1285),
      v(335, 1270),
      v(378, 1262),
      v(425, 1276),
      v(470, 1304),
      v(515, 1322),
      v(560, 1314),
      v(614, 1296),
    ],
    [
      v(162, 1369),
      v(215, 1369),
      v(262, 1362),
      v(315, 1340),
      v(360, 1330),
      v(405, 1337),
      v(450, 1352),
      v(495, 1362),
      v(530, 1368),
      v(570, 1369),
      v(614, 1369),
    ],
    1,
  ),
  fadeIn: 0.1,
  fadeOut: 0.22,
});

/** Frame 6: the body lies flat and calm; `lines` from `from` on are free to form an arm. */
export const flat = (x: number): Gesture => ({
  pts: between(
    [
      v(166, 1340),
      v(220, 1330),
      v(x - 30, 1311),
      v(x + 20, 1308),
      v(x + 80, 1322),
      v(460, 1338),
      v(540, 1346),
      v(606, 1350),
    ],
    [
      v(166, 1369),
      v(230, 1369),
      v(x - 20, 1368),
      v(x + 40, 1368),
      v(x + 110, 1368),
      v(470, 1369),
      v(540, 1369),
      v(606, 1369),
    ],
    0.45,
  ),
  fadeIn: 0.12,
  fadeOut: 0.25,
});

// Finger offsets from the ring centre; the hand closes over the ring from the left.
const FINGERS: Vec[][] = [
  [v(-34, -24), v(-18, -25), v(-4, -17), v(1, -8)],
  [v(-32, -21), v(-20, -18), v(-8, -10), v(-5, -2)],
  [v(-31, -18), v(-22, -11), v(-13, -4), v(-11, 4)],
  [v(-32, -14), v(-26, -4), v(-19, 5), v(-10, 8)],
];

const fingersTo = (ring: Vec, rot: number, scale: number, k: number): Vec[] => {
  const f = FINGERS[Math.min(3, Math.floor((k / LINES) * 4))];
  const j = (hash01(k + 900) - 0.5) * 3;
  return f.map((o, i) => {
    const s = scale;
    const ox = o.x * s + (i < 2 ? j : j * 0.4);
    const oy = o.y * s + (i < 2 ? j * 0.8 : j * 0.4);
    return {
      x: ring.x + ox * Math.cos(rot) - oy * Math.sin(rot),
      y: ring.y + ox * Math.sin(rot) + oy * Math.cos(rot),
    };
  });
};

/** Frames 2 and 5: the body flows into an arm along the floor, with a hand on the key's ring. */
export const arm = (soul: Vec, ring: Vec): Gesture => ({
  pts: SPREAD.map((s, k) => {
    const x = soul.x;
    const top = [
      v(x - 125, 1342),
      v(x - 92, 1316),
      v(x - 50, 1297),
      v(x, 1293),
      v(x + 44, 1303),
      v(x + 88, 1326),
    ];
    const bot = [
      v(x - 135, 1369),
      v(x - 85, 1369),
      v(x - 38, 1362),
      v(x + 12, 1352),
      v(x + 60, 1351),
      v(x + 100, 1356),
    ];
    const wx = ring.x - 34;
    const mid = lerp(x + 100, wx, 0.5);
    const arch = Math.min(1, (wx - x - 100) / 60);
    const ctrl = [
      ...top.map((p, i) => mix(p, bot[i], s)),
      v(mid - 14, lerp(1344, 1357, s) + 2 * arch),
      v(lerp(mid, wx, 0.45), lerp(1342, 1353, s)),
      v(wx - 18, ring.y + lerp(-28, -14, s)),
      ...fingersTo(ring, 0, 1, k),
    ];
    return sample(ctrl, POINTS).map((p, i) => ({
      x: p.x,
      y: Math.min(1370, p.y + 1.5 * wobble((i / POINTS) * 2, 70 + k)),
    }));
  }),
  fadeIn: 0.16,
  fadeOut: 0,
});

/** Frame 6: upper lines curl back into an arm that holds the key close; the rest lie flat. */
export const curledArm = (soul: Vec, ring: Vec): Gesture => {
  const base = flat(soul.x);
  const armLines = 7;
  base.pts = base.pts.map((line, k) => {
    if (k >= armLines) return line;
    const s = k / (armLines - 1);
    const kk = Math.floor((k / armLines) * LINES);
    const g = fingersTo(ring, 0.1, 0.95, kk).map((p) =>
      v(2 * ring.x - p.x, p.y),
    ); // mirrored: the hand comes back from the right
    const ctrl = [
      line[0],
      line[16],
      line[34],
      v(soul.x + 46, lerp(1318, 1326, s)),
      v(soul.x + 118, lerp(1326, 1337, s)),
      v(soul.x + 186, lerp(1322, 1339, s)),
      v(lerp(soul.x + 226, soul.x + 240, s), lerp(1292, 1294, s)),
      v(lerp(soul.x + 222, soul.x + 238, s), lerp(1254, 1248, s)),
      ...g,
    ];
    return sample(ctrl, POINTS);
  });
  return base;
};

/** Frame 3: a stretched ribbon, rooted in the floor. */
export const ribbon = (soul: Vec, r: number): Gesture => ({
  pts: SPREAD.map((s, k) => {
    const side = s - 0.5;
    const j = (n: number) => hash01(k * 5 + n + 300) - 0.5;
    const rootX =
      side < 0 ? lerp(172, 320, s * 2) : lerp(440, 592, (s - 0.5) * 2);
    const trunk = 372 + side * 34;
    const ctrl = [
      v(rootX, 1346 + j(1) * 36),
      v(lerp(rootX, trunk, 0.25), 1346 + j(2) * 30),
      v(lerp(rootX, trunk, 0.5), 1330 + j(3) * 34),
      v(lerp(rootX, trunk, 0.75), 1292 + j(4) * 26),
      v(lerp(rootX, trunk, 0.93), 1228 + j(5) * 18),
      v(trunk + side * 14 + j(6) * 12, 1150),
      v(356 + side * 44 + j(7) * 8, 1060),
      v(368 + side * 36 + j(8) * 6, 985),
      v(lerp(390, soul.x, 0.5) + side * 18, 930),
      v(soul.x - 1 + side * 8, lerp(930, soul.y + r, 0.62)),
      v(soul.x + side * 3, soul.y + r * 0.8),
    ];
    return sample(ctrl, POINTS).map((p) => ({
      x: p.x,
      y: Math.min(p.y, 1368),
    }));
  }),
  fadeIn: 0.2,
  fadeOut: 0,
});

/** Frame 4: swept behind the soul along the bowl. `bowl` gives the floor. */
export const swept = (soul: Vec, r: number, bowl: Vec[]): Gesture => ({
  pts: SPREAD.map((s, k) => {
    const j = (n: number) => hash01(k * 7 + n + 600) - 0.5;
    const on = (t: number, up: number) => {
      const p = spline(bowl, t);
      return v(p.x, p.y - up);
    };
    const lift = lerp(46, 3, s);
    const root = 0.13 + ((k * 0.618) % 1) * 0.15;
    const ctrl = [
      on(root, 4 + ((k * 0.414) % 1) * 46),
      on(root + 0.06, 6 + lift * 0.25 + j(1) * 10 + 6),
      on(lerp(root, 0.5, 0.5), 8 + lift * 0.55 + j(2) * 16),
      on(0.44 + j(3) * 0.04, 8 + lift * 0.85 + j(4) * 10),
      on(0.53, 14 + lift * 0.95 + j(5) * 5),
      on(0.6, 28 + lift * 0.85),
      v(lerp(464, 480, s), lerp(1282, 1300, s)),
      v(lerp(498, 503, s), lerp(1246, 1256, s)),
      v(soul.x - 3 + s * 6, soul.y + r * 0.7),
    ];
    return sample(ctrl, POINTS);
  }),
  fadeIn: 0.2,
  fadeOut: 0,
});

/** Frame 7: a hammock against the door. */
export const cradle = (soul: Vec): Gesture => {
  const x = soul.x;
  return {
    pts: between(
      [
        v(x - 206, 1322),
        v(x - 168, 1298),
        v(x - 125, 1282),
        v(x - 84, 1281),
        v(x - 50, 1292),
        v(x - 22, 1303),
        v(x + 8, 1303),
        v(x + 32, 1287),
        v(x + 47, 1258),
        v(x + 54, 1222),
      ],
      [
        v(x - 208, 1367),
        v(x - 165, 1368),
        v(x - 122, 1358),
        v(x - 84, 1352),
        v(x - 50, 1358),
        v(x - 15, 1367),
        v(x + 18, 1368),
        v(x + 38, 1360),
        v(x + 50, 1338),
        v(x + 54, 1300),
      ],
      0.85,
    ),
    fadeIn: 0.28,
    fadeOut: 0.07,
  };
};

export const blend = (a: Gesture, b: Gesture, t: number): Gesture => ({
  pts: a.pts.map((l, k) => mixPts(l, b.pts[k], t)),
  fadeIn: lerp(a.fadeIn, b.fadeIn, t),
  fadeOut: lerp(a.fadeOut, b.fadeOut, t),
});

// The film: 18 s as one pure function of time. It drives the same parameters
// the key frames use; only the transitions are new.

import {
  type Key as KeyT,
  type Vec,
  clamp,
  dampedSettle,
  inCubic,
  inOutCubic,
  inQuad,
  keyed,
  keyedVec,
  lerp,
  mix,
  outBack,
  outCubic,
  progress,
  smooth,
  TAU,
} from "./math";
import { H, sample, spline, v, W } from "./curves";
import { type House, type Ripple, house } from "./house";
import {
  type Key,
  KEY_LENGTH,
  type Scene,
  inKeyhole,
  noWave,
  onFloor,
} from "./scene";
import {
  type Gesture,
  arm,
  bed,
  blend,
  cradle,
  curledArm,
  ribbon,
  swept,
} from "./soulLines";
import {
  springHead,
  springThought,
  tangleThought,
  wheelThought,
} from "./thought";
import { type WaveLine, knock, surf, waves } from "./waves";

export const DURATION = 18;

export type Camera = {
  x: number;
  y: number;
  zoom: number;
  shakeX: number;
  shakeY: number;
};

const ramp = (t: number, a: number, b: number, e = inOutCubic) =>
  e(progress(t, a, b));
const shift = (p: Vec[], dx: number, dy: number) =>
  dx || dy ? p.map((q) => v(q.x + dx, q.y + dy)) : p;
const k = (t: number, val: number, ease?: KeyT<number>["ease"]) => ({
  t,
  v: val,
  ease,
});
const kv = (t: number, x: number, y: number, ease?: KeyT<Vec>["ease"]) => ({
  t,
  v: v(x, y),
  ease,
});

/** Where things happen, in seconds. Sound and motion both read from here. */
export const E = {
  knock: [0.75, 1.0],
  click1: 3.05,
  bored: 5.6,
  knock2: 6.72,
  click2: 7.42,
  bored2: 8.65,
  knock3: [9.85, 10.1, 10.35],
  halt: 10.95,
  gentle: 11.55,
  choose: 11.95,
  storm: 12.1,
  calm: 13.3,
  roll: 13.8,
  rest: 14.6,
};

// ——— the house ———

const BEAT = 0.64; // one bounce
const bounce = (t: number) => Math.cos((TAU * (t - E.click1 - 0.3)) / BEAT);
const springWeight = (t: number) => {
  const on = ramp(t, E.click1, E.click1 + 0.28, outCubic);
  const off = t < E.bored ? 1 : 1 - ramp(t, E.bored, E.bored + 0.3);
  const ring = t > E.bored ? 0.16 * dampedSettle(t - E.bored - 0.2, 2.4, 5) : 0;
  return on * off * (0.44 + 0.62 * bounce(t)) - ring;
};
const wheelWeight = (t: number) =>
  t < E.bored2
    ? (t < E.click2
        ? 0
        : outBack(progress(t, E.click2, E.click2 + 0.36), 2.2)) *
      (0.9 + 0.13 * Math.cos((TAU * (t - E.click2 - 0.4)) / 0.5))
    : 1.0 * (1 - ramp(t, E.bored2, E.bored2 + 0.3)) -
      0.12 * dampedSettle(t - E.bored2 - 0.24, 2.6, 6);

const rippleAt = (t: number): Ripple =>
  t < 9.4
    ? {
        inside: keyed(
          [
            k(0, 3),
            k(2.2, 1.5),
            k(3.05, 1.5),
            k(3.35, 9),
            k(5.6, 9),
            k(6.1, 1.5),
            k(7.4, 1),
            k(7.7, 0),
            k(9.2, 0),
          ],
          t,
        ),
        outside: keyed(
          [
            k(0, 4),
            k(2.2, 2),
            k(3.05, 2),
            k(3.35, 8),
            k(5.6, 8),
            k(6.1, 2),
            k(7.4, 1),
            k(9.2, 0),
          ],
          t,
        ),
        phase: 0.6 + 0.5 * t,
        tempo: 1.5,
      }
    : t < 13.9
      ? {
          inside: 0,
          outside: keyed(
            [
              k(E.storm, 0),
              k(E.storm + 0.35, 24, outCubic),
              k(E.calm, 20),
              k(13.85, 0),
            ],
            t,
          ),
          phase: 4.2 - 7.5 * (t - 12.6),
          tempo: 4.6,
          from: 668,
        }
      : {
          inside: keyed([k(14, 0), k(15, 1)], t),
          outside: keyed([k(14, 0), k(15, 1.5)], t),
          phase: 0.6 + 0.35 * (t - 14),
          tempo: 1.5,
        };

// ——— the soul ———

const soulAt = (t: number) => {
  let p = keyedVec(
    [
      kv(0, 286, 1238),
      kv(1.25, 286, 1238),
      kv(1.8, 313, 1254),
      kv(3.05, 313, 1254),
      kv(3.36, 404, 861, outCubic),
      kv(5.6, 404, 861),
      kv(6.0, 286, 1272, inQuad),
      kv(6.15, 286, 1272),
      kv(6.4, 286, 1238, outCubic),
      kv(6.75, 286, 1238),
      kv(6.98, 313, 1254),
      kv(7.42, 313, 1254),
      kv(7.72, 535, 1190, outCubic),
      kv(7.95, 496, 1250),
      kv(8.2, 530, 1202),
      kv(8.45, 500, 1246),
      kv(8.65, 518, 1216),
      kv(9.0, 286, 1272),
      kv(9.15, 286, 1272),
      kv(9.35, 286, 1242, outCubic),
      kv(10.2, 286, 1242),
      kv(10.6, 313, 1254),
      kv(E.choose, 313, 1254),
      kv(12.5, 300, 1258),
      kv(E.roll, 300, 1258),
      kv(E.rest, 569, 1254, (x) => outBack(smooth(x), 0.25)),
      kv(18, 569, 1254),
    ],
    t,
  );
  // tossed against the beat of the house
  const toss = ramp(t, 3.3, 3.5) * (1 - ramp(t, 5.45, 5.65));
  p = v(
    p.x + toss * 18 * Math.sin((TAU * (t - 3.36)) / (BEAT * 2)),
    p.y + toss * 112 * (1 - bounce(t - 0.05)),
  );
  if (t > 6 && t < 6.75) p.y -= 22 * Math.abs(dampedSettle(t - 6, 1.5, 5)); // small landing hop
  p.y -= 10 * Math.sin(Math.PI * progress(t, E.roll, E.rest - 0.15));
  const r = keyed(
    [
      k(0, 46),
      k(1.3, 46),
      k(2.3, 43),
      k(2.85, 41),
      k(3.2, 10),
      k(6.15, 11),
      k(6.4, 48, (x) => outBack(x)),
      k(6.6, 46),
      k(7.1, 44),
      k(7.3, 42),
      k(7.55, 13),
      k(9.15, 14),
      k(9.35, 47, (x) => outBack(x)),
      k(9.6, 46),
      k(10.95, 45),
      k(E.choose, 45),
      k(12.3, 51, outCubic),
      k(12.6, 49),
      k(14.6, 47),
      k(18, 47),
    ],
    t,
  );
  const power = keyed(
    [
      k(0, 1),
      k(1.3, 1),
      k(2.4, 0.82),
      k(2.85, 0.75),
      k(3.2, 0.42),
      k(6.15, 0.42),
      k(6.4, 1.1),
      k(6.7, 1),
      k(7.1, 0.82),
      k(7.55, 0.5),
      k(9.15, 0.5),
      k(9.35, 1.1),
      k(9.7, 0.95),
      k(10.95, 0.86),
      k(E.choose, 0.86),
      k(12.4, 1.5),
      k(13.4, 1.4),
      k(14.6, 1.2),
      k(18, 1.2),
    ],
    t,
  );
  const breath = 1 + 0.016 * Math.sin((TAU * t) / 2.4) * life(t);
  return { ...p, r: r * breath, power };
};

/** 0 during the held breath, 1 elsewhere. */
const life = (t: number) =>
  1 - ramp(t, 10.8, 10.95) * (1 - ramp(t, 11.7, 11.95));

// ——— the key ———

const HALF = 644 - KEY_LENGTH / 2 + 5;

const handAt = (t: number): Vec =>
  keyedVec(
    [
      kv(1.25, 470, 1354),
      kv(1.8, 478, onFloor),
      kv(2.3, 686, onFloor - 1, inOutCubic),
      kv(2.62, 686, onFloor - 1),
      kv(3.05, 560, 1352),
      kv(6.75, 470, 1354),
      kv(6.92, 486, onFloor),
      kv(7.12, 686, onFloor - 1),
      kv(7.24, 686, onFloor - 1),
      kv(7.42, 590, 1352),
      kv(10.2, 470, 1354),
      kv(10.5, 480, onFloor),
      kv(10.62, 492, onFloor),
      kv(E.halt, HALF, onFloor, inCubic),
      kv(E.choose, HALF, onFloor),
      kv(12.22, 488, 1350),
      kv(12.6, 476, 1254, (x) => outBack(x, 1.1)),
      kv(18, 476, 1254),
    ],
    t,
  );

const keyAt = (t: number, h: House): Key | null => {
  const hand = handAt(t);
  const grow = (a: number) => outBack(progress(t, a, a + 0.35));
  if (t < 1.45) return null;
  if (t < 2.62)
    return { ring: hand, angle: -0.2 * ramp(t, 2.36, 2.6), scale: grow(1.45) };
  const seat = (a: number, hole: Key, t0: number, t1: number): Key => {
    const u = ramp(t, t0, t1);
    const ring = spline(
      [v(686, onFloor - 1), v(742, 1300), v(748, 1200), hole.ring],
      u,
    );
    return { ring, angle: lerp(a, hole.angle, u) };
  };
  if (t < E.bored) {
    const twist =
      t > E.click1 ? 0.05 * Math.sin((TAU * (t - E.click1)) / BEAT) : 0;
    return seat(-0.2, inKeyhole(h, -0.06 + twist), 2.62, E.click1 - 0.02);
  }
  const thrown = (
    a: number,
    hole: Key,
    back: Vec,
    span: number,
  ): Key | null => {
    const u = progress(t, a, a + span);
    const s = 1 - ramp(t, a + span, a + span * 1.35);
    if (s <= 0) return null;
    const ring =
      u < 1
        ? spline(
            [
              hole.ring,
              v(735, 1120),
              v(752, 1290),
              v(690, onFloor),
              v(580, onFloor),
              v(back.x + 95, onFloor),
            ],
            outCubic(u),
          )
        : mix(v(back.x + 95, onFloor), back, 1 - s);
    return {
      ring,
      angle: hole.angle - TAU * 1 * smooth(clamp(u * 1.6)),
      scale: s,
    };
  };
  if (t < 6.7) return thrown(E.bored, inKeyhole(h, -0.06), v(300, 1240), 0.58);
  if (t < 6.84) return null;
  if (t < 7.24)
    return {
      ring: hand,
      angle: -0.2 * ramp(t, 7.12, 7.24),
      scale: outBack(progress(t, 6.84, 7.02)),
    };
  if (t < E.bored2)
    return seat(
      -0.2,
      inKeyhole(
        h,
        0.04 * Math.sin((TAU * (t - E.click2)) / 0.5) * progress(t, 7.5, 7.7),
      ),
      7.24,
      E.click2,
    );
  if (t < 9.6) return thrown(E.bored2, inKeyhole(h, 0), v(300, 1240), 0.48);
  if (t < 10.28) return null;
  const turn = -Math.PI * ramp(t, 12.14, 12.6);
  if (t < E.calm) return { ring: hand, angle: turn, scale: grow(10.28) };
  const u = ramp(t, E.calm, 13.98);
  return {
    ring: spline(
      [v(476, 1254), v(430, 1130), v(310, 1090), v(225, 1210), v(236, onFloor)],
      u,
    ),
    angle: lerp(-Math.PI, 0, smooth(clamp(u * 1.1))),
  };
};

// ——— the soul's lines ———

const linesAt = (t: number, soul: Vec & { r: number }, h: House): Gesture => {
  const hand = handAt(t);
  const G: Record<string, () => Gesture> = {
    bed,
    arm: () => arm(v(313, 1254), hand),
    ribbon: () => ribbon(soul, soul.r),
    swept: () => swept(soul, soul.r, h.floor),
    curl: () => curledArm(v(300, 1258), hand),
    cradle: () => cradle(v(569, 1254)),
  };
  // [start, end, gesture]: each gesture takes over from the one before
  const cues: [number, number, keyof typeof G][] = [
    [0, 0, "bed"],
    [1.2, 1.85, "arm"],
    [3.02, 3.32, "ribbon"],
    [5.65, 6.1, "bed"],
    [6.7, 6.95, "arm"],
    [7.4, 7.68, "swept"],
    [8.68, 9.05, "bed"],
    [10.15, 10.6, "arm"],
    [E.choose, 12.55, "curl"],
    [E.calm + 0.1, 14.5, "cradle"],
  ];
  let i = cues.length - 1;
  while (i > 0 && t < cues[i][0]) i--;
  const u = i ? ramp(t, cues[i][0], cues[i][1]) : 1;
  const now = G[cues[i][2]]();
  const tied = (n: number) =>
    n >= 0 && (cues[n][2] === "ribbon" || cues[n][2] === "swept");
  let g = now;
  if (u < 1) {
    // the soul's end of the bundle never lets go: first to rise, last to fall
    const from = G[cues[i - 1][2]]();
    const raw = progress(t, cues[i][0], cues[i][1]);
    g = blend(from, now, u);
    if (tied(i) || tied(i - 1)) {
      g.pts = from.pts.map((l, n) =>
        l.map((p, j) => {
          const s = j / (l.length - 1);
          return mix(
            p,
            now.pts[n][j],
            tied(i)
              ? outCubic(clamp(raw * (1 + 5 * s * s)))
              : Math.pow(u, 1 + 26 * s * s),
          );
        }),
      );
      g.fadeOut = tied(i) ? 0 : now.fadeOut * Math.pow(u, 8);
    }
  }
  // the bundle breathes, and shivers when the house is ruled
  const amp = life(t) * (2.2 + 2 * Math.abs(springWeight(t)));
  return {
    ...g,
    pts: g.pts.map((l, n) =>
      l.map((p, j) => {
        const s = j / (l.length - 1);
        const env = Math.sin(Math.PI * s);
        return v(
          p.x,
          Math.min(
            p.y + amp * env * Math.sin(TAU * (1.4 * s - t * 0.45) + n * 0.35),
            1371,
          ),
        );
      }),
    ),
  };
};

// ——— the guests ———

const rel = (p: Vec, pts: [number, number][]) =>
  pts.map(([x, y]) => v(p.x + x, p.y + y));
const tail24 = (p: Vec[]) => sample(p, 24);
const blendPts = (a: Vec[], b: Vec[], u: number) =>
  a.map((p, i) => mix(p, b[i], u));
const onKey = (key: Key, d: number, up: number) =>
  v(
    key.ring.x + Math.cos(key.angle) * d + Math.sin(key.angle) * up,
    key.ring.y + Math.sin(key.angle) * d - Math.cos(key.angle) * up,
  );
const hookOnRing = (key: Key) =>
  rel(key.ring, [
    [9, 14],
    [4, 13],
    [-5, 5],
    [1, -5],
    [9, -1],
  ]);

const springGuest = (t: number, key: Key | null) => {
  if (t > 6.6) return null;
  // two hops in, a lean at each knock, three hops out
  const inHop = t < 0.6 ? Math.abs(Math.sin((Math.PI * t) / 0.3)) : 0;
  const u = progress(t, E.bored + 0.15, 6.55);
  const outHop = Math.abs(Math.sin(Math.PI * 3 * u)) * (u > 0 && u < 1 ? 1 : 0);
  const dx =
    120 * (1 - ramp(t, 0, 0.6, outCubic)) +
    22 * ramp(t, 1.9, 2.3) -
    4 * ramp(t, 2.8, 3.1) +
    330 * inQuad(u) -
    8 * hit(t, E.knock);
  const ruled =
    ramp(t, E.click1 - 0.1, E.click1 + 0.2) *
    (1 - ramp(t, E.bored, E.bored + 0.2));
  const stretch =
    1 +
    0.16 * inHop +
    0.2 * outHop +
    0.2 * dampedSettle(t - 0.6, 2.6, 5) +
    ruled * (0.14 + 0.2 * bounce(t)) -
    0.05 * ramp(t, 1.9, 2.3) +
    0.012 * Math.sin(TAU * t * 1.3) +
    0.06 * dampedSettle(t - E.knock[1], 3, 5);
  const lift = inHop * 46 + outHop * 60;
  const lean =
    -0.03 * ramp(t, 1.9, 2.3) * (1 - ramp(t, 2.8, 3.1)) +
    0.05 * dampedSettle(t - 0.6, 2, 4);
  const head = springHead(stretch, lean, dx);
  const idle = tail24(
    rel(head, [
      [-30, -1],
      [-42, -9],
      [-50, -22],
      [-56, -18],
    ]),
  );
  const touch = tail24([
    ...rel(head, [
      [-30, -1],
      [-45, -8],
      [-55, -20],
    ]),
    v(668 + 26 * (1 - hit(t, E.knock)), 1161),
  ]);
  let tail = blendPts(
    idle,
    touch,
    t < 1.4 ? ramp(t, 0.5, 0.7) * (1 - ramp(t, 1.15, 1.4)) : 0,
  );
  if (key && t > 1.9 && t < E.bored + 0.2) {
    const grab = tail24([
      v(716, 1205),
      v(700, 1236),
      v(704, 1274),
      v(730, 1308),
      ...(
        [
          [66, 8],
          [63, -7],
          [55, -8],
          [53, 5],
          [61, 9],
          [67, 2],
        ] as const
      ).map(([d, up]) => onKey(key, d, up)),
    ]);
    const b = v(key.ring.x + 9, key.ring.y + 14);
    const hold = tail24([
      v(lerp(head.x, b.x, 0.28), lerp(head.y, b.y, 0.5)),
      v(lerp(head.x, b.x, 0.55), lerp(head.y, b.y, 0.88)),
      v(lerp(head.x, b.x, 0.8), b.y + 3),
      ...hookOnRing(key),
    ]);
    tail = blendPts(
      tail,
      blendPts(grab, hold, ramp(t, 2.6, 2.85)),
      ramp(t, 2.1, 2.55) * (1 - ramp(t, E.bored, E.bored + 0.15)),
    );
  }
  return {
    pts: shift(springThought(stretch, lean, dx, tail), 0, -lift),
    tip: keyed(
      [k(0, 0.04), k(2.1, 0.04), k(2.5, 0.13), k(3.1, 0.07), k(5.7, 0.04)],
      t,
    ),
  };
};

const wheelGuest = (t: number, key: Key | null) => {
  if (t < 6.1 || t > 9.4) return null;
  const dx =
    380 * (1 - ramp(t, 6.15, 6.62, outCubic)) -
    7 * hit(t, [E.knock2]) +
    400 * inQuad(progress(t, E.bored2 + 0.1, 9.35));
  const c = v(822 + dx, 1205);
  const turn =
    t < 6.7
      ? -dx / 95
      : t < E.bored2
        ? -7 * (t - 6.7) * ramp(t, 7.3, 7.6)
        : -7 * (E.bored2 - 6.7) + dx / 95;
  const tail = shift(
    [v(655, 1372), v(694, 1364), v(734, 1368), v(778, 1356)],
    dx,
    0,
  );
  const idle = tail24(
    rel(c, [
      [-70, -20],
      [-98, -6],
      [-118, -24],
      [-128, -16],
    ]),
  );
  const touch = tail24([
    ...rel(c, [
      [-70, -20],
      [-98, -6],
    ]),
    v(690, 1184),
    v(668, 1178),
  ]);
  let hook = blendPts(
    idle,
    touch,
    ramp(t, 6.55, 6.7) * (1 - ramp(t, 6.78, 6.92)),
  );
  if (key && t > 6.9 && t < E.bored2 + 0.2) {
    const grab = tail24([
      v(718, 1214),
      v(702, 1262),
      v(712, 1308),
      ...(
        [
          [66, 8],
          [63, -7],
          [55, -8],
          [53, 5],
          [61, 9],
          [67, 2],
        ] as const
      ).map(([d, up]) => onKey(key, d, up)),
    ]);
    const hold = tail24(
      rel(key.ring, [
        [52, 14],
        [32, 26],
        [14, 18],
        [3, 8],
        [-4, 0],
        [4, -5],
        [10, 0],
      ]),
    );
    hook = blendPts(
      hook,
      blendPts(grab, hold, ramp(t, 7.22, 7.36)),
      ramp(t, 6.95, 7.2) * (1 - ramp(t, E.bored2, E.bored2 + 0.12)),
    );
  }
  return {
    pts: wheelThought(c, 0.75, tail, hook, turn),
    tip: key && t > 7 ? 0.045 : 0.03,
  };
};

const tangleGuest = (t: number) => {
  if (t < 9.05) return null;
  const dx =
    330 * (1 - ramp(t, 9.1, 9.65, outCubic)) -
    7 * hit(t, E.knock3) -
    4 * hit(t, [E.gentle], 0.2);
  const relax = ramp(t, E.calm, 14.7, smooth);
  const storm =
    ramp(t, E.storm - 0.1, E.storm + 0.2, (x) => outBack(x, 2)) *
    (1 - ramp(t, 13.05, 13.5));
  const nerves = life(t) * (1 - relax) * ramp(t, 9.6, 9.9);
  const phase =
    dx / 130 +
    nerves * 0.035 * Math.sin(TAU * 2.7 * t) +
    storm * 0.06 * Math.sin(TAU * 3.1 * t);
  const pts = tangleThought(
    relax,
    lerp(-0.02, 0, relax) -
      0.01 * storm +
      0.008 * nerves * Math.sin(TAU * 1.9 * t),
    phase,
    storm * (1 + 0.16 * Math.sin(TAU * 2.2 * t)),
  );
  // asleep: it rises and sinks with one slow breath
  const b = 0.012 * ramp(t, 14.6, 15.4) * Math.sin((TAU * (t - 14.6)) / 2.8);
  return {
    pts: pts.map((p) => v(p.x + dx, 1373 - (1373 - p.y) * (1 + b))),
    tip: 0,
  };
};

/** Short lunge around each knock: 1 at the touch. */
const hit = (t: number, at: readonly number[], w = 0.1) =>
  at.reduce((s, a) => s + Math.exp(-Math.pow((t - a) / w, 2) * 2), 0);

// ——— waves ———

const wavesAt = (t: number, h: House, r: Ripple): WaveLine[] => {
  const s =
    ramp(t, E.click1, E.click1 + 0.35) * (1 - ramp(t, E.bored + 0.05, 6.1));
  if (s > 0.01) {
    const b = clamp(0.55 + 0.45 * bounce(t - 0.08));
    return waves(
      h,
      {
        ...noWave,
        amount: s,
        bounce: 0.35 + 0.65 * b,
        below: 1,
        phase: -2.1 * (t - 3.4),
        guest: { x: 805, y: 1150, rx: 78, ry: 225 },
      },
      r,
    );
  }
  const w = ramp(t, E.click2, E.click2 + 0.3) * (1 - ramp(t, E.bored2, 9.05));
  if (w > 0.01)
    return waves(
      h,
      {
        ...noWave,
        amount: w,
        swirl: 1,
        phase: -4.2 * (t - 7.8),
        guest: { x: 816, y: 1210, rx: 92, ry: 145 },
      },
      r,
    );
  const g = 1 - ramp(t, 13.1, 13.6);
  if (t > E.storm && g > 0.01)
    return surf(g, (t - E.storm) / 0.32, (t - E.storm) * 11);
  return [];
};

const ripplesAt = (t: number): WaveLine[] => {
  const out: WaveLine[] = [];
  const add = (at: number, p: Vec, power: number) => {
    const age = (t - at) / 0.7;
    if (age <= 0 || age >= 1) return;
    for (const l of knock(p, 0.35 + 0.85 * outCubic(age)))
      out.push({
        pts: l.pts,
        alpha: l.alpha.map((a) => a * power * (1 - age) * 1.3),
      });
  };
  for (const a of E.knock) add(a, v(668, 1161), 1);
  add(E.knock2, v(668, 1180), 1);
  for (const a of E.knock3) add(a, v(668, 1195), 1.1);
  add(E.gentle, v(668, 1195), 0.5);
  return out;
};

// ——— camera ———

const cameraAt = (t: number): Camera => {
  const zoom = keyed(
    [
      k(0, 1),
      k(0.7, 1.05),
      k(1.2, 1.05),
      k(2.2, 1.2),
      k(2.9, 1.22),
      k(E.click1 + 0.1, 1.0, outCubic),
      k(E.click1 + 0.2, 1.045),
      k(5.6, 1.0),
      k(6.6, 1.03),
      k(7.15, 1.1),
      k(7.4, 1.1),
      k(7.52, 1.0, outCubic),
      k(8.6, 1.03),
      k(9.3, 1),
      k(10.2, 1.04),
      k(E.halt, 1.22, inQuad),
      k(11.6, 1.32, (x) => x),
      k(E.choose, 1.32),
      k(12.12, 1.06, outCubic),
      k(13.2, 1.0),
      k(18, 1),
    ],
    t,
  );
  const at = keyedVec(
    [
      kv(0, 640, 1200),
      kv(1.2, 640, 1200),
      kv(2.2, 800, 1340),
      kv(3.0, 800, 1300),
      kv(3.3, 470, 1200),
      kv(6.6, 860, 1300),
      kv(7.2, 880, 1340),
      kv(7.6, 470, 1200),
      kv(10, 850, 1320),
      kv(E.halt, 858, 1335),
      kv(E.choose, 858, 1335),
      kv(12.4, 560, 1200),
      kv(18, W / 2, H / 2),
    ],
    t,
  );
  const jolt =
    9 * (dampedSettle(t - E.click1, 9, 9) + dampedSettle(t - E.click2, 9, 9)) +
    6 * dampedSettle(t - E.storm, 9, 8);
  const tap =
    [...E.knock, E.knock2, ...E.knock3].reduce(
      (s, a) => s + dampedSettle(t - a, 8, 16),
      0,
    ) * 2.2;
  return { x: at.x, y: at.y, zoom, shakeX: jolt * 0.5 - tap, shakeY: jolt };
};

export const film = (t: number): { scene: Scene; camera: Camera } => {
  const ripple = rippleAt(t);
  const h = house({ spring: springWeight(t), wheel: wheelWeight(t) }, ripple);
  const soul = soulAt(t);
  const key = keyAt(t, h);
  const guests = [
    springGuest(t, key),
    wheelGuest(t, key),
    tangleGuest(t),
  ].filter((g) => g !== null);
  return {
    scene: {
      house: h,
      ripple,
      soul,
      lines: linesAt(t, soul, h),
      thought: [],
      tip: 0,
      guests,
      key,
      waves: wavesAt(t, h, ripple),
      ripples: ripplesAt(t),
      phrase: false,
    },
    camera: cameraAt(t),
  };
};

// The thoughts. Every one is a single unbroken polyline.

import { type Vec, clamp, hash01, lerp, mix, smooth, TAU } from "./math";
import { even, soften, spline, v, wobble } from "./curves";

/** Springy scribble, from its foot on the ground to the base of its neck. */
const SPRING_BODY: Vec[] = [
  v(776, 1373),
  v(806, 1371),
  v(838, 1354),
  v(862, 1322),
  v(869, 1290),
  v(853, 1267),
  v(828, 1264),
  v(806, 1276),
  v(804, 1288),
  v(826, 1290),
  v(853, 1272),
  v(869, 1244),
  v(864, 1216),
  v(836, 1207),
  v(803, 1214),
  v(781, 1230),
  v(788, 1239),
  v(812, 1232),
  v(834, 1210),
  v(836, 1190),
  v(816, 1178),
  v(788, 1183),
  v(771, 1192),
  v(780, 1197),
  v(801, 1185),
  v(809, 1168),
  v(797, 1162),
  v(776, 1178),
];
const SPRING_HEAD: Vec[] = [
  v(752, 1192),
  v(727, 1185),
  v(715, 1166),
  v(727, 1137),
  v(757, 1115),
  v(793, 1104),
  v(822, 1108),
  v(826, 1129),
  v(806, 1152),
  v(770, 1170),
  v(733, 1178),
];

/**
 * @param stretch 1 = at rest; 1.3 = caught mid-bounce
 * @param tail    from the head to whatever it touches (door, key)
 */
export const springThought = (
  stretch: number,
  lean: number,
  dx: number,
  tail: Vec[],
): Vec[] => {
  const k = stretch - 1;
  const warp = (p: Vec, head: number): Vec => {
    const up = 1373 - p.y;
    const squeeze = 1 - k * 0.35;
    return {
      x: 815 + (p.x - 815) * squeeze + dx + lean * up + head * k * 12,
      y: 1373 - up * (1 + k) + head * wobble(p.x / 160, 3) * 8 * k,
    };
  };
  const pts = [
    ...SPRING_BODY.map((p) => warp(p, 0)),
    ...SPRING_HEAD.map((p) => warp(p, 1)),
    ...tail,
  ];
  return even(
    Array.from({ length: 1400 }, (_, i) => spline(pts, i / 1399)),
    900,
  );
};

/** Where the springy scribble's head ends and its tail begins. */
export const springHead = (stretch: number, lean: number, dx: number): Vec => {
  const k = stretch - 1;
  const p = SPRING_HEAD[SPRING_HEAD.length - 1];
  const up = 1373 - p.y;
  return {
    x: 815 + (p.x - 815) * (1 - k * 0.35) + dx + lean * up + k * 12,
    y: 1373 - up * (1 + k) + wobble(p.x / 160, 3) * 8 * k,
  };
};

/** The whirl: uneven overlapping turns with an open centre. */
export const wheelThought = (
  c: Vec,
  spin: number,
  tail: Vec[],
  hook: Vec[],
  roll = 0, // turns the bumps of the rim; the ends stay put
): Vec[] => {
  const turns = 5.55;
  const ring: Vec[] = [];
  for (let i = 0; i <= 64; i++) {
    const u = i / 64;
    const a = spin - u * turns * TAU;
    const rx = 82 + 21 * wobble(u * 2.1, 11) + 6 * Math.sin(u * 13);
    const ry = 104 + 22 * wobble(u * 2.3, 23) + 6 * Math.cos(u * 11);
    const tilt = 0.45 + 0.2 * wobble(u * 1.8, 31);
    const bump =
      1 +
      0.13 * (Math.cos(2 * (a - roll)) - Math.cos(2 * a)) +
      0.08 * (Math.cos(a - roll) - Math.cos(a));
    const x = Math.cos(a) * rx * bump;
    const y = Math.sin(a) * ry * bump;
    ring.push({
      x:
        c.x +
        x * Math.cos(tilt) -
        y * Math.sin(tilt) +
        10 * wobble(u * 1.7, 41),
      y:
        c.y +
        x * Math.sin(tilt) +
        y * Math.cos(tilt) +
        10 * wobble(u * 1.9, 43),
    });
  }
  const pts = [...tail, ...ring, ...hook];
  return even(
    Array.from({ length: 1800 }, (_, i) => spline(pts, i / 1799)),
    1100,
  );
};

type Loop = { x: number; y: number; rx: number; ry: number; rot: number };

const TIGHT: Loop[] = Array.from({ length: 18 }, (_, i) => {
  const h = (k: number) => hash01(i * 11 + k + 400) - 0.5;
  const top = i % 5 === 3;
  return {
    x: 799 + h(1) * 62,
    y: 1190 + h(2) * 104 - (top ? 50 : 0),
    rx: 72 + h(3) * 50,
    ry: 92 + h(4) * 80,
    rot: h(5) * 1.7,
  };
});

// From the tail on the right to the loop that leans on the door.
const RELAXED: Loop[] = [
  { x: 800, y: 1330, rx: 50, ry: 26, rot: -0.1 },
  { x: 772, y: 1314, rx: 38, ry: 22, rot: 0.1 },
  { x: 798, y: 1312, rx: 88, ry: 48, rot: -0.05 },
  { x: 776, y: 1298, rx: 84, ry: 58, rot: 0.2 },
  { x: 742, y: 1272, rx: 34, ry: 30, rot: 0.4 },
  { x: 778, y: 1262, rx: 72, ry: 34, rot: -0.3 },
  { x: 812, y: 1232, rx: 44, ry: 26, rot: 0.2 },
  { x: 736, y: 1226, rx: 62, ry: 34, rot: -0.2 },
  { x: 716, y: 1240, rx: 44, ry: 38, rot: 0.1 },
];

const loopAt = (loops: Loop[], s: number): Loop => {
  const at = (k: keyof Loop) =>
    spline(
      loops.map((l, i) => v(i, l[k])),
      s,
    ).y;
  return { x: at("x"), y: at("y"), rx: at("rx"), ry: at("ry"), rot: at("rot") };
};

// Where along the line (by length) a loop is torn out when the tangle is refused.
const BURSTS = [
  { u: 0.391, w: 0.0165, dx: 34, dy: -82 },
  { u: 0.664, w: 0.015, dx: -16, dy: -34 },
  { u: 0.612, w: 0.014, dx: 36, dy: 18 },
];

/**
 * The anxious tangle (relax 0) and the same line at rest (relax 1). It unwinds:
 * the number of turns falls while each loop travels to its resting place.
 */
export const tangleThought = (
  relax: number,
  lean: number,
  phase = 0,
  burst = 0, // loops torn outward
  foot = 1373, // ground height under the tail
): Vec[] => {
  const turns = lerp(15.2, 7.3, relax);
  const pts: Vec[] = [];
  const M = 3000;
  const tailEnd = mix(v(762, foot), v(908, 1370), relax);
  const tailMid = mix(v(806, 1340), v(880, 1366), relax);
  const tailSpan = lerp(0.028, 0.075, relax);
  for (let i = 0; i < M; i++) {
    const u = i / (M - 1);
    const a = loopAt(TIGHT, u);
    const b = loopAt(RELAXED, u);
    const l: Loop = {
      x: lerp(a.x, b.x, relax),
      y: lerp(a.y, b.y, relax),
      rx: lerp(a.rx, b.rx, relax),
      ry: lerp(a.ry, b.ry, relax),
      rot: lerp(a.rot, b.rot, relax),
    };
    const ang = 0.6 + phase + u * turns * TAU;
    const soft = 1 + 0.1 * wobble(u * 9, 61);
    const cx = Math.cos(ang) * l.rx * soft;
    const cy = Math.sin(ang) * l.ry * soft;
    let p: Vec = {
      x: l.x + cx * Math.cos(l.rot) - cy * Math.sin(l.rot),
      y: l.y + cx * Math.sin(l.rot) + cy * Math.cos(l.rot),
    };
    p.x += lean * (1373 - p.y);
    // it sags onto the ground instead of passing through it
    if (p.y > 1352) p.y = 1352 + 17 * Math.tanh((p.y - 1352) / 17);
    // and against the door
    const wall = lerp(682, 676, relax);
    if (p.x < wall) p.x = wall - 8 * Math.tanh((wall - p.x) / 8);
    if (p.x > 894) p.x = 894 + 24 * Math.tanh((p.x - 894) / 24);
    if (u < tailSpan) {
      const t = u / tailSpan;
      const q = mix(mix(tailEnd, tailMid, t), mix(tailMid, p, t), t);
      p = mix(q, p, smooth(clamp(t)));
    }
    pts.push(p);
  }
  const line = even(soften(pts, 9), 1800);
  if (!burst) return line;
  return line.map((p, i) => {
    const q = { ...p };
    for (const b of BURSTS) {
      const e = (i / (line.length - 1) - b.u) / b.w;
      const g = burst * Math.exp(-e * e);
      q.x += g * b.dx;
      q.y += g * b.dy;
    }
    return q;
  });
};

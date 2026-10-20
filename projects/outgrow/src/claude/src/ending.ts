// The ending: the freed soul flies an S-curve up out of the wings, the camera
// rises with it, and a spark it sheds writes the closing words.
// The flight is in world space (it shares the shell's camera); the spark and
// the words live in screen space, after the camera has come to rest.

import {
  type Vec,
  clamp,
  dampedSettle,
  inOutCubic,
  lerp,
  outCubic,
  progress,
  rotate,
} from "./math";

export const FLIGHT_START = 11.0;
export const FLIGHT_END = 12.4;
export const SEED_POS: Vec = { x: 0, y: -330 };

/** Camera at rest for the final frame: wings low, soul high on the right. */
export const FINAL_CAM = { center: { x: -201, y: -1860 }, zoom: 0.68, rot: 0.06 };

const W = 1080;
const H = 1920;

/** Screen → world under the final camera. */
export const toWorldFinal = (s: Vec): Vec => {
  const local = rotate({ x: (s.x - W / 2) / FINAL_CAM.zoom, y: (s.y - H / 2) / FINAL_CAM.zoom }, -FINAL_CAM.rot);
  return { x: local.x + FINAL_CAM.center.x, y: local.y + FINAL_CAM.center.y };
};

/** World → screen under the final camera (the camera is at rest from ~12.6 s). */
export const toScreenFinal = (p: Vec): Vec => {
  const r = rotate({ x: p.x - FINAL_CAM.center.x, y: p.y - FINAL_CAM.center.y }, FINAL_CAM.rot);
  return { x: r.x * FINAL_CAM.zoom + W / 2, y: r.y * FINAL_CAM.zoom + H / 2 };
};

/** The S-curve as it should read on the final frame (screen px, bottom → top). */
const FLIGHT_SCREEN: Vec[] = [
  { x: 600, y: 1700 },
  { x: 548, y: 1490 },
  { x: 640, y: 1262 },
  { x: 760, y: 1120 },
  { x: 880, y: 1020 },
  { x: 966, y: 800 },
  { x: 968, y: 640 },
  { x: 905, y: 514 },
  { x: 760, y: 392 },
];

const catmull = (p0: Vec, p1: Vec, p2: Vec, p3: Vec, t: number): Vec => {
  const t2 = t * t;
  const t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) =>
    0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return { x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y) };
};

/** Dense, arc-length-indexed samples of the flight path in world space. */
const FLIGHT: { pts: Vec[]; len: number[] } = (() => {
  const ctrl = [SEED_POS, ...FLIGHT_SCREEN.map(toWorldFinal)];
  const pts: Vec[] = [];
  for (let i = 0; i < ctrl.length - 1; i++) {
    const p0 = ctrl[Math.max(0, i - 1)];
    const p3 = ctrl[Math.min(ctrl.length - 1, i + 2)];
    for (let k = 0; k < 40; k++) pts.push(catmull(p0, ctrl[i], ctrl[i + 1], p3, k / 40));
  }
  pts.push(ctrl[ctrl.length - 1]);
  const len = [0];
  for (let i = 1; i < pts.length; i++) {
    len.push(len[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  }
  return { pts, len };
})();

/** Point at fraction p (0..1) of the flight's arc length. */
export const flightPoint = (p: number): Vec => {
  const total = FLIGHT.len[FLIGHT.len.length - 1];
  const target = clamp(p) * total;
  let i = 1;
  while (i < FLIGHT.len.length - 1 && FLIGHT.len[i] < target) i++;
  const a = FLIGHT.len[i - 1];
  const b = FLIGHT.len[i];
  const f = b > a ? (target - a) / (b - a) : 0;
  return { x: lerp(FLIGHT.pts[i - 1].x, FLIGHT.pts[i].x, f), y: lerp(FLIGHT.pts[i - 1].y, FLIGHT.pts[i].y, f) };
};

/** Unit tangent of the flight at fraction p. */
export const flightTangent = (p: number): Vec => {
  const a = flightPoint(Math.max(0, p - 0.01));
  const b = flightPoint(Math.min(1, p + 0.01));
  const l = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / l, y: (b.y - a.y) / l };
};

/** How far along the flight the soul is at time t. */
export const flightProgress = (t: number) => inOutCubic(progress(t, FLIGHT_START, FLIGHT_END));

/** Soul position from the start of the flight onward. */
export const flightPos = (t: number): Vec => {
  const p = flightPoint(flightProgress(t));
  if (t <= FLIGHT_END) return p;
  // it stops dead, recoils a hair along its path, then hovers
  const tan = flightTangent(1);
  const recoil = 26 * dampedSettle(t - FLIGHT_END, 2.2, 5.5);
  const hover = 5 * Math.sin((t - FLIGHT_END) * 2.4) * outCubic(progress(t, FLIGHT_END, FLIGHT_END + 0.8));
  return { x: p.x + tan.x * recoil, y: p.y + tan.y * recoil + hover };
};

/** 0 → wings camera, 1 → final resting camera. */
export const cameraHandoff = (t: number) => inOutCubic(progress(t, FLIGHT_START - 0.1, FLIGHT_END + 0.15));

// ---------------------------------------------------------------- the words

export type Line = { text: string; orange: boolean; mode: "impact" | "glide" };

export const LINES: Line[] = [
  { text: "Break", orange: true, mode: "impact" },
  { text: "the shape.", orange: false, mode: "glide" },
  { text: "Keep", orange: true, mode: "impact" },
  { text: "becoming.", orange: false, mode: "glide" },
];

export const TEXT_LEFT = 100;
export const FIRST_BASELINE = 645;
export const LINE_STEP = 148;

/**
 * Spark choreography (screen space). Each entry is one move of the spark:
 * a hop (arc) or a glide (along a baseline). Times are in seconds.
 */
export const SPARK = {
  birth: 12.62,
  breakLand: 13.0,
  line2Land: 13.32,
  line2End: 13.82,
  keepLand: 14.12,
  line4Land: 14.42,
  line4End: 15.02,
  settle: 15.3,
} as const;

export const SOUL_FINAL_SCREEN: Vec = FLIGHT_SCREEN[FLIGHT_SCREEN.length - 1];

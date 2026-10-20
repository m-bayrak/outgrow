// The score of the film: where the soul is, when it hits, which shape the shell
// takes and what the camera does — all as pure functions of time in seconds.
// World units: pixels at zoom 1, origin at the shell centre, y pointing down.

import {
  type Key,
  type Vec,
  TAU,
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
  outExpo,
  progress,
  smooth,
} from "./math";
import { T as C, TOUCH } from "./finale";
import { FINAL_CAM, FLIGHT_END, FLIGHT_START, SEED_POS, cameraHandoff, flightPos, flightTangent, toWorldFinal } from "./ending";

export const DURATION = C.end;

/** The film's beats, used for stills and for reasoning about timing. */
export const BEATS = {
  hook: 0.45,
  impact1: 1.2,
  impact3: 3.4,
  eight: 5.35,
  spiral: 6.2,
  rosette: 7.0,
  breakthrough: 8.25,
  unfold: 9.9,
  final: 12.4,
} as const;

// ---------------------------------------------------------------- impacts

export type Impact = { t: number; angle: number; strength: number };

/** Moments the soul strikes the shell; angle = direction from centre to contact. */
export const IMPACTS: Impact[] = [
  { t: 1.2, angle: 0, strength: 0.7 },
  { t: 2.3, angle: (Math.PI * 3) / 4, strength: 0.85 },
  { t: 3.4, angle: -Math.PI / 2, strength: 1.2 },
  { t: 4.3, angle: Math.PI / 2, strength: 0.75 },
  { t: 8.25, angle: -Math.PI / 2, strength: 1.6 },
];

// ---------------------------------------------------------------- soul path

const keyedPath: Key<Vec>[] = [
  { t: 0, v: { x: 0, y: 0 } },
  { t: 0.8, v: { x: 0, y: 0 } },
  // attempt 1 → right
  { t: 1.02, v: { x: -46, y: 8 }, ease: outCubic },
  { t: 1.2, v: { x: 182, y: -4 }, ease: inCubic },
  { t: 1.32, v: { x: 160, y: -2 }, ease: outCubic },
  { t: 1.75, v: { x: 6, y: -6 }, ease: inOutCubic },
  // attempt 2 → down-left
  { t: 1.98, v: { x: 58, y: -52 }, ease: outCubic },
  { t: 2.3, v: { x: -140, y: 136 }, ease: inCubic },
  { t: 2.42, v: { x: -118, y: 114 }, ease: outCubic },
  { t: 2.85, v: { x: 0, y: 4 }, ease: inOutCubic },
  // attempt 3 → up, the shell finally gives a little
  { t: 3.08, v: { x: 0, y: 70 }, ease: outCubic },
  { t: 3.4, v: { x: 0, y: -205 }, ease: inCubic },
  { t: 3.85, v: { x: 0, y: -262 }, ease: outCubic },
  // thrown back, it rebounds straight into the floor of the shell
  { t: 4.3, v: { x: 0, y: 178 }, ease: inCubic },
  { t: 4.42, v: { x: 0, y: 150 }, ease: outCubic },
  { t: 4.95, v: { x: 0, y: 0 }, ease: inOutCubic },
];

const tailPath: Key<Vec>[] = [
  { t: 7.45, v: { x: 0, y: 0 } },
  // gather below the pinch, then break through it
  { t: 7.85, v: { x: 0, y: 70 }, ease: outCubic },
  { t: 8.25, v: { x: 0, y: -210 }, ease: inCubic },
  { t: 8.9, v: { x: 0, y: -300 }, ease: outExpo },
  { t: 10.5, v: { x: 0, y: -330 }, ease: inOutCubic },
  { t: FLIGHT_START, v: SEED_POS },
];

/** Inside the figure eight and rosette the soul runs its own orbit. */
const orbit = (t: number): Vec => {
  if (t < 6.55) {
    // figure-eight run through the pinch (lissajous)
    const p = (t - 4.95) / (6.55 - 4.95);
    const a = TAU * 1.5 * Math.pow(p, 0.9);
    const amp = smooth(progress(t, 4.95, 5.3));
    return { x: 150 * amp * Math.sin(a) * Math.cos(a), y: -235 * amp * Math.sin(a) };
  }
  // tight spiral at the heart of the rosette
  const p = (t - 6.55) / (7.45 - 6.55);
  const a = TAU * (1.5 + 1.6 * p);
  const r = lerp(0, 120, smooth(progress(t, 6.55, 6.8))) * (1 - smooth(progress(t, 7.15, 7.45)));
  return { x: r * Math.sin(a) * Math.cos(a) * 2, y: -r * Math.sin(a) };
};

export const soulPos = (t: number): Vec => {
  if (t <= 4.95) return keyedVec(keyedPath, t);
  if (t < 7.45) return orbit(t);
  if (t < FLIGHT_START) return keyedVec(tailPath, t);
  return flightPos(t);
};

/** Velocity in world px per second (central difference on the pure path). */
export const soulVel = (t: number): Vec => {
  const dt = 1 / 120;
  const a = soulPos(t - dt);
  const b = soulPos(t + dt);
  return { x: (b.x - a.x) / (2 * dt), y: (b.y - a.y) / (2 * dt) };
};

/** Anticipation charge: the soul gathers before each strike. 0..1 */
export const charge = (t: number) => {
  const windows: [number, number][] = [
    [0.8, 1.2],
    [1.9, 2.3],
    [2.95, 3.4],
    [3.95, 4.3],
    [7.45, 8.25],
  ];
  let c = 0;
  for (const [a, b] of windows) {
    if (t >= a && t <= b + 0.05) c = Math.max(c, Math.sin(Math.PI * progress(t, a, b + 0.05)));
  }
  return c;
};

/** How the soul's tail reads: 0 = none … 1 = long and bright. */
export const tailAmount = (t: number) =>
  keyed(
    [
      { t: 0, v: 0.25 },
      { t: 1.0, v: 0.6 },
      { t: 3.5, v: 0.9 },
      { t: 4.9, v: 0.5 },
      { t: 5.2, v: 1 },
      { t: 7.4, v: 0.7 },
      { t: 8.3, v: 1 },
      { t: 9.5, v: 0 },
      { t: FLIGHT_START, v: 0 },
      { t: FLIGHT_START + 0.25, v: 0.9 },
      { t: FLIGHT_END, v: 0.6 },
      { t: FLIGHT_END + 0.15, v: 0 },
    ],
    t,
  );

/** Soul radius in world px: pulses, and grows a little each time it fights. */
export const soulRadius = (t: number) => {
  const grow = keyed(
    [
      { t: 0, v: 15 },
      { t: 3.4, v: 18 },
      { t: 7.4, v: 21 },
      { t: 8.3, v: 26 },
      { t: 10.6, v: 58 },
      { t: FLIGHT_START + 0.3, v: 40 },
      { t: FLIGHT_END, v: 36 },
      // it grows a little with every letter it inhales
      { t: C.inhale, v: 36 },
      { t: C.inhaleEnd, v: 46 },
    ],
    t,
  );
  const pulse = 1 + 0.12 * Math.sin(TAU * 1.6 * t) * (1 - progress(t, 9, 11)) + 0.25 * charge(t);
  return grow * pulse;
};

/** 0 → round soul, 1 → final upright seed. */
export const seedness = (t: number) => smooth(progress(t, 9.0, 10.8));

/** Direction the soul's blunt end points: up while it is a seed, then along its flight. */
export const soulHeading = (t: number, vel: Vec): number => {
  if (t >= FLIGHT_START + 0.12) {
    const speed = Math.hypot(vel.x, vel.y);
    if (t < FLIGHT_END && speed > 30) return Math.atan2(vel.y, vel.x);
    const tan = flightTangent(1);
    return Math.atan2(tan.y, tan.x);
  }
  if (t >= 9.0) return -Math.PI / 2;
  const speed = Math.hypot(vel.x, vel.y);
  return speed > 5 ? Math.atan2(vel.y, vel.x) : -Math.PI / 2;
};

// ---------------------------------------------------------------- shell shape

export type ShapeId = "circle" | "oval" | "eight" | "spiral" | "rosette" | "wings";

/** Ordered morph track: hold a shape, then morph quickly to the next. */
const SHAPE_TRACK: { shape: ShapeId; until: number; morph: number }[] = [
  { shape: "circle", until: 3.35, morph: 0.4 },
  { shape: "oval", until: 4.45, morph: 0.5 },
  { shape: "eight", until: 5.75, morph: 0.35 },
  { shape: "spiral", until: 6.45, morph: 0.3 },
  { shape: "rosette", until: 7.4, morph: 0.45 },
  { shape: "eight", until: 8.45, morph: 1.6 },
  { shape: "wings", until: Infinity, morph: 0 },
];

/** Current pair of shapes and blend weight b (0 → from, 1 → to). */
export const shapeBlend = (t: number): { from: ShapeId; to: ShapeId; b: number } => {
  for (let i = 0; i < SHAPE_TRACK.length; i++) {
    const s = SHAPE_TRACK[i];
    if (t < s.until) return { from: s.shape, to: s.shape, b: 0 };
    const next = SHAPE_TRACK[i + 1];
    if (t < s.until + s.morph) {
      return { from: s.shape, to: next.shape, b: inOutCubic(progress(t, s.until, s.until + s.morph)) };
    }
  }
  return { from: "wings", to: "wings", b: 0 };
};

/** How strongly the soul physically presses into the rings. */
export const pushWeight = (t: number) =>
  Math.max(1 - smooth(progress(t, 4.4, 5.0)), smooth(progress(t, 7.6, 7.9)) * (1 - smooth(progress(t, 8.5, 8.9))));

// ---------------------------------------------------------------- waves

export type Wave = { t: number; origin: Vec; amp: number; speed: number; tint: number };

/** Sound-wave pulses that roll out from the soul through every line. */
export const WAVES: Wave[] = [
  { t: 0.3, origin: { x: 0, y: 0 }, amp: 16, speed: 900, tint: 0.55 },
  { t: 1.2, origin: soulPos(1.2), amp: 20, speed: 1100, tint: 0.7 },
  { t: 2.3, origin: soulPos(2.3), amp: 22, speed: 1100, tint: 0.7 },
  { t: 3.4, origin: soulPos(3.4), amp: 30, speed: 1250, tint: 0.9 },
  { t: 4.3, origin: soulPos(4.3), amp: 20, speed: 1150, tint: 0.65 },
  { t: 6.1, origin: { x: 0, y: 0 }, amp: 18, speed: 1000, tint: 0.5 },
  { t: 8.25, origin: soulPos(8.25), amp: 46, speed: 1500, tint: 1 },
  { t: 10.3, origin: { x: 0, y: -60 }, amp: 18, speed: 1300, tint: 0.45 },
  { t: FLIGHT_END, origin: flightPos(FLIGHT_END), amp: 16, speed: 1300, tint: 0.5 },
  // the soul dives into the guiding lines and the wings feel it
  { t: C.touch, origin: toWorldFinal(TOUCH), amp: 18, speed: 1300, tint: 0.8 },
];

// ---------------------------------------------------------------- camera

export type Camera = { center: Vec; zoom: number; rot: number; shake: Vec };

const zoomKeys: Key<number>[] = [
  { t: 0, v: 1.36 },
  { t: 0.9, v: 1.2 },
  { t: 3.3, v: 1.1 },
  { t: 3.42, v: 1.46, ease: inQuad }, // crash punch #1
  { t: 3.62, v: 1.38, ease: outCubic },
  { t: 4.6, v: 1.15 },
  { t: 5.3, v: 1.5 },
  { t: 7.3, v: 1.42 },
  { t: 7.95, v: 1.2 },
  { t: 8.27, v: 1.5, ease: inQuad }, // crash punch #2
  { t: 8.5, v: 1.4, ease: outCubic },
  { t: 11.0, v: 0.57, ease: inOutCubic }, // pull back to read the whole form
  { t: DURATION, v: 0.62, ease: (x) => x }, // then a slow drift in, never quite still
];

/** 0 = camera holds the shell, 1 = camera locked on the soul. */
const followKeys: Key<number>[] = [
  { t: 0, v: 0.15 },
  { t: 3.0, v: 0.3 },
  { t: 4.0, v: 0.55 },
  { t: 5.2, v: 0.72 },
  { t: 7.4, v: 0.7 },
  { t: 8.5, v: 0.6 },
  { t: 11, v: 0 },
];

export const camera = (t: number): Camera => {
  // the camera is attracted to the soul, not glued to it: it chases a smoothed
  // average of where the soul has just been
  let ax = 0;
  let ay = 0;
  const n = 12;
  for (let k = 0; k < n; k++) {
    const p = soulPos(t - (k / (n - 1)) * 0.3);
    const w = n - k;
    ax += p.x * w;
    ay += p.y * w;
  }
  const norm = (n * (n + 1)) / 2;
  const chased = { x: ax / norm, y: ay / norm };
  const follow = keyed(followKeys, t);
  const finalCenter = { x: 0, y: lerp(0, -120, smooth(progress(t, 9, 11.5))) };
  const center = mix(finalCenter, chased, follow);

  let zoom = keyed(zoomKeys, t);
  // small element-level punches on the first two strikes
  for (const imp of IMPACTS.filter((i) => i.strength < 1)) zoom *= 1 + 0.05 * Math.max(0, dampedSettle(t - imp.t + 0.03, 3, 9));

  // the camera leans into the fight, then levels out for the reveal
  const rot =
    0.22 * Math.sin(TAU * 0.42 * (t - 4.9)) * smooth(progress(t, 4.9, 5.5)) * (1 - smooth(progress(t, 7.3, 8.6)));

  // impact shake: fast decay, deterministic direction per impact
  let sx = 0;
  let sy = 0;
  for (const imp of IMPACTS) {
    const dt = t - imp.t;
    if (dt < 0 || dt > 0.4) continue;
    // only the two decisive strikes shake the whole frame; the rest barely nudge it
    const env = (imp.strength >= 1 ? 15 : 4) * imp.strength * Math.exp(-dt / 0.045);
    sx += env * Math.sin(dt * 170 + imp.angle * 3);
    sy += env * Math.cos(dt * 210 + imp.angle * 5);
  }
  // after the wings form, the camera hands over to the final framing as the soul flies
  const h = cameraHandoff(t);
  if (h > 0) {
    return {
      center: mix(center, FINAL_CAM.center, h),
      zoom: lerp(zoom, FINAL_CAM.zoom, h),
      rot: lerp(rot, FINAL_CAM.rot, h),
      shake: { x: sx, y: sy },
    };
  }
  return { center, zoom, rot, shake: { x: sx, y: sy } };
};

/** Orange glow across the whole system at the breakthrough. 0..1 */
export const breakthroughFlood = (t: number) => {
  const dt = t - 8.25;
  if (dt < 0) return 0;
  return clamp(outBack(clamp(dt / 0.12)) * Math.exp(-dt * 1.6));
};

/** The final tail line grows down from the seed. 0..1 */
export const finalTail = (t: number) => outCubic(progress(t, 9.4, 11.2));

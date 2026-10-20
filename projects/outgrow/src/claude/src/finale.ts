// The comments ending (versions 04–05): the soul inhales the old words, writes
// "Meaning in the comments.", then enters the left wing, whose top edge is drawn
// out into lines that converge on a drawn comment bubble beside YouTube's real
// comment button. Everything here is in screen space: the camera is at rest
// from ~12.6 s, apart from a slow sink while the words are inhaled.

import { FINAL_CAM, flightPos, flightTangent, toScreenFinal } from "./ending";
import { type Vec, clamp, dampedSettle, inOutCubic, lerp, outCubic, progress, smooth } from "./math";

export const T = {
  inhale: 16.0, // the old letters start flowing into the soul (the wings sink a little meanwhile)
  inhaleEnd: 17.0,
  launch: 17.1, // the soul leaves its hover
  line1Land: 17.5,
  line1End: 17.95,
  line2Land: 18.2,
  line2End: 18.55,
  impact: 18.85, // lands on "comments."
  dive: 19.05, // heads for the top edge of the left wing
  touch: 19.5, // enters the wing's lines
  extend: 19.55, // the wing's top edge starts stretching toward the bubble
  arrive: 20.75, // the slowest line reaches the converge point
  bubble: 20.8, // the bubble outline is drawn from the converge point
  bubbleEnd: 21.25,
  reform: 21.25, // the soul re-forms at the converge point
  burst: 21.5, // ...darts into the bubble and bursts
  split: 21.75, // splits into three dots
  typing: 21.9,
  bars: 22.6, // the dots settle into the bubble's two bars
  barsEnd: 22.9,
  end: 24.9,
} as const;

// ---------------------------------------------------------------- layout

/**
 * The bubble sits just left of YouTube's comment button, level with it.
 * Measured on an iPhone and an Android phone (in this frame's pixels): the
 * button's centre is at x 954–995, y 1254–1280, and the action column starts
 * at x ≈ 927, so the bubble ends before x 910.
 */
export const BUBBLE = { left: 755, top: 1206, w: 150, h: 118, r: 28 };
export const BUBBLE_CENTER: Vec = { x: BUBBLE.left + BUBBLE.w / 2, y: BUBBLE.top + BUBBLE.h / 2 };
/** Where the wing's lines converge: the bubble's left point. */
export const CONVERGE: Vec = { x: BUBBLE.left, y: BUBBLE_CENTER.y };

/** The bubble outline as one stroke, starting where the lines arrive (clockwise, tail at the lower left). */
export const bubblePath = (() => {
  const { left: l, top: t, w, h, r } = BUBBLE;
  const rgt = l + w;
  const bot = t + h;
  return [
    `M${l} ${CONVERGE.y}`,
    `L${l} ${t + r}`,
    `A${r} ${r} 0 0 1 ${l + r} ${t}`,
    `L${rgt - r} ${t}`,
    `A${r} ${r} 0 0 1 ${rgt} ${t + r}`,
    `L${rgt} ${bot - r}`,
    `A${r} ${r} 0 0 1 ${rgt - r} ${bot}`,
    `L${l + 58} ${bot}`,
    `L${l + 22} ${bot + 32}`,
    `L${l + 26} ${bot}`,
    `A${r - 4} ${r - 4} 0 0 1 ${l} ${bot - r + 4}`,
    `L${l} ${CONVERGE.y}`,
  ].join("");
})();

const { x: cx, y: cy } = BUBBLE_CENTER;
/** Three typing dots, and the capsules they become (the bubble's two text bars). */
export const DOTS: { dot: Vec; bar: [Vec, Vec] }[] = [
  { dot: { x: cx - 30, y: cy }, bar: [{ x: cx - 36, y: cy - 17 }, { x: cx + 2, y: cy - 17 }] },
  { dot: { x: cx, y: cy }, bar: [{ x: cx + 2, y: cy - 17 }, { x: cx + 38, y: cy - 17 }] },
  { dot: { x: cx + 30, y: cy }, bar: [{ x: cx - 36, y: cy + 17 }, { x: cx + 10, y: cy + 17 }] },
];

// ---------------------------------------------------------------- the wing pulled into lines

/** Lines of the left wing whose top edge is drawn out toward the bubble. */
export const PULL_FROM = 12;
/** Samples of each line that form the upper-left lobe's top edge (the tip side, then the node side). */
const WINDOW: [number, number] = [363, 383];
/** Where the soul touches: the middle of the outermost line's top edge, after the sink. */
export const TOUCH: Vec = { x: 92, y: 1286 };

type P = Vec & { orange: number };

const cubic = (a: Vec, b: Vec, c: Vec, d: Vec, u: number): Vec => {
  const v = 1 - u;
  return {
    x: v * v * v * a.x + 3 * v * v * u * b.x + 3 * v * u * u * c.x + u * u * u * d.x,
    y: v * v * v * a.y + 3 * v * v * u * b.y + 3 * v * u * u * c.y + u * u * u * d.y,
  };
};

/** One leg from a point on the wing to the converge point, leaving partly along the wing's own tangent. */
const leg = (from: Vec, tangent: Vec, u: number): Vec => {
  const L = Math.hypot(CONVERGE.x - from.x, CONVERGE.y - from.y);
  // mostly toward the bubble, so no leg hooks back on itself
  const dir = unit({ x: tangent.x * 0.3 + ((CONVERGE.x - from.x) / L) * 0.7, y: tangent.y * 0.3 + ((CONVERGE.y - from.y) / L) * 0.7 }, { x: 0, y: 0 });
  const c1 = { x: from.x + dir.x * L * 0.4, y: from.y + dir.y * L * 0.4 };
  const c2 = { x: CONVERGE.x - L * 0.45, y: CONVERGE.y };
  return cubic(from, c1, c2, CONVERGE, u);
};

/** How far line i has been drawn out (0 = wing as it was, 1 = converged), and its orange band. */
export const pullState = (i: number, t: number) => {
  const k = (i - PULL_FROM) / (23 - PULL_FROM); // 0 inner … 1 outer
  const lag = 0.22 * (1 - k); // the outer lines, touched first, lead
  const p = progress(t, T.extend + lag * 0.4, T.arrive - 0.22 + lag);
  const e = inOutCubic(p) + 0.04 * Math.max(0, dampedSettle(t - (T.arrive - 0.22 + lag), 3, 6)) * (p >= 1 ? 1 : 0);
  const lit = smooth(progress(t, T.touch - 0.03, T.touch + 0.1)) * (1 - smooth(progress(t, T.reform, T.reform + 0.1)));
  const drain = smooth(progress(t, T.arrive, T.reform));
  return { e, lit, drain };
};

/**
 * Line i of the wing in screen space, with its top edge drawn out into a
 * hairpin that reaches the converge point. The line stays one closed curve.
 */
export const pullLine = (pts: P[], i: number, t: number): P[] => {
  if (i < PULL_FROM || t < T.touch - 0.05) return pts;
  const { e, lit, drain } = pullState(i, t);
  const [a, b] = WINDOW;
  const tanA = unit(pts[a + 1], pts[a]);
  const tanB = unit(pts[b - 1], pts[b]);
  const n = 140;
  const mid: P[] = [];
  for (let k = 0; k <= n; k++) {
    const v = k / n;
    // the wing as it was, resampled more densely
    const f = a + v * (b - a);
    const j = Math.min(b - 1, Math.floor(f));
    const q = f - j;
    const orig = {
      x: lerp(pts[j].x, pts[j + 1].x, q),
      y: lerp(pts[j].y, pts[j + 1].y, q),
      orange: lerp(pts[j].orange, pts[j + 1].orange, q),
    };
    // the hairpin: out from the tip side to the bubble, back to the node side
    const h = v < 0.5 ? leg(pts[a], tanA, v * 2) : leg(pts[b], tanB, (1 - v) * 2);
    // orange is the soul inside the lines: a band at the leading tip that drains into the bubble
    const w = lerp(0.2, 0.03, drain);
    const band = Math.exp(-Math.pow((v - 0.5) / w, 2)) * lit * (1 - 0.6 * drain);
    const flash = Math.exp(-Math.max(0, t - T.touch) * 5) * lit;
    // ease in from the wing at both ends, so the curve keeps its own tangent there (no kinks)
    const ends = smooth(clamp(Math.min(v, 1 - v) / 0.3));
    const m = e * ends;
    mid.push({ x: lerp(orig.x, h.x, m), y: lerp(orig.y, h.y, m), orange: clamp(Math.max(orig.orange, band, flash * 0.7)) });
  }
  return [...pts.slice(0, a), ...mid, ...pts.slice(b + 1)];
};

const unit = (to: Vec, from: Vec): Vec => {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const l = Math.hypot(dx, dy) || 1;
  return { x: dx / l, y: dy / l };
};

// ---------------------------------------------------------------- the soul

/** The soul's hover point, in screen space, as version 03 left it. */
const hover = (t: number) => toScreenFinal(flightPos(t), t);
export const HOVER_HEADING = (() => {
  const tan = flightTangent(1);
  return Math.atan2(tan.y, tan.x) + FINAL_CAM.rot;
})();

/** Quadratic arc between two points, lifted by `lift` px at its apex. */
export const arc = (a: Vec, b: Vec, lift: number, p: number): Vec => {
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - lift };
  const q = 1 - p;
  return { x: q * q * a.x + 2 * q * p * c.x + p * p * b.x, y: q * q * a.y + 2 * q * p * c.y + p * p * b.y };
};

/** Writing points for the new words, filled in by the layout once the font is measured. */
export type WritePoints = { line1Start: Vec; line1End: Vec; line2Start: Vec; line2End: Vec; impact: Vec };

/** Soul centre in screen space from the launch on. */
export const soulScreen = (t: number, P: WritePoints): Vec => {
  const start = hover(T.launch);
  if (t < T.launch) return hover(t);
  if (t < T.line1Land) return arc(start, P.line1Start, 150, inOutCubic(progress(t, T.launch, T.line1Land)));
  if (t < T.line1End) {
    const p = inOutCubic(progress(t, T.line1Land, T.line1End));
    return { x: lerp(P.line1Start.x, P.line1End.x, p), y: P.line1Start.y };
  }
  if (t < T.line2Land) return arc(P.line1End, P.line2Start, 80, inOutCubic(progress(t, T.line1End, T.line2Land)));
  if (t < T.line2End) {
    const p = inOutCubic(progress(t, T.line2Land, T.line2End));
    return { x: lerp(P.line2Start.x, P.line2End.x, p), y: P.line2Start.y };
  }
  if (t < T.impact) return arc(P.line2End, P.impact, 140, inOutCubic(progress(t, T.line2End, T.impact)));
  if (t < T.dive) {
    // a small rebound off the word
    return { x: P.impact.x, y: P.impact.y - 34 * Math.max(0, Math.sin(Math.PI * progress(t, T.impact, T.dive + 0.08))) };
  }
  if (t < T.touch) {
    const from = { x: P.impact.x, y: P.impact.y - 34 * Math.sin(Math.PI * progress(T.dive, T.impact, T.dive + 0.08)) };
    return arc(from, TOUCH, 70, inOutCubic(progress(t, T.dive, T.touch)));
  }
  if (t < T.reform) return TOUCH;
  if (t < T.burst) return arc(CONVERGE, BUBBLE_CENTER, 18, outCubic(progress(t, T.reform + 0.05, T.burst)));
  return BUBBLE_CENTER;
};

/** Soul radius in screen px from the launch on (it hides inside the lines, then re-forms). */
export const soulScreenRadius = (t: number, start: number) => {
  if (t < T.touch) {
    const writing = lerp(start, 19, smooth(progress(t, T.launch, T.line1Land)));
    return writing * (1 + 0.18 * Math.max(0, dampedSettle(t - T.impact, 3, 8)));
  }
  if (t < T.reform) return 19 * (1 - smooth(progress(t, T.touch, T.touch + 0.18)));
  const grow = 17 * outCubic(progress(t, T.reform, T.reform + 0.1));
  const burst = 1 + 0.45 * Math.max(0, dampedSettle(t - T.burst, 4, 7));
  // it flickers inside the bubble before it splits
  const flicker = t > T.burst ? 1 + 0.12 * Math.sin((t - T.burst) * 70) * (1 - progress(t, T.burst, T.split)) : 1;
  const fade = 1 - smooth(progress(t, T.split, T.split + 0.15));
  return grow * burst * flicker * fade;
};

/** Seed shape (1) melting into a round writer (0) as it launches. */
export const soulScreenSeed = (t: number) => 1 - smooth(progress(t, T.launch, T.launch + 0.28));

/** 0..1: how far each typing dot has turned into its bar. */
export const barMorph = (t: number) => inOutCubic(progress(t, T.bars, T.barsEnd));

/** Typing pulse of dot k (0..1). */
export const typingPulse = (t: number, k: number) => {
  if (t < T.typing || t > T.bars + 0.1) return 0;
  const phase = (t - T.typing - k * 0.13) / 0.52;
  const f = phase - Math.floor(phase);
  return phase < 0 ? 0 : Math.pow(Math.max(0, Math.sin(Math.PI * clamp(f / 0.55))), 2);
};

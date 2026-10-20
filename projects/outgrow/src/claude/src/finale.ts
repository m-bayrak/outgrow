// The comments ending (version 04): the soul inhales the old words, writes
// "Meaning in the comments.", then enters a family of lines that converge on a
// drawn comment bubble beside YouTube's real comment button.
// Everything here is in screen space: the camera is at rest from ~12.6 s.

import { FINAL_CAM, flightPos, flightTangent, toScreenFinal } from "./ending";
import { type Vec, clamp, dampedSettle, inOutCubic, lerp, outCubic, progress, smooth } from "./math";

export const T = {
  inhale: 16.0, // the old letters start flowing into the soul
  inhaleEnd: 17.0,
  launch: 17.1, // the soul leaves its hover
  line1Land: 17.5,
  line1End: 17.95,
  line2Land: 18.2,
  line2End: 18.55,
  impact: 18.85, // lands on "comments."
  dive: 19.05, // heads for the lower-left ends of the lines
  touch: 19.5, // enters the lines
  extend: 19.55, // the line tips start growing toward the bubble
  arrive: 20.45, // the slowest tip reaches the converge point
  bubble: 20.5, // the bubble outline is drawn from the converge point
  bubbleEnd: 20.95,
  reform: 20.95, // the soul re-forms at the converge point
  burst: 21.2, // ...darts into the bubble and bursts
  split: 21.45, // splits into three dots
  typing: 21.6,
  bars: 22.3, // the dots settle into the bubble's two bars
  barsEnd: 22.6,
  end: 24.6,
} as const;

// ---------------------------------------------------------------- layout

/** Where the lines converge: the target icon's left point plus the owner's offset (≈21 down, 25 left). */
export const CONVERGE: Vec = { x: 819, y: 1151 };

/** The bubble body, to the right of the converge point; YouTube's real button is just beyond its right edge. */
export const BUBBLE = { left: CONVERGE.x, top: 1086, w: 166, h: 130, r: 32 };
export const BUBBLE_CENTER: Vec = { x: BUBBLE.left + BUBBLE.w / 2, y: BUBBLE.top + BUBBLE.h / 2 };

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
    `L${l + 64} ${bot}`,
    `L${l + 24} ${bot + 36}`,
    `L${l + 28} ${bot}`,
    `A${r - 4} ${r - 4} 0 0 1 ${l} ${bot - r + 4}`,
    `L${l} ${CONVERGE.y}`,
  ].join("");
})();

/** Three typing dots, and the capsules they become (the bubble's two text bars). */
export const DOTS: { dot: Vec; bar: [Vec, Vec] }[] = [
  { dot: { x: BUBBLE_CENTER.x - 34, y: BUBBLE_CENTER.y }, bar: [{ x: 862, y: 1132 }, { x: 904, y: 1132 }] },
  { dot: { x: BUBBLE_CENTER.x, y: BUBBLE_CENTER.y }, bar: [{ x: 904, y: 1132 }, { x: 944, y: 1132 }] },
  { dot: { x: BUBBLE_CENTER.x + 34, y: BUBBLE_CENTER.y }, bar: [{ x: 862, y: 1170 }, { x: 912, y: 1170 }] },
];

/** The guiding lines: they enter at the left edge and converge on CONVERGE. */
export const GUIDE_COUNT = 12;
const guideCtrl = (i: number): Vec[] => {
  const s = i / (GUIDE_COUNT - 1);
  return [
    { x: -30, y: 1238 + 92 * s },
    { x: 300, y: 1084 + 120 * s },
    { x: 600, y: 1112 + 62 * s },
    CONVERGE,
  ];
};
const bezier = (c: Vec[], u: number): Vec => {
  const v = 1 - u;
  const a = v * v * v;
  const b = 3 * v * v * u;
  const d = 3 * v * u * u;
  const e = u * u * u;
  return { x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x, y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y };
};
export const GUIDE_SAMPLES = 120;
export const GUIDES: Vec[][] = Array.from({ length: GUIDE_COUNT }, (_, i) => {
  const c = guideCtrl(i);
  return Array.from({ length: GUIDE_SAMPLES + 1 }, (_, k) => bezier(c, k / GUIDE_SAMPLES));
});

/** Short stubs at the left edge that the soul dives into (fraction of each line). */
export const STUB = 0.085;
/** Where the soul touches the stubs. */
export const TOUCH: Vec = { x: 64, y: 1262 };

/** How far line i is drawn (0..1) and where its orange band runs, at time t. */
export const guideState = (i: number, t: number) => {
  const stub = STUB * outCubic(progress(t, T.impact, T.touch - 0.05));
  const lag = 0.09 * Math.abs(i - (GUIDE_COUNT - 1) / 2) / ((GUIDE_COUNT - 1) / 2);
  const grow = inOutCubic(progress(t, T.extend + lag * 0.5, T.arrive - 0.09 + lag));
  const head = lerp(stub, 1, grow);
  // the soul is now the orange in the lines: a band at the leading end that
  // drains into the converge point once the lines arrive
  const lit = smooth(progress(t, T.touch - 0.04, T.touch + 0.08));
  const drain = smooth(progress(t, T.arrive, T.reform + 0.05));
  const from = lerp(Math.max(0, head - 0.3), 1, drain);
  return { head, from, orange: lit * (1 - smooth(progress(t, T.reform, T.reform + 0.1))) };
};

// ---------------------------------------------------------------- the soul

/** The soul's hover point, in screen space, as version 03 left it. */
const hover = (t: number) => toScreenFinal(flightPos(t));
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

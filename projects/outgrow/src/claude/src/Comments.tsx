import { loadFont } from "@remotion/google-fonts/InterTight";
import { measureText } from "@remotion/layout-utils";
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import {
  BUBBLE,
  BUBBLE_CENTER,
  DOTS,
  HOVER_HEADING,
  T,
  TOUCH,
  type WritePoints,
  barMorph,
  bubblePath,
  soulScreen,
  soulScreenRadius,
  soulScreenSeed,
  typingPulse,
} from "./finale";
import { FINAL_CAM } from "./ending";
import { type Vec, TAU, clamp, dampedSettle, lerp, mix, outBack, outCubic, progress, smooth } from "./math";
import { soulShape, taperedPolygon } from "./shapes";
import { soulRadius } from "./timeline";

const { fontFamily, waitUntilDone } = loadFont("normal", { weights: ["800"], subsets: ["latin"] });
const WEIGHT = 800;
const TEXT_LEFT = 100;
/** "comments." spans this many pixels, as on the target frame. */
const WIDEST_LINE_PX = 772;
/** Baseline of "comments.": low, just above the wing's drawn-out lines (version 05: 100 px lower). */
const LAST_BASELINE = 1112;

type Line = { text: string; mode: "glide" | "impact" };
const LINES: Line[] = [
  { text: "Meaning", mode: "glide" },
  { text: "in the", mode: "glide" },
  { text: "comments.", mode: "impact" },
];

type Glyph = { ch: string; x: number; w: number };
type LineLayout = { glyphs: Glyph[]; width: number; baseline: number };
type Layout = { size: number; lines: LineLayout[]; P: WritePoints };

const measureLayout = (): Layout => {
  const at100 = measureText({ text: "comments.", fontFamily, fontSize: 100, fontWeight: WEIGHT }).width;
  const size = Math.round((WIDEST_LINE_PX / at100) * 100);
  const step = Math.round(size * 0.84);
  const width = (s: string) => (s ? measureText({ text: s, fontFamily, fontSize: size, fontWeight: WEIGHT }).width : 0);
  const lines = LINES.map((line, i) => {
    const glyphs: Glyph[] = [];
    for (let k = 0; k < line.text.length; k++) {
      const x = width(line.text.slice(0, k));
      glyphs.push({ ch: line.text[k], x, w: width(line.text.slice(0, k + 1)) - x });
    }
    return { glyphs, width: width(line.text), baseline: LAST_BASELINE - (LINES.length - 1 - i) * step };
  });
  const mid = size * 0.3;
  const [l1, l2, l3] = lines;
  const P: WritePoints = {
    line1Start: { x: TEXT_LEFT - 8, y: l1.baseline - mid },
    line1End: { x: TEXT_LEFT + l1.width + 14, y: l1.baseline - mid },
    line2Start: { x: TEXT_LEFT - 8, y: l2.baseline - mid },
    line2End: { x: TEXT_LEFT + l2.width + 14, y: l2.baseline - mid },
    impact: { x: TEXT_LEFT + l3.width / 2, y: l3.baseline - size * 0.27 },
  };
  return { size, lines, P };
};

const ORANGE: [number, number, number] = [255, 106, 0];
const WHITE: [number, number, number] = [255, 255, 255];
const mixColor = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(",")})`;

const f1 = (n: number) => n.toFixed(1);
const polyline = (pts: Vec[]) => pts.map((p, k) => `${k ? "L" : "M"}${f1(p.x)} ${f1(p.y)}`).join("");

/** Angle from a to b along the shorter way round. */
const lerpAngle = (a: number, b: number, t: number) => {
  let d = (b - a) % TAU;
  if (d > Math.PI) d -= TAU;
  if (d < -Math.PI) d += TAU;
  return a + d * t;
};

export const Comments: React.FC<{ t: number; orange: string; white: string; lineWidth: number; width: number; height: number }> = ({
  t,
  orange,
  white,
  lineWidth,
  width,
  height,
}) => {
  const [handle] = useState(() => delayRender("Loading Inter Tight"));
  const [layout, setLayout] = useState<Layout | null>(null);

  useEffect(() => {
    waitUntilDone()
      .then(() => {
        setLayout(measureLayout());
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);

  const startRadius = useMemo(() => soulRadius(T.launch) * FINAL_CAM.zoom, []);
  if (!layout || t < T.launch - 0.02) return null;
  const { P } = layout;
  const at = (s: number) => soulScreen(s, P);

  // ---- the words
  const glideX = (line: 0 | 1) => {
    const [a, b, to] = line === 0 ? [T.line1Land, T.line1End, P.line1End.x] : [T.line2Land, T.line2End, P.line2End.x];
    if (t < a) return -Infinity;
    return t >= b ? to : at(t).x;
  };
  const letters: React.ReactNode[] = [];
  layout.lines.forEach((line, i) => {
    const def = LINES[i];
    line.glyphs.forEach((g, j) => {
      const slot = { x: TEXT_LEFT + g.x + g.w / 2, y: line.baseline - layout.size * 0.35 };
      let pos = slot;
      let scale = 1;
      let opacity = 1;
      let fill = white;
      if (def.mode === "impact") {
        // letters burst out where the soul lands, centre letters first
        const mid = (line.glyphs.length - 1) / 2;
        const t0 = T.impact + 0.018 * Math.abs(j - mid);
        const p = progress(t, t0, t0 + 0.32);
        if (p <= 0) return;
        const move = outCubic(p);
        pos = mix(P.impact, slot, move);
        scale = lerp(0.15, 1, outBack(p, 2.2)) * (1 + 0.07 * dampedSettle(t - T.impact - 0.3, 2.6, 7));
        opacity = clamp(p * 6);
        fill = g.ch === "." ? white : orange;
      } else {
        // written as the soul glides past; fresh letters glow orange and cool behind it
        const sx = glideX(i as 0 | 1);
        const left = TEXT_LEFT + g.x;
        const p = clamp((sx - left) / Math.max(g.w, 30));
        if (p <= 0) return;
        const e = outBack(p, 2);
        pos = { x: slot.x, y: slot.y + (1 - e) * layout.size * 0.22 };
        scale = lerp(0.55, 1, e);
        opacity = smooth(p);
        const end = i === 0 ? T.line1End : T.line2End;
        const heat = 1 - Math.max(clamp((sx - (left + g.w)) / 260), progress(t, end, end + 0.4));
        fill = mixColor(WHITE, ORANGE, clamp(heat) * 0.9);
      }
      const dy = layout.size * 0.35;
      letters.push(
        <text
          key={`${i}-${j}`}
          x={0}
          y={0}
          textAnchor="middle"
          fill={fill}
          opacity={opacity}
          transform={`translate(${f1(pos.x)} ${f1(pos.y)}) scale(${scale.toFixed(3)}) translate(0 ${f1(dy)})`}
        >
          {g.ch}
        </text>,
      );
    });
  });

  // ---- one-shot rings: the word's shock, the touch on the lines, the burst in the bubble
  const ring = (key: string, c: Vec, t0: number, dur: number, r0: number, r1: number, w: number, o: number) => {
    const p = progress(t, t0, t0 + dur);
    if (p <= 0 || p >= 1) return null;
    const e = outCubic(p);
    return (
      <circle key={key} cx={c.x} cy={c.y} r={lerp(r0, r1, e)} fill="none" stroke={orange} strokeWidth={w * (1 - e) + 0.5} opacity={(1 - p) * o} />
    );
  };
  const rings = [
    ring("impact", P.impact, T.impact, 0.55, 30, 330, 6, 0.9),
    ring("touch", TOUCH, T.touch, 0.5, 12, 150, 4, 0.8),
    ring("burst", BUBBLE_CENTER, T.burst, 0.45, 18, 120, 5, 0.85),
  ];

  // ---- the launch leaves a trace that lingers, then fades
  const traceFade = 1 - smooth(progress(t, T.line1Land + 0.1, T.line1Land + 1.1));
  let trace = "";
  if (traceFade > 0) {
    const end = Math.min(t, T.line1Land);
    const n = 60;
    const pts: Vec[] = [];
    for (let k = 0; k <= n; k++) pts.push(at(lerp(T.launch, end, k / n)));
    trace = polyline(pts);
  }

  // ---- the bubble
  const draw = outCubic(progress(t, T.bubble, T.bubbleEnd));
  const calm = Math.max(0, t - T.barsEnd);
  const breathe = calm > 0 ? 1 + 0.035 * Math.sin(TAU * 0.9 * calm) * smooth(clamp(calm / 0.4)) : 1;
  const glowPulse = calm > 0 ? 0.5 + 0.25 * Math.sin(TAU * 0.9 * calm) : 0.55;
  const bubbleTf = `translate(${BUBBLE_CENTER.x} ${BUBBLE_CENTER.y}) scale(${breathe.toFixed(4)}) translate(${-BUBBLE_CENTER.x} ${-BUBBLE_CENTER.y})`;

  // ---- the soul (screen space from the launch on)
  const r = soulScreenRadius(t, startRadius);
  const dt = 1 / 120;
  const a = at(t - dt);
  const b = at(t + dt);
  const vel = { x: (b.x - a.x) / (2 * dt), y: (b.y - a.y) / (2 * dt) };
  const speed = Math.hypot(vel.x, vel.y);
  const seed = soulScreenSeed(t);
  const heading = lerpAngle(HOVER_HEADING, speed > 30 ? Math.atan2(vel.y, vel.x) : HOVER_HEADING, smooth(progress(t, T.launch, T.launch + 0.15)));
  const stretch = 1 + Math.min(1.3, speed / 1600) * (t < T.touch ? 1 : 0.5);
  const pos = at(t);
  const soulVisible = r > 0.3;
  let tail: string | null = null;
  if (soulVisible && t < T.touch) {
    const steps = Math.round(3 + 14 * clamp(speed / 900));
    const pts: Vec[] = [];
    for (let k = 0; k <= steps; k++) pts.push(at(Math.max(T.launch, t - k / 60)));
    tail = taperedPolygon(pts, r * 0.4);
  }

  // ---- typing dots → bars, and signal arcs toward the real button
  const dotsOn = progress(t, T.split, T.split + 0.15);
  const morph = barMorph(t);
  const dots = DOTS.map((d, k) => {
    if (dotsOn <= 0) return null;
    const from = mix(BUBBLE_CENTER, d.dot, outBack(dotsOn, 2));
    const lift = 7 * typingPulse(t, k);
    const p0 = mix({ x: from.x, y: from.y - lift }, d.bar[0], morph);
    const p1 = mix({ x: from.x, y: from.y - lift }, d.bar[1], morph);
    const w = lerp(17 * (1 + 0.35 * typingPulse(t, k)), 15, morph) * clamp(dotsOn * 3);
    return <line key={k} x1={f1(p0.x)} y1={f1(p0.y)} x2={f1(p1.x)} y2={f1(p1.y)} stroke={orange} strokeWidth={w} strokeLinecap="round" />;
  });
  const arcs: React.ReactNode[] = [];
  if (calm > 0) {
    for (let k = 0; k < 3; k++) {
      const phase = (calm - k * 0.38) / 1.15;
      if (phase < 0) continue;
      const p = phase - Math.floor(phase);
      const rad = lerp(BUBBLE.w / 2 + 14, BUBBLE.w / 2 + 92, outCubic(p));
      const span = 0.55;
      const s0 = { x: BUBBLE_CENTER.x + rad * Math.cos(-span), y: BUBBLE_CENTER.y + rad * Math.sin(-span) };
      const s1 = { x: BUBBLE_CENTER.x + rad * Math.cos(span), y: BUBBLE_CENTER.y + rad * Math.sin(span) };
      arcs.push(
        <path
          key={k}
          d={`M${f1(s0.x)} ${f1(s0.y)}A${f1(rad)} ${f1(rad)} 0 0 1 ${f1(s1.x)} ${f1(s1.y)}`}
          fill="none"
          stroke={orange}
          strokeWidth={lerp(3.2, 1, p)}
          strokeLinecap="round"
          opacity={Math.sin(Math.PI * p) * 0.8 * smooth(clamp(calm / 0.3))}
        />,
      );
    }
  }

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: "absolute", inset: 0 }}>
      <defs>
        <filter id="c-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
        <filter id="c-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
        <filter id="c-halo" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {trace ? <path d={trace} stroke={orange} strokeWidth={lineWidth} opacity={traceFade} /> : null}
      </g>

      {draw > 0 ? (
        <g transform={bubbleTf}>
          <path d={bubblePath} pathLength={1} strokeDasharray={`${draw} 1`} fill="none" stroke={orange} strokeWidth={14} opacity={glowPulse} filter="url(#c-halo)" strokeLinejoin="round" strokeLinecap="round" />
          <path d={bubblePath} pathLength={1} strokeDasharray={`${draw} 1`} fill="none" stroke={orange} strokeWidth={8} strokeLinejoin="round" strokeLinecap="round" />
          {dots}
        </g>
      ) : null}
      {arcs}

      <g style={{ fontFamily, fontWeight: WEIGHT, fontSize: layout.size }}>{letters}</g>
      {rings}

      {soulVisible ? (
        <>
          {tail ? <path d={tail} fill={orange} opacity={0.85} /> : null}
          <g transform={`translate(${f1(pos.x)} ${f1(pos.y)}) rotate(${f1((heading * 180) / Math.PI)})`}>
            <ellipse rx={r * stretch * 2.2} ry={r * 2.2} fill={orange} opacity={0.45} filter="url(#c-glow)" />
            <path d={soulShape(r * stretch, r * lerp(1 / Math.sqrt(stretch), 0.62 / Math.sqrt(stretch), seed), seed)} fill={orange} />
          </g>
        </>
      ) : null}
    </svg>
  );
};

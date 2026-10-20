import { loadFont } from "@remotion/google-fonts/InterTight";
import { measureText } from "@remotion/layout-utils";
import React, { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { T } from "./finale";
import { FIRST_BASELINE, LINES, LINE_STEP, SOUL_FINAL_SCREEN, SPARK, TEXT_LEFT, flightPos, toScreenFinal } from "./ending";
import {
  type Vec,
  clamp,
  dampedSettle,
  inOutCubic,
  inQuad,
  lerp,
  mix,
  outBack,
  outCubic,
  progress,
  smooth,
} from "./math";

const { fontFamily, waitUntilDone } = loadFont("normal", { weights: ["800"], subsets: ["latin"] });
const WEIGHT = 800;
/** "the shape." spans this many pixels on the reference frame. */
const WIDEST_LINE_PX = 805;

type Glyph = { ch: string; x: number; w: number };
type LineLayout = { glyphs: Glyph[]; width: number; baseline: number };
type Layout = { size: number; lines: LineLayout[] };

const measureLayout = (): Layout => {
  const at100 = measureText({ text: "the shape.", fontFamily, fontSize: 100, fontWeight: WEIGHT }).width;
  const size = Math.round((WIDEST_LINE_PX / at100) * 100);
  const width = (s: string) => (s ? measureText({ text: s, fontFamily, fontSize: size, fontWeight: WEIGHT }).width : 0);
  const lines = LINES.map((line, i) => {
    const glyphs: Glyph[] = [];
    for (let k = 0; k < line.text.length; k++) {
      const x = width(line.text.slice(0, k));
      glyphs.push({ ch: line.text[k], x, w: width(line.text.slice(0, k + 1)) - x });
    }
    return { glyphs, width: width(line.text), baseline: FIRST_BASELINE + i * LINE_STEP };
  });
  return { size, lines };
};

/** Quadratic arc between two points, lifted by `lift` px at its apex. */
const arc = (a: Vec, b: Vec, lift: number, p: number): Vec => {
  const c = { x: (a.x + b.x) / 2, y: Math.min(a.y, b.y) - lift };
  const q = 1 - p;
  return { x: q * q * a.x + 2 * q * p * c.x + p * p * b.x, y: q * q * a.y + 2 * q * p * c.y + p * p * b.y };
};

type Points = {
  breakLand: Vec;
  line2Start: Vec;
  line2End: Vec;
  keepLand: Vec;
  line4Start: Vec;
  period: Vec;
  periodR: number;
};

const keyPoints = (L: Layout): Points => {
  const capMid = L.size * 0.36;
  const xMid = L.size * 0.27;
  const [l1, l2, l3, l4] = L.lines;
  const dot = l4.glyphs[l4.glyphs.length - 1];
  return {
    breakLand: { x: TEXT_LEFT + l1.width / 2, y: l1.baseline - capMid },
    line2Start: { x: TEXT_LEFT - 8, y: l2.baseline - xMid },
    line2End: { x: TEXT_LEFT + l2.width + 16, y: l2.baseline - xMid },
    keepLand: { x: TEXT_LEFT + l3.width / 2, y: l3.baseline - capMid },
    line4Start: { x: TEXT_LEFT - 8, y: l4.baseline - xMid },
    period: { x: TEXT_LEFT + dot.x + dot.w / 2, y: l4.baseline - L.size * 0.075 },
    periodR: L.size * 0.075,
  };
};

type Spark = { pos: Vec; r: number; white: number; squash: number; heading: number; visible: boolean };

/** Where the spark is and what it looks like at time t. */
const sparkAt = (t: number, P: Points): Spark => {
  const S = SPARK;
  const R = 11;
  const base = { r: R, white: 0, squash: 0, heading: 0, visible: true };
  if (t < S.birth) return { ...base, pos: SOUL_FINAL_SCREEN, visible: false };

  // landing squash after each touchdown
  let squash = 0;
  for (const land of [S.breakLand, S.line2Land, S.keepLand, S.line4Land]) {
    squash = Math.max(squash, Math.max(0, dampedSettle(t - land, 3.2, 9)));
  }

  if (t < S.breakLand) {
    // buds off the soul, then arcs down-left onto "Break"
    const bud = smooth(progress(t, S.birth, S.birth + 0.1));
    const p = inOutCubic(progress(t, S.birth + 0.06, S.breakLand));
    const from = { x: SOUL_FINAL_SCREEN.x - 22 * bud, y: SOUL_FINAL_SCREEN.y + 6 * bud };
    return { ...base, r: R * bud, pos: arc(from, P.breakLand, 170, p) };
  }
  if (t < S.line2Land) {
    return { ...base, squash, pos: arc(P.breakLand, P.line2Start, 70, outCubic(progress(t, S.breakLand + 0.04, S.line2Land))) };
  }
  if (t < S.line2End) {
    const p = inOutCubic(progress(t, S.line2Land, S.line2End));
    return { ...base, squash, heading: 1, pos: { x: lerp(P.line2Start.x, P.line2End.x, p), y: P.line2Start.y } };
  }
  if (t < S.keepLand) {
    return { ...base, pos: arc(P.line2End, P.keepLand, 130, inOutCubic(progress(t, S.line2End, S.keepLand))) };
  }
  if (t < S.line4Land) {
    return { ...base, squash, pos: arc(P.keepLand, P.line4Start, 70, outCubic(progress(t, S.keepLand + 0.04, S.line4Land))) };
  }
  if (t < S.line4End) {
    const p = inOutCubic(progress(t, S.line4Land, S.line4End));
    return { ...base, squash, heading: 1, pos: { x: lerp(P.line4Start.x, P.period.x, p), y: lerp(P.line4Start.y, P.period.y, p * p) } };
  }
  // comes to rest and cools into the full stop
  const s = smooth(progress(t, S.line4End, S.settle));
  return { ...base, squash, pos: P.period, r: lerp(R, P.periodR, s), white: s };
};

/** Glide position along a line for reveal purposes (x of the spark, or the end once past). */
const glideX = (t: number, P: Points, line: 1 | 3) => {
  const [start, end, a, b] =
    line === 1
      ? [P.line2Start.x, P.line2End.x, SPARK.line2Land, SPARK.line2End]
      : [P.line4Start.x, P.period.x, SPARK.line4Land, SPARK.line4End];
  if (t < a) return -Infinity;
  return lerp(start, end, inOutCubic(progress(t, a, b)));
};

const mixColor = (a: [number, number, number], b: [number, number, number], t: number) =>
  `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], t))).join(",")})`;

const ORANGE: [number, number, number] = [255, 106, 0];
const WHITE: [number, number, number] = [255, 255, 255];

export const Title: React.FC<{ t: number; orange: string; width: number; height: number }> = ({
  t,
  orange,
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

  const P = useMemo(() => (layout ? keyPoints(layout) : null), [layout]);
  // version 04: the soul inhales the words, nearest letter first
  const ranks = useMemo(() => {
    if (!layout || !P) return null;
    const soul = toScreenFinal(flightPos(T.inhale), T.inhale);
    const items: { key: string; d: number }[] = [];
    layout.lines.forEach((line, i) =>
      line.glyphs.forEach((g, j) => {
        const x = TEXT_LEFT + g.x + g.w / 2;
        const y = line.baseline - layout.size * 0.35;
        items.push({ key: `${i}-${j}`, d: Math.hypot(x - soul.x, y - soul.y) });
      }),
    );
    items.sort((a, b) => a.d - b.d);
    return new Map(items.map((it, k) => [it.key, k / (items.length - 1)]));
  }, [layout, P]);
  if (!layout || !P || !ranks || t < SPARK.birth - 0.05 || t > T.inhaleEnd + 0.05) return null;

  /** Pull a resting letter into the soul; null once it is gone. */
  const soulNow = toScreenFinal(flightPos(t), t);
  const inhale = (key: string, pos: Vec) => {
    if (t < T.inhale) return { pos, shrink: 1, heat: 0 };
    const t0 = lerp(T.inhale, T.inhaleEnd - 0.34, ranks.get(key) ?? 1);
    const p = progress(t, t0, t0 + 0.34);
    if (p >= 1) return null;
    const e = inQuad(p);
    const dx = soulNow.x - pos.x;
    const dy = soulNow.y - pos.y;
    const l = Math.hypot(dx, dy) || 1;
    // a slight swirl, so the letters spiral in rather than slide
    const swirl = 60 * Math.sin(Math.PI * p);
    const q = mix(pos, soulNow, e);
    return { pos: { x: q.x - (dy / l) * swirl, y: q.y + (dx / l) * swirl }, shrink: lerp(1, 0.08, e), heat: smooth(p) };
  };

  const spark = sparkAt(t, P);
  const impacts = [
    { line: 0, land: SPARK.breakLand, at: P.breakLand },
    { line: 2, land: SPARK.keepLand, at: P.keepLand },
  ];

  const letters: React.ReactNode[] = [];
  layout.lines.forEach((line, i) => {
    const def = LINES[i];
    const impact = impacts.find((m) => m.line === i);
    line.glyphs.forEach((g, j) => {
      if (i === 3 && j === line.glyphs.length - 1) return; // the spark becomes this full stop
      const slot = { x: TEXT_LEFT + g.x + g.w / 2, y: line.baseline - layout.size * 0.35 };
      let pos = slot;
      let scale = 1;
      let opacity = 1;
      let heat = 0;
      if (impact) {
        // letters burst out of the landing point, centre letters first
        const mid = (line.glyphs.length - 1) / 2;
        const t0 = impact.land + 0.018 * Math.abs(j - mid);
        const p = progress(t, t0, t0 + 0.32);
        if (p <= 0) return;
        const move = outCubic(p);
        pos = { x: lerp(impact.at.x, slot.x, move), y: lerp(impact.at.y, slot.y, move) };
        scale = lerp(0.15, 1, outBack(p, 2.2));
        opacity = clamp(p * 6);
        // the whole word breathes once after it lands
        scale *= 1 + 0.07 * dampedSettle(t - impact.land - 0.3, 2.6, 7);
      } else {
        const sx = glideX(t, P, i as 1 | 3);
        const left = TEXT_LEFT + g.x;
        const p = clamp((sx - left) / Math.max(g.w, 30));
        if (p <= 0) return;
        const e = outBack(p, 2);
        pos = { x: slot.x, y: slot.y + (1 - e) * layout.size * 0.22 };
        scale = lerp(0.55, 1, e);
        opacity = smooth(p);
        // freshly written letters glow orange, cooling to white behind the spark
        const end = i === 1 ? SPARK.line2End : SPARK.line4End;
        heat = 1 - Math.max(clamp((sx - (left + g.w)) / 260), progress(t, end, end + 0.4));
      }
      const sucked = inhale(`${i}-${j}`, pos);
      if (!sucked) return;
      pos = sucked.pos;
      scale *= sucked.shrink;
      heat = Math.max(heat, sucked.heat);
      const fill = def.orange ? orange : mixColor(WHITE, ORANGE, clamp(heat) * 0.9);
      const dy = layout.size * 0.35;
      letters.push(
        <text
          key={`${i}-${j}`}
          x={0}
          y={0}
          textAnchor="middle"
          fill={fill}
          opacity={opacity}
          transform={`translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)}) scale(${scale.toFixed(3)}) translate(0 ${dy.toFixed(1)})`}
        >
          {g.ch}
        </text>,
      );
    });
  });

  // orange shock ring where a verb lands
  const rings = impacts.map((m) => {
    const p = progress(t, m.land, m.land + 0.55);
    if (p <= 0 || p >= 1) return null;
    const e = outCubic(p);
    return (
      <circle
        key={m.line}
        cx={m.at.x}
        cy={m.at.y}
        r={30 + 300 * e}
        fill="none"
        stroke={orange}
        strokeWidth={6 * (1 - e) + 0.5}
        opacity={(1 - p) * 0.9}
      />
    );
  });

  // the full stop goes last of its line, the same way
  const lastLine = layout.lines.length - 1;
  const dotGone = inhale(`${lastLine}-${layout.lines[lastLine].glyphs.length - 1}`, spark.pos);
  if (dotGone) {
    spark.pos = dotGone.pos;
    spark.r *= dotGone.shrink;
    spark.white *= 1 - dotGone.heat;
  } else spark.visible = false;

  const sx = 1 + 0.6 * spark.squash;
  const sy = 1 - 0.38 * spark.squash;
  const sparkFill = mixColor(ORANGE, WHITE, spark.white);

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ position: "absolute", inset: 0 }}
    >
      <g style={{ fontFamily, fontWeight: WEIGHT, fontSize: layout.size }}>{letters}</g>
      {rings}
      {spark.visible && spark.r > 0.5 ? (
        <g transform={`translate(${spark.pos.x.toFixed(1)} ${spark.pos.y.toFixed(1)})`}>
          <circle r={spark.r * 3} fill={sparkFill} opacity={0.35 * (1 - spark.white)} filter="url(#spark-glow)" />
          <ellipse rx={spark.r * sx} ry={spark.r * sy} fill={sparkFill} />
        </g>
      ) : null}
      <defs>
        <filter id="spark-glow" x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
    </svg>
  );
};

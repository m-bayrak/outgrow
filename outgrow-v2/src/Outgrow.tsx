import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { LINE_COUNT, type LinePoint, buildLine, lineOpacity } from "./contours";
import { FLIGHT_START, SEED_POS, flightPoint, flightProgress } from "./ending";
import { type Vec, TAU, clamp, hash01, rotate } from "./math";
import { Title } from "./Title";
import {
  type Camera,
  camera,
  charge,
  finalTail,
  seedness,
  soulHeading,
  soulPos,
  soulRadius,
  soulVel,
  tailAmount,
} from "./timeline";

export type OutgrowProps = {
  readonly orange: string;
  readonly white: string;
  readonly lineWidth: number;
};

const toScreen = (p: Vec, cam: Camera, w: number, h: number): Vec => {
  const r = rotate({ x: p.x - cam.center.x, y: p.y - cam.center.y }, cam.rot);
  return { x: r.x * cam.zoom + w / 2 + cam.shake.x, y: r.y * cam.zoom + h / 2 + cam.shake.y };
};

const f1 = (n: number) => n.toFixed(1);

/** Closed polyline as an SVG path. */
const closedPath = (pts: Vec[]) => {
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i = 1; i < pts.length; i++) d += `L${f1(pts[i].x)} ${f1(pts[i].y)}`;
  return d + "Z";
};

/** Orange overlay runs along a line, grouped by quantised intensity. */
const orangeRuns = (pts: (Vec & { orange: number })[]) => {
  const levels = 6;
  const runs: { d: string; level: number }[] = [];
  const n = pts.length;
  let cur: { pts: Vec[]; level: number } | null = null;
  for (let k = 0; k <= n; k++) {
    const p = pts[k % n];
    const level = Math.round(p.orange * levels);
    if (cur && (level !== cur.level || k === n)) {
      cur.pts.push(p);
      if (cur.level > 0 && cur.pts.length > 1) {
        runs.push({
          d: cur.pts.map((q, j) => `${j ? "L" : "M"}${f1(q.x)} ${f1(q.y)}`).join(""),
          level: cur.level / levels,
        });
      }
      cur = null;
    }
    if (!cur && k < n) cur = { pts: [p], level };
    else if (cur) cur.pts.push(p);
  }
  return runs;
};

export const Outgrow: React.FC<OutgrowProps> = ({ orange, white, lineWidth }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const t = frame / fps;

  const scene = useMemo(() => {
    const cam = camera(t);
    const S = (p: Vec) => toScreen(p, cam, width, height);

    const lines = Array.from({ length: LINE_COUNT }, (_, i) => {
      const pts = buildLine(i, t).map((p: LinePoint) => ({ ...S(p), orange: p.orange }));
      return { d: closedPath(pts), runs: orangeRuns(pts), opacity: lineOpacity(i, t) };
    });

    // soul body: stretched along its velocity, settling into an upright seed
    const pos = soulPos(t);
    const vel = soulVel(t);
    const speed = Math.hypot(vel.x, vel.y);
    const seed = seedness(t);
    // in flight the seed may stretch again; at rest it keeps its seed shape
    const stretchable = t >= FLIGHT_START ? 0.7 : 1 - seed;
    const stretch = 1 + Math.min(1.5, speed / 1400) * stretchable;
    const heading = soulHeading(t, vel);
    const radius = soulRadius(t) * cam.zoom;
    const soul = {
      ...S(pos),
      rx: radius * (stretch * (1 - seed) + stretch * seed),
      ry: radius * ((1 / Math.sqrt(stretch)) * (1 - seed) + (0.62 / Math.sqrt(stretch)) * seed),
      angle: (heading + cam.rot) * (180 / Math.PI),
      seed,
    };

    // tail: the soul's own recent past, tapering and fading
    const amount = tailAmount(t);
    const tailSteps = Math.round(3 + 14 * amount * clamp(speed / 900));
    const tailPts: Vec[] = [];
    for (let k = 0; k <= tailSteps; k++) tailPts.push(S(soulPos(t - k / fps)));
    const tail = taperedPolygon(tailPts, radius * 0.4);

    // thin energy rays while the soul gathers itself
    const c = charge(t);
    const rays = Array.from({ length: 9 }, (_, k) => {
      const a = TAU * hash01(k * 7 + 3) + t * (0.6 + hash01(k) * 0.6);
      const flick = 0.5 + 0.5 * Math.sin(t * 38 + k * 2.1);
      const len = (radius * 1.4 + (40 + 70 * hash01(k + 40)) * cam.zoom) * c;
      const start = radius * 1.25;
      return {
        x1: soul.x + Math.cos(a) * start,
        y1: soul.y + Math.sin(a) * start,
        x2: soul.x + Math.cos(a) * (start + len),
        y2: soul.y + Math.sin(a) * (start + len),
        o: c * flick,
      };
    });

    // final: a fine vertical tail drawn down from the seed
    const ft = finalTail(t);
    const anchor = t >= FLIGHT_START ? SEED_POS : pos;
    const tailTop = S({ x: anchor.x, y: anchor.y + soulRadius(Math.min(t, FLIGHT_START)) * 0.9 });
    const tailBottom = S({ x: anchor.x, y: anchor.y + soulRadius(Math.min(t, FLIGHT_START)) + 2400 * ft });

    // the trace of freedom: the flight leaves a fine orange line behind it
    const fp = t >= FLIGHT_START ? flightProgress(t) : 0;
    const trail: Vec[] = [];
    if (fp > 0) {
      const n = Math.max(2, Math.ceil(160 * fp));
      for (let k = 0; k <= n; k++) trail.push(S(flightPoint((k / n) * fp)));
    }
    const trailD = trail.length ? trail.map((p, k) => `${k ? "L" : "M"}${f1(p.x)} ${f1(p.y)}`).join("") : "";

    return { lines, soul, tail, rays, ft, tailTop, tailBottom, trailD };
  }, [t, width, height, fps]);

  const { lines, soul, tail, rays, ft, tailTop, tailBottom, trailD } = scene;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <defs>
          <filter id="glow" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" />
          </filter>
        </defs>

        <g fill="none" strokeLinejoin="round" strokeLinecap="round">
          {lines.map((l, i) => (
            <path key={i} d={l.d} stroke={white} strokeWidth={lineWidth} opacity={l.opacity} />
          ))}
          {/* orange heat travelling through the lines: a soft halo plus a crisp core */}
          {lines.map((l, i) =>
            l.runs.map((r, j) => (
              <path
                key={`h${i}-${j}`}
                d={r.d}
                stroke={orange}
                strokeWidth={lineWidth * 4}
                opacity={r.level * 0.35}
                filter="url(#soft)"
              />
            )),
          )}
          {lines.map((l, i) =>
            l.runs.map((r, j) => (
              <path key={`o${i}-${j}`} d={r.d} stroke={orange} strokeWidth={lineWidth * 1.15} opacity={r.level} />
            )),
          )}
        </g>

        {ft > 0 ? (
          <line
            x1={tailTop.x}
            y1={tailTop.y}
            x2={tailBottom.x}
            y2={tailBottom.y}
            stroke={orange}
            strokeWidth={lineWidth * 1.3}
            strokeLinecap="round"
          />
        ) : null}

        {trailD ? (
          <path d={trailD} fill="none" stroke={orange} strokeWidth={lineWidth} strokeLinecap="round" strokeLinejoin="round" />
        ) : null}

        {tail ? <path d={tail} fill={orange} opacity={0.85 * (1 - soul.seed)} /> : null}

        {rays.map((r, k) =>
          r.o > 0.01 ? (
            <line key={k} {...pick(r)} stroke={orange} strokeWidth={1.4} opacity={r.o} strokeLinecap="round" />
          ) : null,
        )}

        <g transform={`translate(${f1(soul.x)} ${f1(soul.y)}) rotate(${f1(soul.angle)})`}>
          <ellipse rx={soul.rx * 2.2} ry={soul.ry * 2.2} fill={orange} opacity={0.45} filter="url(#glow)" />
          <path d={soulShape(soul.rx, soul.ry, soul.seed)} fill={orange} />
        </g>
      </svg>
      <Title t={t} orange={orange} width={width} height={height} />
    </AbsoluteFill>
  );
};

const pick = (r: { x1: number; y1: number; x2: number; y2: number }) => ({
  x1: r.x1,
  y1: r.y1,
  x2: r.x2,
  y2: r.y2,
});

/**
 * Soul outline in local space (x along the heading). A round body that
 * sharpens into a teardrop seed: blunt end leading, point trailing.
 */
const soulShape = (rx: number, ry: number, seed: number) => {
  const n = 48;
  let d = "";
  for (let k = 0; k <= n; k++) {
    const a = (k / n) * TAU;
    // pinch the trailing side into a point as the soul becomes a seed
    const back = Math.max(0, -Math.cos(a));
    const pinch = 1 - seed * 0.75 * Math.pow(back, 1.6);
    const x = Math.cos(a) * rx * (1 + seed * 0.25 * back);
    const y = Math.sin(a) * ry * pinch;
    d += `${k ? "L" : "M"}${f1(x)} ${f1(y)}`;
  }
  return d + "Z";
};

/** Filled tail polygon: full width at the soul, tapering to nothing. */
const taperedPolygon = (pts: Vec[], width: number) => {
  if (pts.length < 3) return null;
  const left: Vec[] = [];
  const right: Vec[] = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[Math.max(0, k - 1)];
    const b = pts[Math.min(pts.length - 1, k + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const len = Math.hypot(dx, dy) || 1;
    const w = width * Math.pow(1 - k / (pts.length - 1), 1.4);
    left.push({ x: pts[k].x - (dy / len) * w, y: pts[k].y + (dx / len) * w });
    right.push({ x: pts[k].x + (dy / len) * w, y: pts[k].y - (dx / len) * w });
  }
  const ring = [...left, ...right.reverse()];
  return ring.map((p, j) => `${j ? "L" : "M"}${f1(p.x)} ${f1(p.y)}`).join("") + "Z";
};

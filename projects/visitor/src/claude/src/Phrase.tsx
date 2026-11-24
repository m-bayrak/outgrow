// "A thought is a visitor." written by a spark that leaves the resting soul and
// ends as the full stop.

import { loadFont } from "@remotion/google-fonts/InterTight";
import { measureText } from "@remotion/layout-utils";
import { useEffect, useMemo, useState } from "react";
import { continueRender, delayRender } from "remotion";
import { PX, spline, toPath, v } from "./curves";
import { SPARK } from "./timeline";
import {
  type Vec,
  clamp,
  inOutCubic,
  lerp,
  outCubic,
  progress,
  smooth,
} from "./math";

const { fontFamily, waitUntilDone } = loadFont("normal", {
  weights: ["800"],
  subsets: ["latin"],
});
const ORANGE = "#ff6a00";
const SIZE = 132;
const SPACING = "-0.018em";
const X = 76;
const LINES = [
  { text: "A thought", y: 268 },
  { text: "is a visitor", y: 406 },
];
const T = SPARK;
const DOT = 13;

const layout = () => {
  const width = (s: string) =>
    s
      ? measureText({
          text: s,
          fontFamily,
          fontSize: SIZE,
          fontWeight: 800,
          letterSpacing: SPACING,
        }).width
      : 0;
  return LINES.map((l) =>
    Array.from({ length: l.text.length + 1 }, (_, i) =>
      width(l.text.slice(0, i).replace(/ /g, " ")),
    ),
  );
};
type Layout = ReturnType<typeof layout>;

const sparkAt = (t: number, L: Layout, from: Vec & { r: number }): Vec => {
  const start = v(from.x, from.y - from.r + 4);
  const w1 = L[0][L[0].length - 1];
  const w2 = L[1][L[1].length - 1];
  const bob = (x: number) => Math.sin(x / 26) * 9;
  if (t <= T.line1) {
    const u = progress(t, T.leave, T.line1);
    return spline(
      [
        start,
        v(592, 1040),
        v(560, 760),
        v(330, 470),
        v(110, 320),
        v(X - 8, 226),
      ],
      inOutCubic(u),
    );
  }
  if (t <= T.end1) {
    const x = lerp(X - 8, X + w1 + 14, progress(t, T.line1, T.end1));
    return v(x, 226 + bob(x - X + 8));
  }
  const a = v(X + w1 + 14, 226 + bob(w1 + 22));
  if (t <= T.line2)
    return spline(
      [
        a,
        v(X + w1 + 50, 285),
        v(X + w1 * 0.6, 318),
        v(X + 60, 312),
        v(X - 8, 364),
      ],
      smooth(progress(t, T.end1, T.line2)),
    );
  if (t <= T.end2) {
    const x = lerp(X - 8, X + w2 + 16, progress(t, T.line2, T.end2));
    return v(x, 364 + bob(x - X + 8));
  }
  const b = v(X + w2 + 16, 364 + bob(w2 + 24));
  const u = progress(t, T.end2, T.stop);
  const dot = v(X + w2 + 10 + DOT, 406 - DOT);
  return v(
    lerp(b.x, dot.x, smooth(u)),
    lerp(b.y, dot.y, u * u) - Math.sin(Math.PI * u) * 34,
  );
};

export const Phrase: React.FC<{ t: number; from: Vec & { r: number } }> = ({
  t,
  from,
}) => {
  const [handle] = useState(() => delayRender("Loading Inter Tight"));
  const [ready, setReady] = useState(false);
  useEffect(() => {
    waitUntilDone().then(() => {
      setReady(true);
      continueRender(handle);
    });
  }, [handle]);
  const L = useMemo(() => (ready ? layout() : null), [ready]);
  if (!L || t < T.leave) return null;

  const p = sparkAt(t, L, from);
  const resting = progress(t, T.end2, T.stop);
  const trail = Array.from({ length: 37 }, (_, k) =>
    sparkAt(Math.max(T.leave, t - k / 240), L, from),
  );
  const r = lerp(
    lerp(3, 7.5, smooth(progress(t, T.leave, T.leave + 0.2))),
    DOT,
    outCubic(resting),
  );
  return (
    <g>
      <defs>
        <radialGradient id="spark">
          <stop offset="0" stopColor={ORANGE} stopOpacity={0.7} />
          <stop offset="0.45" stopColor={ORANGE} stopOpacity={0.22} />
          <stop offset="1" stopColor={ORANGE} stopOpacity={0} />
        </radialGradient>
      </defs>
      <g
        style={{
          fontFamily,
          fontWeight: 800,
          fontSize: SIZE,
          letterSpacing: SPACING,
          whiteSpace: "pre",
        }}
      >
        {LINES.map((line, n) => {
          const [a, b] = n ? [T.line2, T.end2] : [T.line1, T.end1];
          const total = L[n][L[n].length - 1];
          return (
            <text key={n} x={X} y={line.y}>
              {[...line.text].map((c, i) => {
                const born = lerp(
                  a,
                  b,
                  (L[n][i] + L[n][i + 1]) / 2 / (total + 20),
                );
                const on = progress(t, born, born + 0.07);
                const cool = smooth(progress(t, born + 0.12, born + 0.75));
                const keep = n === 1 && i >= 5;
                const fill = keep
                  ? ORANGE
                  : `rgb(255, ${Math.round(lerp(106, 255, cool))}, ${Math.round(lerp(0, 255, cool))})`;
                return (
                  <tspan key={i} fill={fill} fillOpacity={on}>
                    {c}
                  </tspan>
                );
              })}
            </text>
          );
        })}
      </g>
      {trail.slice(1).map((q, k) => (
        <path
          key={k}
          d={toPath([trail[k], q])}
          stroke={ORANGE}
          strokeLinecap="round"
          strokeWidth={lerp(6, 1.5, k / 36) * PX}
          strokeOpacity={0.8 * Math.pow(1 - k / 36, 1.5) * (1 - resting)}
        />
      ))}
      <circle
        cx={p.x}
        cy={p.y}
        r={r * 4}
        fill="url(#spark)"
        opacity={lerp(1, 0.25, clamp(resting))}
      />
      <circle cx={p.x} cy={p.y} r={r} fill={ORANGE} />
    </g>
  );
};

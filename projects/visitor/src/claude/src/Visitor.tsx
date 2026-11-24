import { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { H, PX, toPath, W } from "./curves";
import { type Vec, clamp, lerp, smooth } from "./math";
import { groundY } from "./house";
import { KEY_LENGTH, type Key, type Scene, scene } from "./scene";
import { Phrase } from "./Phrase";
import { LINES } from "./soulLines";
import { type Camera, film } from "./timeline";

const ORANGE = "#ff6a00";
const WHITE = "#ffffff";
const THIN = 2.2 * PX;
const THOUGHT = 3.1 * PX;

/** A polyline whose opacity changes along the way, in short butt-ended runs. */
const Faded: React.FC<{
  pts: Vec[];
  alpha: (i: number) => number;
  color: string;
  width: number;
  run?: number;
}> = ({ pts, alpha, color, width, run = 3 }) => {
  const parts: React.ReactNode[] = [];
  for (let i = 0; i < pts.length - 1; i += run) {
    const end = Math.min(pts.length - 1, i + run);
    const a = alpha(Math.min(pts.length - 1, i + run / 2));
    if (a > 0.015)
      parts.push(
        <path
          key={i}
          d={toPath(pts.slice(i, end + 1))}
          stroke={color}
          strokeWidth={width}
          strokeOpacity={Math.min(1, a).toFixed(3)}
          fill="none"
        />,
      );
  }
  return <>{parts}</>;
};

const along = (list: number[]) => (i: number) => list[Math.round(i)];

/** One unbroken stroke that can thin into a tendril at its end. */
const Thought: React.FC<{ pts: Vec[]; tip: number; z: number }> = ({
  pts,
  tip,
  z,
}) => {
  const cut = Math.round((pts.length - 1) * (1 - tip));
  const rest = pts.length - 1 - cut;
  const tail: React.ReactNode[] = [];
  for (let i = cut; i < pts.length - 1; i += 2) {
    const t = smooth(clamp((i - cut) / Math.max(1, rest * 0.6)));
    tail.push(
      <path
        key={i}
        d={toPath(pts.slice(i, Math.min(pts.length, i + 3)))}
        strokeWidth={lerp(THOUGHT, 2 * PX, t) / z}
      />,
    );
  }
  return (
    <g stroke={WHITE} fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={toPath(pts.slice(0, cut + 1))} strokeWidth={THOUGHT / z} />
      {tail}
    </g>
  );
};

const KeyShape: React.FC<{ k: Key; z: number }> = ({ k, z }) => {
  const R = 10;
  const L = KEY_LENGTH - R;
  const side = Math.max(-1, Math.min(1, Math.cos(k.angle) * 5)); // the teeth always hang down
  return (
    <g
      transform={`translate(${k.ring.x} ${k.ring.y}) rotate(${(k.angle * 180) / Math.PI}) scale(${k.scale ?? 1})`}
      stroke={ORANGE}
      strokeWidth={(2.6 * PX) / z / (k.scale ?? 1)}
      fill="none"
      strokeLinejoin="round"
      strokeLinecap="round"
    >
      <circle r={R} />
      <path
        d={`M${R} 0H${L}v${9.5 * side}h-5V0M${L - 10} 0v${7.5 * side}h-5V0`}
      />
    </g>
  );
};

/** The seven key frames. */
export const Visitor: React.FC = () => {
  const frame = useCurrentFrame();
  const s = useMemo(() => scene(frame), [frame]);
  return <Stage s={s} write={s.phrase ? DONE : 0} />;
};

/** The film. */
export const VisitorFilm: React.FC = () => {
  const t = useCurrentFrame() / 60;
  const shot = useMemo(() => film(t), [t]);
  return <Stage s={shot.scene} camera={shot.camera} write={t} />;
};

const DONE = 99;

const Stage: React.FC<{ s: Scene; camera?: Camera; write: number }> = ({
  s,
  camera = { x: W / 2, y: H / 2, zoom: 1, shakeX: 0, shakeY: 0 },
  write,
}) => {
  const { house: h, soul, lines } = s;
  const ground = useMemo(
    () =>
      Array.from({ length: 241 }, (_, i) => ({
        x: 20 + (i / 240) * 902,
        y: groundY(20 + (i / 240) * 902, s.ripple),
      })),
    [s],
  );
  const edges = [
    h.backLeft,
    h.frontLeft,
    h.eave,
    h.roofBack,
    h.ridge,
    h.roofFront,
    h.roofRight,
    h.doorTop,
    h.doorInner,
    h.doorOuter,
    h.doorBottom,
    h.floor,
  ];
  const p = soul.power;
  const glow =
    soul.r * (lerp(3.4, 2.15, clamp(p)) + 1.6 * Math.max(0, p - 1.2));
  const kh = h.keyhole;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%">
        <defs>
          <radialGradient id="glow">
            <stop offset="0" stopColor={ORANGE} stopOpacity={0.8} />
            <stop offset="0.38" stopColor={ORANGE} stopOpacity={0.5} />
            <stop offset="0.6" stopColor={ORANGE} stopOpacity={0.2} />
            <stop offset="1" stopColor={ORANGE} stopOpacity={0} />
          </radialGradient>
        </defs>

        <g
          transform={`translate(${camera.x + camera.shakeX} ${camera.y + camera.shakeY}) scale(${camera.zoom}) translate(${-camera.x} ${-camera.y})`}
        >
          {[...s.waves, ...s.ripples].map((w, k) => (
            <Faded
              key={k}
              pts={w.pts}
              alpha={along(w.alpha)}
              color={WHITE}
              width={(1.9 * PX) / camera.zoom}
            />
          ))}

          <circle
            cx={soul.x}
            cy={soul.y}
            r={glow}
            fill="url(#glow)"
            opacity={clamp(p * 0.85)}
          />
          {lines.pts.map((l, k) => {
            const tone = lerp(0.95, 0.5, k / LINES) * lerp(0.75, 1, clamp(p));
            return (
              <Faded
                key={k}
                pts={l}
                color={ORANGE}
                width={(1.9 * PX) / camera.zoom}
                run={2}
                alpha={(i) => {
                  const u = i / (l.length - 1);
                  const a = lines.fadeIn ? smooth(clamp(u / lines.fadeIn)) : 1;
                  const b = lines.fadeOut
                    ? smooth(clamp((1 - u) / lines.fadeOut))
                    : 1;
                  return tone * a * b;
                }}
              />
            );
          })}

          <g
            stroke={WHITE}
            strokeWidth={THIN / camera.zoom}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            {edges.map((e, k) => (
              <path key={k} d={toPath(e)} />
            ))}
            <ellipse cx={kh.x} cy={kh.y} rx={5} ry={9} />
          </g>
          <Faded
            pts={ground}
            color={WHITE}
            width={THIN / camera.zoom}
            alpha={(i) => smooth(clamp(Math.min(i, 240 - i) / 26))}
          />

          <circle cx={soul.x} cy={soul.y} r={soul.r} fill={ORANGE} />
          {s.key ? <KeyShape k={s.key} z={camera.zoom} /> : null}
          {(s.guests ?? [{ pts: s.thought, tip: s.tip }]).map((g, k) => (
            <Thought key={k} pts={g.pts} tip={g.tip} z={camera.zoom} />
          ))}
        </g>
        <Phrase t={write} from={soul} />
      </svg>
    </AbsoluteFill>
  );
};

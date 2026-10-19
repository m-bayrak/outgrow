import {AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig} from 'remotion';
import {cameraAt, clamp, contour, impacts, mix, orangeFragments, pathOf, pulse, seedAt, smooth} from './motion';

export type SoulProps = {
  orange: string;
  lineCount: number;
  intensity: number;
  cameraMotion: number;
  showTrails: boolean;
};

const Contours = ({t, orange, lineCount, intensity}: SoulProps & {t: number}) => {
  const count = Math.round(clamp(lineCount, 12, 48));
  return <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    {Array.from({length: count}, (_, i) => {
      const points = contour(t, i, count, intensity);
      const highlight = orangeFragments(points, t, i, count);
      return <g key={i}>
        <path d={pathOf(points)} stroke="#fff" strokeWidth={1.7} opacity={0.83 + 0.13 * i / count}/>
        {highlight.d && <>
          <path d={highlight.d} stroke={orange} strokeWidth={5.5} opacity={highlight.opacity * 0.15} filter="url(#contact-glow)"/>
          <path d={highlight.d} stroke={orange} strokeWidth={2.5} opacity={highlight.opacity}/>
        </>}
      </g>;
    })}
  </g>;
};

const Energy = ({t, orange}: {t: number; orange: string}) => <g fill="none" stroke={orange}>
  {impacts.map((at, i) => {
    const age = t - at;
    if (age <= 0 || age > 1.45) return null;
    const point = seedAt(at);
    return <ellipse key={at} cx={point.x} cy={point.y} rx={12 + age * 320} ry={12 + age * 320}
      strokeWidth={mix(1.8, 0.5, age / 1.45)} opacity={Math.pow(1 - age / 1.45, 2) * (i > 7 ? 0.3 : 0.18)}/>;
  })}
</g>;

const Seed = ({t, orange, showTrails}: {t: number; orange: string; showTrails: boolean}) => {
  const seed = seedAt(t);
  const previous = seedAt(t - 0.025);
  const speed = Math.hypot(seed.x - previous.x, seed.y - previous.y) / 0.025;
  const ending = smooth(18.6, 21, t);
  const r = 13 + smooth(0.5, 7, t) * 3 + pulse(t) * 3 + ending * 5;
  const stretch = clamp(speed / 2300, 0, 0.65);
  const angle = Math.atan2(seed.y - previous.y, seed.x - previous.x) * 180 / Math.PI;
  const duration = 0.16 + clamp(speed / 1200) * 0.27;
  const trail = Array.from({length: 56}, (_, i) => seedAt(t - i / 55 * duration));
  const tail = smooth(17.4, 20.4, t);
  return <g>
    {showTrails && <g fill="none" strokeLinecap="round">
      {trail.slice(1).map((point, i) => <path key={i} d={pathOf([trail[i], point])}
        stroke={orange} strokeWidth={mix(r * 1.3, 0.2, i / 55)}
        opacity={Math.pow(1 - i / 55, 2) * clamp(speed / 250) * (1 - tail) * 0.8}/>)}
    </g>}
    {tail > 0 && <path d={`M${seed.x},${seed.y + 8} C0,10 3,240 0,${mix(180, 770, tail)}`}
      stroke={orange} strokeWidth={mix(3, 1.5, tail)} fill="none" opacity={tail * 0.92}/>}
    <circle cx={seed.x} cy={seed.y} r={r * 2.1} fill={orange} opacity={0.08 + pulse(t) * 0.09} filter="url(#seed-glow)"/>
    {ending < 1 && <ellipse cx={seed.x} cy={seed.y} rx={r * (1 + stretch)} ry={r * (1 - stretch * 0.4)}
      transform={`rotate(${angle} ${seed.x} ${seed.y})`} fill={orange} opacity={1 - ending}/>}
    {ending > 0 && <path d={`M0,${seed.y - 33} C-45,${seed.y - 5} -30,${seed.y + 31} 0,${seed.y + 68} C30,${seed.y + 31} 45,${seed.y - 5} 0,${seed.y - 33} Z`}
      fill={orange} opacity={ending}/>}
  </g>;
};

export const SoulEscape = (props: SoulProps) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const t = frame / fps;
  const camera = cameraAt(t, props.cameraMotion);
  return <AbsoluteFill style={{backgroundColor: '#000'}}>
    <svg width="100%" height="100%" viewBox="0 0 1080 1920" role="img" aria-label="An orange soul transforms concentric white circles into wings">
      <defs>
        <filter id="seed-glow" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="17"/></filter>
        <filter id="contact-glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4"/></filter>
      </defs>
      <g transform={`translate(${540 + camera.x},${930 + camera.y}) scale(${camera.scale}) rotate(${camera.angle})`}>
        <Sequence
          name="Оболонка · пружний опір і перетворення"
          layout="none"
          durationInFrames={1500}
        >
          <Contours {...props} t={t}/>
        </Sequence>
        <Sequence name="Енергія · хвилі від дотику" layout="none" durationInFrames={25 * fps}>
          <Energy t={t} orange={props.orange}/>
        </Sequence>
        <Sequence name="Душа · траєкторія та хвіст" layout="none" durationInFrames={25 * fps}>
          <Seed t={t} orange={props.orange} showTrails={props.showTrails}/>
        </Sequence>
      </g>
    </svg>
  </AbsoluteFill>;
};

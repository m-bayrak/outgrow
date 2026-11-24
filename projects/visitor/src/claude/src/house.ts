// The house. One set of edges, each a short control polygon, in three states:
// calm, spring and wheel. Any state is calm + weights * (state - calm), so the
// house can bounce (spring weight below zero too) and roll back without a cut.

import { type Vec, lerp, mix } from "./math";
import { sample, soften, spline, v, wobble } from "./curves";

export const FLOOR = 1373;
export const GAP = 27; // under the door
const N = 49;

export type HouseWeights = { spring: number; wheel: number };
/** Ground ripple: amplitude inside the house and outside it. */
export type Ripple = {
  inside: number;
  outside: number;
  phase: number;
  tempo: number;
  /** The waves exist only right of this x: the ground is flat up to the porch. */
  from?: number;
};

export const groundY = (x: number, r: Ripple) => {
  const s = (a: number, b: number) => 1 / (1 + Math.exp(-((x - a) / b) * 4));
  const inside =
    r.from === undefined
      ? s(80, 24) * (1 - s(672, 24))
      : 1 - s(r.from + 14, 28);
  const amp = lerp(r.outside, r.inside, inside);
  const w =
    Math.sin((x / 330) * r.tempo * Math.PI + r.phase) * 0.8 +
    wobble((x / 700) * r.tempo + r.phase * 0.05, 5) * 0.4;
  return FLOOR + amp * w;
};

const EDGES = [
  "backLeft",
  "frontLeft",
  "eave",
  "roofBack",
  "ridge",
  "roofFront",
  "roofRight",
  "doorTop",
  "doorInner",
  "doorOuter",
  "doorBottom",
  "floor",
] as const;
type EdgeName = (typeof EDGES)[number];
type Shape = Record<EdgeName, Vec[]>;

const calm: Shape = {
  backLeft: [v(81, 988), v(81, FLOOR)],
  frontLeft: [v(160, 990), v(160, FLOOR)],
  eave: [v(81, 988), v(160, 990)],
  roofBack: [v(81, 988), v(328, 775)],
  ridge: [v(328, 775), v(448, 754)],
  roofFront: [v(160, 990), v(448, 754)],
  roofRight: [v(448, 754), v(666, 974)],
  doorTop: [v(622, 1015), v(666, 974)],
  doorInner: [v(622, 1015), v(622, FLOOR - GAP)],
  doorOuter: [v(666, 974), v(666, FLOOR - GAP - 5)],
  doorBottom: [v(622, FLOOR - GAP), v(666, FLOOR - GAP - 5)],
  floor: [v(81, FLOOR), v(666, FLOOR)],
};

const spring: Shape = {
  backLeft: [
    v(94, 961),
    v(86, 1015),
    v(102, 1090),
    v(122, 1165),
    v(112, 1240),
    v(96, 1305),
    v(92, FLOOR),
  ],
  frontLeft: [
    v(178, 962),
    v(152, 1005),
    v(148, 1055),
    v(164, 1120),
    v(179, 1190),
    v(177, 1255),
    v(168, 1315),
    v(166, FLOOR),
  ],
  eave: [v(94, 961), v(178, 962)],
  roofBack: [
    v(94, 961),
    v(120, 912),
    v(172, 866),
    v(238, 824),
    v(282, 772),
    v(318, 722),
    v(366, 700),
  ],
  ridge: [v(366, 700), v(402, 692), v(440, 696)],
  roofFront: [
    v(178, 962),
    v(218, 922),
    v(288, 876),
    v(338, 822),
    v(374, 762),
    v(404, 720),
    v(440, 696),
  ],
  roofRight: [
    v(440, 696),
    v(476, 748),
    v(508, 806),
    v(548, 852),
    v(598, 884),
    v(644, 916),
    v(667, 962),
  ],
  doorTop: [v(606, 1006), v(632, 984), v(667, 962)],
  doorInner: [
    v(606, 1006),
    v(586, 1050),
    v(578, 1105),
    v(583, 1170),
    v(592, 1235),
    v(597, 1295),
    v(596, FLOOR - GAP),
  ],
  doorOuter: [
    v(667, 962),
    v(657, 1005),
    v(644, 1060),
    v(639, 1120),
    v(641, 1200),
    v(645, 1270),
    v(645, FLOOR - GAP - 5),
  ],
  doorBottom: [v(596, FLOOR - GAP), v(645, FLOOR - GAP - 5)],
  floor: [v(92, FLOOR), v(645, FLOOR)],
};

const wheel: Shape = {
  backLeft: [
    v(128, 950),
    v(92, 1030),
    v(76, 1120),
    v(80, 1210),
    v(106, 1285),
    v(152, 1336),
  ],
  frontLeft: [
    v(214, 978),
    v(178, 1050),
    v(158, 1130),
    v(155, 1210),
    v(166, 1285),
    v(190, 1354),
  ],
  eave: [v(128, 950), v(214, 978)],
  roofBack: [v(128, 950), v(196, 886), v(286, 836), v(374, 802), v(456, 782)],
  ridge: [v(456, 782), v(518, 768), v(574, 772)],
  roofFront: [v(214, 978), v(304, 920), v(396, 862), v(488, 808), v(574, 772)],
  roofRight: [v(574, 772), v(616, 832), v(648, 906), v(678, 990)],
  doorTop: [v(614, 1030), v(648, 1012), v(678, 990)],
  doorInner: [
    v(614, 1030),
    v(590, 1080),
    v(570, 1140),
    v(552, 1205),
    v(532, 1268),
    v(502, 1325),
  ],
  doorOuter: [
    v(678, 990),
    v(660, 1045),
    v(643, 1105),
    v(628, 1170),
    v(610, 1235),
    v(580, 1298),
  ],
  doorBottom: [v(502, 1325), v(545, 1316), v(580, 1298)],
  floor: [
    v(152, 1336),
    v(190, 1354),
    v(260, 1370),
    v(345, 1373),
    v(430, 1370),
    v(500, 1356),
    v(545, 1338),
    v(584, 1312),
  ],
};

export type House = Record<EdgeName, Vec[]> & { keyhole: Vec };

export const house = (w: HouseWeights, r: Ripple): House => {
  const out = {} as House;
  const stuck = 1 - Math.min(1, Math.abs(w.wheel)); // how far the walls still follow the ground line
  for (const e of EDGES) {
    const a = sample(calm[e], N);
    const b = soften(sample(spring[e], N), 2.6);
    const c = soften(sample(wheel[e], N), 2.2);
    out[e] = a.map((p, i) => ({
      x: p.x + w.spring * (b[i].x - p.x) + w.wheel * (c[i].x - p.x),
      y: p.y + w.spring * (b[i].y - p.y) + w.wheel * (c[i].y - p.y),
    }));
    if (e === "backLeft" || e === "frontLeft" || e === "floor") {
      out[e] = out[e].map((p, i) => {
        const t = e === "floor" ? 1 : Math.max(0, (i / (N - 1) - 0.9) / 0.1);
        return { x: p.x, y: p.y + stuck * t * (groundY(p.x, r) - FLOOR) };
      });
    }
  }
  out.keyhole = mix(
    spline(out.doorInner, 0.45),
    spline(out.doorOuter, 0.48),
    0.56,
  );
  return out;
};

/** Outer silhouette, from the left foot over the roof to the door's outer foot. */
export const silhouette = (h: House): Vec[] => [
  ...[...h.backLeft].reverse(),
  ...h.roofBack,
  ...h.ridge,
  ...h.roofRight,
  ...h.doorOuter,
];

// The seven key frames as scene states. A timeline can later blend the same
// parameters; nothing here depends on anything but the frame.

import { type Vec } from "./math";
import { v } from "./curves";
import {
  FLOOR,
  type House,
  type HouseWeights,
  type Ripple,
  groundY,
  house,
} from "./house";
import {
  type Gesture,
  arm,
  bed,
  cradle,
  curledArm,
  ribbon,
  swept,
} from "./soulLines";
import { springThought, tangleThought, wheelThought } from "./thought";
import { type WaveLine, type WaveState, knock, surf, waves } from "./waves";

export const KEY_LENGTH = 104;

export type Key = { ring: Vec; angle: number };
export type Scene = {
  house: House;
  ripple: Ripple;
  soul: Vec & { r: number; power: number };
  lines: Gesture;
  thought: Vec[];
  tip: number; // share of the thought, at its end, that thins into a tendril
  key: Key | null;
  waves: WaveLine[];
  ripples: WaveLine[];
  phrase: boolean;
};

const STILL: HouseWeights = { spring: 0, wheel: 0 };
const ground = (
  inside: number,
  outside: number,
  phase = 0.6,
  tempo = 1.5,
): Ripple => ({ inside, outside, phase, tempo });
const guest = { x: 800, y: 1190, rx: 120, ry: 190 };
const noWave: WaveState = {
  amount: 0,
  bounce: 0,
  swirl: 0,
  below: 0,
  phase: 0,
  guest,
};
const base = { tip: 0.04, key: null, waves: [], ripples: [], phrase: false };
/** The key lies just above the floor. */
const onFloor = FLOOR - 12;
/** A key whose teeth sit in the keyhole, its ring at `angle` from it. */
const inKeyhole = (h: House, angle: number): Key => ({
  ring: v(
    h.keyhole.x + Math.cos(angle) * KEY_LENGTH,
    h.keyhole.y + Math.sin(angle) * KEY_LENGTH,
  ),
  angle: angle + Math.PI,
});

const frames: (() => Scene)[] = [
  // 1 — the knock
  () => {
    const r = ground(3, 4);
    const soul = { ...v(286, 1238), r: 46, power: 1 };
    const touch = v(668, 1161);
    return {
      ...base,
      house: house(STILL, r),
      ripple: r,
      soul,
      lines: bed(),
      thought: springThought(1, 0, 0, [
        v(703, 1177),
        v(688, 1170),
        v(678, 1158),
        touch,
      ]),
      ripples: knock(touch, 1),
    };
  },
  // 2 — giving away the key
  () => {
    const r = ground(1.5, 2);
    const soul = { ...v(313, 1254), r: 43, power: 0.82 };
    const ring = v(686, onFloor - 1);
    const angle = -0.2;
    const at = (d: number, up: number) =>
      v(
        ring.x + Math.cos(angle) * d + Math.sin(angle) * up,
        ring.y + Math.sin(angle) * d - Math.cos(angle) * up,
      );
    return {
      ...base,
      house: house(STILL, r),
      ripple: r,
      soul,
      lines: arm(soul, ring),
      thought: springThought(0.96, -0.03, 22, [
        v(716, 1205),
        v(700, 1236),
        v(704, 1274),
        v(730, 1308),
        at(66, 8),
        at(63, -7),
        at(55, -8),
        at(53, 5),
        at(61, 9),
        at(67, 2),
      ]),
      tip: 0.13,
      key: { ring, angle },
    };
  },
  // 3 — spring rules
  () => {
    const r = ground(9, 8, 2.6, 1.45);
    const h = house({ spring: 1, wheel: 0 }, r);
    const soul = { ...v(404, 861), r: 10, power: 0.42 };
    const key = inKeyhole(h, -0.06);
    return {
      ...base,
      house: h,
      ripple: r,
      soul,
      lines: ribbon(soul, soul.r),
      thought: springThought(1.3, 0.0, 18, [
        v(755, 1132),
        v(748, 1150),
        v(737, 1161),
        v(key.ring.x + 9, key.ring.y + 14),
        v(key.ring.x - 5, key.ring.y + 5),
        v(key.ring.x + 1, key.ring.y - 5),
        v(key.ring.x + 9, key.ring.y - 1),
      ]),
      tip: 0.07,
      key,
      waves: waves(
        h,
        {
          ...noWave,
          amount: 1,
          bounce: 1,
          below: 1,
          guest: { x: 805, y: 1150, rx: 78, ry: 225 },
        },
        r,
      ),
    };
  },
  // 4 — wheel rules
  () => {
    const r = ground(0, 1);
    const h = house({ spring: 0, wheel: 1 }, r);
    const soul = { ...v(518, 1216), r: 13, power: 0.5 };
    const key = inKeyhole(h, 0.0);
    const c = v(822, 1205);
    return {
      ...base,
      house: h,
      ripple: r,
      soul,
      lines: swept(soul, soul.r, h.floor),
      thought: wheelThought(
        c,
        0.75,
        [v(655, 1372), v(694, 1364), v(734, 1368), v(778, 1356)],
        [
          v(key.ring.x + 52, key.ring.y + 14),
          v(key.ring.x + 32, key.ring.y + 26),
          v(key.ring.x + 14, key.ring.y + 18),
          v(key.ring.x + 3, key.ring.y + 8),
          v(key.ring.x - 4, key.ring.y),
          v(key.ring.x + 4, key.ring.y - 5),
          v(key.ring.x + 10, key.ring.y),
        ],
      ),
      tip: 0.045,
      key,
      waves: waves(
        h,
        {
          ...noWave,
          amount: 1,
          swirl: 1,
          guest: { x: 816, y: 1210, rx: 92, ry: 145 },
        },
        r,
      ),
    };
  },
  // 5 — the pause
  () => {
    const r = ground(0, 0);
    const soul = { ...v(313, 1254), r: 45, power: 0.86 };
    const ring = v(644 - KEY_LENGTH / 2 + 5, onFloor);
    return {
      ...base,
      house: house(STILL, r),
      ripple: r,
      soul,
      lines: arm(soul, ring),
      thought: tangleThought(0, -0.02),
      tip: 0,
      key: { ring, angle: 0 },
    };
  },
  // 6 — the choice
  () => {
    const r = { ...ground(0, 24, 4.2, 4.6), from: 668 };
    const h = house(STILL, r);
    const soul = { ...v(300, 1258), r: 49, power: 1.5 };
    const ring = v(476, 1254);
    return {
      ...base,
      house: h,
      ripple: r,
      soul,
      lines: curledArm(soul, ring),
      thought: tangleThought(0, -0.03, 0, 1, groundY(762, r)),
      tip: 0,
      key: { ring, angle: Math.PI },
      waves: surf(1),
    };
  },
  // 7 — the visitor
  () => {
    const r = ground(1, 1.5);
    const soul = { ...v(569, 1254), r: 47, power: 1.2 };
    return {
      ...base,
      house: house(STILL, r),
      ripple: r,
      soul,
      lines: cradle(soul),
      thought: tangleThought(1, 0),
      tip: 0,
      key: { ring: v(236, onFloor), angle: 0 },
      phrase: true,
    };
  },
];

export const FRAMES = frames.length;
export const scene = (frame: number) =>
  frames[Math.min(FRAMES - 1, Math.max(0, frame))]();

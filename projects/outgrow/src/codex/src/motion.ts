// All motion is sampled from time: seeking and rendering produce identical frames.
export type Point = {x: number; y: number};
export const TAU = Math.PI * 2;
export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const smooth = (a: number, b: number, t: number) => {
  const p = clamp((t - a) / (b - a));
  return p * p * p * (p * (p * 6 - 15) + 10);
};
const blend = (a: Point, b: Point, p: number): Point => ({x: mix(a.x, b.x, p), y: mix(a.y, b.y, p)});

const flight = [
  [0, 0, 0], [0.65, 0, 0], [1.35, 160, -65], [1.9, 324, -100],
  [2.35, 100, 20], [3.25, -335, 92], [3.7, -100, 15],
  [4.6, 55, 345], [5.02, 0, 45], [6.05, 272, -290],
  [6.5, 70, -40], [7.4, -220, -330], [7.85, -50, -10],
  [8.7, 210, 180], [9.35, -190, 230], [10.1, -210, -270],
  [10.85, 210, -200], [11.6, 180, 250], [12.35, -180, 210],
  [13.1, -160, -210], [13.85, 160, -170], [14.6, 90, 170],
  [15.25, -85, 100], [15.85, 0, -80], [16.6, 0, -355],
  [17.1, 0, -95], [18.1, 0, -205], [19.2, 0, -120],
  [21, 0, -135], [25, 0, -135],
];

export function seedAt(time: number): Point {
  const t = clamp(time, 0, 25);
  let n = 0;
  while (n < flight.length - 2 && t > flight[n + 1][0]) n++;
  const a = flight[n];
  const b = flight[n + 1];
  const p = smooth(a[0], b[0], t);
  const result = {x: mix(a[1], b[1], p), y: mix(a[2], b[2], p)};
  const motion = smooth(0.5, 1.2, t) * (1 - smooth(15.1, 16, t));
  // A bowed trajectory prevents straight-line ping-pong motion.
  result.x += Math.sin((t - a[0]) / (b[0] - a[0]) * Math.PI) * (n % 2 ? 24 : -24) * motion;
  result.y += Math.sin((t - a[0]) / (b[0] - a[0]) * Math.PI) * (n % 3 ? 18 : -18) * motion;
  result.y += Math.sin(t * 1.8) * 5 * smooth(19, 22, t);
  return result;
}

export const impacts = [1.9, 3.25, 4.6, 6.05, 7.4, 10.1, 11.6, 13.1, 16.6, 18.1];
export const pulse = (t: number) => impacts.reduce((sum, at) => sum + Math.exp(-Math.pow((t - at) / 0.13, 2)), 0);

function cubic(a: Point, b: Point, c: Point, d: Point, t: number): Point {
  const v = 1 - t;
  return {x: v ** 3 * a.x + 3 * v * v * t * b.x + 3 * v * t * t * c.x + t ** 3 * d.x,
    y: v ** 3 * a.y + 3 * v * v * t * b.y + 3 * v * t * t * c.y + t ** 3 * d.y};
}
const p = (x: number, y: number): Point => ({x, y});

// A single continuous contour runs from one wing tip, through the lower body,
// to the other tip. The coincident circle endpoints separate during release.
function wingCurves(q: number): Point[][] {
  const waist = 12 + q * 20;
  const lower = mix(60, 455, q);
  return [
    [p(-435, -715), p(mix(-540, -120, q), mix(-260, -590, q)), p(-waist - 180 * (1 - q), mix(-80, -440, q)), p(-waist, 10)],
    [p(-waist, 10), p(-25, 230), p(-lower - 125, 455), p(-lower, 655)],
    [p(-lower, 655), p(-lower + 65, 810), p(-45 - q * 40, 610), p(0, 815)],
    [p(0, 815), p(45 + q * 40, 610), p(lower - 65, 810), p(lower, 655)],
    [p(lower, 655), p(lower + 125, 455), p(25, 230), p(waist, 10)],
    [p(waist, 10), p(waist + 180 * (1 - q), mix(-80, -440, q)), p(mix(540, 120, q), mix(-260, -590, q)), p(435, -715)],
  ];
}

function wingPoint(u: number, nodes: Point[][]): Point {
  const index = Math.min(nodes.length - 1, Math.floor(u * nodes.length));
  const [a, b, c, d] = nodes[index];
  return cubic(a, b, c, d, u * nodes.length - index);
}

export function contour(t: number, index: number, count: number, intensity = 1): Point[] {
  const q = index / (count - 1);
  const radius = mix(43, 414, q);
  const morph8 = smooth(7.6, 9.8, t);
  const bloom = smooth(11, 12.25, t) * (1 - smooth(14.1, 15.4, t));
  const wings = smooth(15.65 + q * 0.11, 19.6 + q * 0.16, t);
  const target = wings > 0 ? wingCurves(q) : [];
  const late = smooth(18.6, 21, t);
  const turn = Math.sin(t * 0.8) * 0.18 * (1 - late) + Math.sin(t * 2.2) * 0.1 * bloom;
  const points: Point[] = [];
  for (let j = 0; j <= 240; j++) {
    const u = j / 240;
    const angle = u * TAU - Math.PI / 2;
    let deformation = 0;
    for (const at of impacts) {
      const age = t - at - q * 0.2;
      if (age < 0 || age > 1.8) continue;
      const hit = seedAt(at);
      const hitAngle = Math.atan2(hit.y, hit.x);
      const distance = Math.atan2(Math.sin(angle - hitAngle), Math.cos(angle - hitAngle));
      deformation += Math.exp(-distance * distance / 0.19) * Math.sin(age * 15 - q * 4) * Math.exp(-age * 2.1) * 43 * intensity;
    }
    const breathing = (Math.sin(t * 3.7 - q * 5) * 2.8 + Math.sin(angle * 3 - t * 2) * 1.5) * smooth(0.3, 1, t);
    const r = radius + deformation + breathing;
    const stretch = 1 + smooth(5.5, 8, t) * 0.32;
    const circle = p(Math.cos(angle) * r, Math.sin(angle) * r * stretch);
    const size = 0.16 + q * 0.84;
    const eight = p(Math.sin(angle * 2) * 360 * size, Math.sin(angle) * 635 * Math.sqrt(size));
    let point = blend(circle, eight, morph8);
    const petal = radius * (0.8 + 0.23 * Math.cos(angle * 6 + t * 1.9));
    point = blend(point, p(Math.cos(angle + t * 0.26) * petal * 1.13, Math.sin(angle + t * 0.26) * petal * 1.3), bloom * 0.92);
    if (wings > 0) point = blend(point, wingPoint(u, target), wings);
    const breathe = Math.sin(t * 1.35) * 0.009 * wings;
    point.x *= 1 + breathe;
    const ripple = Math.sin(angle * 4 - t * 5 - q * 7) * 7 * (1 - late) * morph8;
    point.x += ripple * Math.cos(angle);
    point.y += ripple * Math.sin(angle);
    points.push(p(point.x * Math.cos(turn) - point.y * Math.sin(turn), point.x * Math.sin(turn) + point.y * Math.cos(turn)));
  }
  return points;
}

export function pathOf(points: Point[], close = false): string {
  return points.map((point, i) => `${i ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ') + (close ? ' Z' : '');
}

export function cameraAt(t: number, amount: number) {
  const seed = seedAt(t);
  const follow = smooth(0.5, 2, t) * (1 - smooth(16, 20, t));
  const push = smooth(0.4, 2.4, t) * 0.15 + smooth(8, 11, t) * 0.12 - smooth(15.9, 20.8, t) * 0.34;
  return {x: -seed.x * 0.24 * follow * amount, y: -seed.y * 0.19 * follow * amount,
    scale: 1 + push * amount, angle: Math.sin(t * 0.65) * 3.5 * follow * amount};
}

export function orangeFragments(points: Point[], t: number, index: number, count: number): {d: string; opacity: number} {
  const seed = seedAt(t);
  let d = '';
  let drawing = false;
  let opacity = 0;
  const ending = 1 - smooth(20.3, 22, t);
  for (let j = 0; j < points.length; j++) {
    const point = points[j];
    const distance = Math.hypot(point.x - seed.x, point.y - seed.y);
    let power = Math.exp(-distance * distance / (2 * 45 * 45)) * 1.3;
    for (const at of impacts) {
      const age = t - at;
      if (age < 0 || age > 1.6) continue;
      const origin = seedAt(at);
      const propagation = Math.hypot(point.x - origin.x, point.y - origin.y) - age * 570;
      power += Math.exp(-propagation * propagation / 2500) * Math.exp(-age * 1.9);
    }
    // Brief energy wave climbs the contours during the release.
    const release = t - 18.1 - index / count * 0.35;
    if (release > 0 && release < 2.6) {
      const front = point.y - (740 - release * 690);
      power += Math.exp(-front * front / 6400) * 0.85;
    }
    power = clamp(power * ending);
    if (power > 0.18) {
      d += `${drawing ? 'L' : 'M'}${point.x.toFixed(2)},${point.y.toFixed(2)} `;
      drawing = true;
      opacity = Math.max(opacity, power);
    } else {
      if (drawing) d += `L${point.x.toFixed(2)},${point.y.toFixed(2)} `;
      drawing = false;
    }
  }
  return {d, opacity};
}

// Small deterministic synthesis kit for the Outgrow sound effects.
// No samples: every sound is built from sines, seeded noise, plucked-string
// delay lines and resonant filters. Same code, same numbers, same audio.

export const SR = 48000;

/** A stereo buffer; voices add into it at a time in seconds. */
export class Bus {
  L: Float64Array;
  R: Float64Array;
  constructor(seconds: number) {
    const n = Math.ceil(seconds * SR);
    this.L = new Float64Array(n);
    this.R = new Float64Array(n);
  }
  get length() {
    return this.L.length;
  }
  /** Add a mono signal at time t with an equal-power pan (-1 left … 1 right). */
  addMono(t: number, sig: Float64Array, gain: number, pan = 0) {
    const a = ((clamp(pan, -1, 1) + 1) * Math.PI) / 4;
    this.addStereo(t, sig, sig, gain * Math.cos(a), gain * Math.sin(a));
  }
  addStereo(t: number, l: Float64Array, r: Float64Array, gl = 1, gr = gl) {
    const i0 = Math.round(t * SR);
    for (let k = 0; k < l.length; k++) {
      const i = i0 + k;
      if (i < 0) continue;
      if (i >= this.L.length) break;
      this.L[i] += l[k] * gl;
      this.R[i] += r[k] * gr;
    }
  }
  /** Mix another bus into this one. */
  add(b: Bus, gain = 1) {
    for (let i = 0; i < Math.min(this.length, b.length); i++) {
      this.L[i] += b.L[i] * gain;
      this.R[i] += b.R[i] * gain;
    }
  }
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
export const db = (d: number) => Math.pow(10, d / 20);
export const midi = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
const len = (seconds: number) => Math.max(1, Math.round(seconds * SR));

/** Seeded uniform noise in [-1, 1] (mulberry32). */
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return (((t ^ (t >>> 14)) >>> 0) / 4294967296) * 2 - 1;
  };
};

export const noise = (seconds: number, seed: number) => {
  const r = rng(seed);
  const out = new Float64Array(len(seconds));
  for (let i = 0; i < out.length; i++) out[i] = r();
  return out;
};

// ---------------------------------------------------------------- filters

/** State-variable filter with a per-sample cutoff; mode picks the output. */
export const svf = (
  x: Float64Array,
  cutoff: number | ((i: number) => number),
  q: number,
  mode: "low" | "band" | "high",
) => {
  const out = new Float64Array(x.length);
  let lp = 0;
  let bp = 0;
  const damp = 1 / q;
  for (let i = 0; i < x.length; i++) {
    const fc = typeof cutoff === "number" ? cutoff : cutoff(i);
    const f = 2 * Math.sin((Math.PI * clamp(fc, 10, SR / 6)) / SR);
    // two passes per sample keep it stable at higher cutoffs
    for (let k = 0; k < 2; k++) {
      lp += (f / 2) * bp;
      const hp = x[i] - lp - damp * bp;
      bp += (f / 2) * hp;
      if (k === 1) out[i] = mode === "low" ? lp : mode === "band" ? bp : hp;
    }
  }
  return out;
};

/** One-pole lowpass. */
export const onePole = (x: Float64Array, fc: number) => {
  const a = Math.exp((-2 * Math.PI * fc) / SR);
  const out = new Float64Array(x.length);
  let y = 0;
  for (let i = 0; i < x.length; i++) out[i] = y = (1 - a) * x[i] + a * y;
  return out;
};

// ---------------------------------------------------------------- envelopes

/** Attack (linear) then exponential decay to -60 dB after `t60` seconds. */
export const adEnv = (i: number, attack: number, t60: number) => {
  const t = i / SR;
  if (t < attack) return t / attack;
  return Math.exp((-6.9 * (t - attack)) / t60);
};

/** Apply an envelope function of time (seconds) to a signal, in place. */
export const shape = (x: Float64Array, env: (t: number) => number) => {
  for (let i = 0; i < x.length; i++) x[i] *= env(i / SR);
  return x;
};

export const reverse = (x: Float64Array) => Float64Array.from(x).reverse();

// ---------------------------------------------------------------- voices

/**
 * A soft, low, heartbeat-like thump: a sine whose pitch falls from f0 to f1,
 * with a felt-mallet click on top.
 */
export const thump = (o: { f0: number; f1: number; t60: number; click?: number; seed?: number }) => {
  const n = len(o.t60 + 0.05);
  const out = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    const f = o.f1 + (o.f0 - o.f1) * Math.exp(-t / 0.035);
    ph += (2 * Math.PI * f) / SR;
    // second and third harmonics give it body on phone speakers, which cannot play the fundamental
    out[i] = (Math.sin(ph) + 0.45 * Math.sin(2 * ph + 0.4) + 0.15 * Math.sin(3 * ph + 1.1)) * adEnv(i, 0.004, o.t60);
  }
  const click = o.click ?? 0.3;
  if (click > 0) {
    const c = svf(noise(0.03, o.seed ?? 7), 900, 0.8, "low");
    for (let i = 0; i < c.length; i++) out[i] += c[i] * click * 3 * adEnv(i, 0.0008, 0.025);
  }
  // gentle tape-like saturation: rounder, a little warmer, and fewer sharp peaks for the same weight
  const drive = 2;
  for (let i = 0; i < n; i++) out[i] = Math.tanh(drive * out[i]) / Math.tanh(drive);
  return out;
};

/**
 * A plucked string (Karplus–Strong): a burst of filtered noise circulating in
 * a tuned delay line. `bright` 0..1 sets the pluck's hardness, `t60` the ring.
 */
export const pluck = (o: { freq: number; t60: number; bright?: number; seed: number; seconds?: number }) => {
  const n = len(o.seconds ?? o.t60);
  const out = new Float64Array(n);
  const bright = o.bright ?? 0.5;
  const period = SR / o.freq - 0.5; // the averaging filter adds half a sample
  const size = Math.ceil(period) + 2;
  const line = new Float64Array(size);
  const exc = svf(noise(1 / o.freq, o.seed), 300 + 9000 * bright * bright, 0.7, "low");
  const g = Math.pow(10, -3 / (o.freq * o.t60));
  // loss filter mix: 0.5 is the classic average; closer to 1 keeps highs longer
  const s = 0.5 + 0.35 * bright;
  let w = 0;
  let prev = 0;
  for (let i = 0; i < n; i++) {
    const rd = w - period;
    const r0 = Math.floor(rd);
    const fr = rd - r0;
    const a = line[(((r0 % size) + size) % size)];
    const b = line[((((r0 + 1) % size) + size) % size)];
    const delayed = a * (1 - fr) + b * fr;
    const y = g * (s * delayed + (1 - s) * prev);
    prev = delayed;
    const v = y + (i < exc.length ? exc[i] : 0);
    line[w % size] = v;
    out[i] = v;
    w++;
  }
  // soften the very start so the pluck never clicks
  for (let i = 0; i < Math.min(n, 48); i++) out[i] *= i / 48;
  return out;
};

export type Partial = { f: number; a: number; t60: number };

/** Sum of exponentially decaying sines: glass, wood, bells. */
export const modal = (partials: Partial[], attack = 0.001, seed = 1) => {
  const longest = Math.max(...partials.map((p) => p.t60));
  const n = len(longest + attack);
  const out = new Float64Array(n);
  const r = rng(seed);
  for (const p of partials) {
    const ph0 = (r() + 1) * Math.PI;
    const w = (2 * Math.PI * p.f) / SR;
    for (let i = 0; i < n; i++) out[i] += p.a * Math.sin(ph0 + w * i) * adEnv(i, attack, p.t60);
  }
  return out;
};

/** A warm sustained tone: a few soft harmonics, slowly beating against a detuned twin. */
export const warmTone = (o: { freq: number; seconds: number; detune?: number; harmonics?: number; seed: number }) => {
  const n = len(o.seconds);
  const out = new Float64Array(n);
  const h = o.harmonics ?? 5;
  const det = o.detune ?? 0.003;
  const r = rng(o.seed);
  for (const d of [-det, det]) {
    for (let k = 1; k <= h; k++) {
      const w = (2 * Math.PI * o.freq * k * (1 + d)) / SR;
      const ph0 = (r() + 1) * Math.PI;
      const a = 0.5 / (k * k);
      for (let i = 0; i < n; i++) out[i] += a * Math.sin(ph0 + w * i);
    }
  }
  return out;
};

/** A tone whose frequency follows f(t), with harmonics that brighten with b(t). */
export const glide = (o: { seconds: number; f: (t: number) => number; b: (t: number) => number; harmonics?: number; seed: number }) => {
  const n = len(o.seconds);
  const out = new Float64Array(n);
  const h = o.harmonics ?? 8;
  const r = rng(o.seed);
  const phases = Array.from({ length: h }, () => (r() + 1) * Math.PI);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * o.f(t)) / SR;
    const b = o.b(t);
    let v = 0;
    for (let k = 1; k <= h; k++) v += (Math.sin(k * ph + phases[k - 1]) * Math.pow(b, k - 1)) / k;
    out[i] = v;
  }
  return out;
};

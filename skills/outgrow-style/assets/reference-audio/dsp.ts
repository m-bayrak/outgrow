// Small deterministic synthesis kit for the Outgrow sound effects.
// No samples: every sound is built from sines, seeded noise, decaying partials
// and resonant filters. Same code, same numbers, same audio.

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

// ---------------------------------------------------------------- close, tactile voices (version 06 direction)

/**
 * Fine crackle: sparse tiny clicks, like a thin shell or paper giving way close
 * to the ear. `density(t)` is clicks per second; each click is band-limited and
 * placed in the stereo field at random within `width`.
 */
export const crackle = (o: { seconds: number; density: (t: number) => number; seed: number; tone?: number; width?: number }) => {
  const n = len(o.seconds);
  const L = new Float64Array(n);
  const R = new Float64Array(n);
  const r = rng(o.seed);
  const tone = o.tone ?? 3200;
  const width = o.width ?? 0.8;
  const grain = svf(noise(0.012, o.seed + 1), tone, 1.8, "band");
  let t = 0;
  while (t < o.seconds) {
    const d = Math.max(0.5, o.density(t));
    // exponential gaps: a Poisson process, seeded
    t += -Math.log(1 - (r() + 1) / 2.0001) / d;
    if (t >= o.seconds) break;
    const i0 = Math.round(t * SR);
    const a = Math.pow((r() + 1) / 2, 2.2) * (o.density(t) > 0 ? 1 : 0);
    const p = r() * width;
    const gl = Math.cos(((p + 1) * Math.PI) / 4);
    const gr = Math.sin(((p + 1) * Math.PI) / 4);
    const glen = 60 + Math.floor(((r() + 1) / 2) * 300);
    const off = Math.floor(((r() + 1) / 2) * (grain.length - glen - 1));
    for (let k = 0; k < glen && i0 + k < n; k++) {
      const v = grain[off + k] * a * Math.exp(-k / (glen * 0.25));
      L[i0 + k] += v * gl;
      R[i0 + k] += v * gr;
    }
  }
  return { L, R };
};

/** A soft knock with a fingertip on a small wooden box: low wooden partials and a muffled touch. */
export const knock = (o: { f: number; t60?: number; seed: number }) => {
  const t60 = o.t60 ?? 0.12;
  const out = modal(
    [
      { f: o.f, a: 1, t60 },
      { f: o.f * 2.29, a: 0.45, t60: t60 * 0.6 },
      { f: o.f * 3.85, a: 0.18, t60: t60 * 0.35 },
    ],
    0.0025,
    o.seed,
  );
  const touch = svf(noise(0.02, o.seed + 3), 1300, 0.7, "low");
  for (let i = 0; i < touch.length; i++) out[i] += touch[i] * 1.2 * adEnv(i, 0.0015, 0.018);
  return out;
};

/** A kalimba tine, played softly with the thumb: a clear note with a faint high overtone. */
export const tine = (o: { freq: number; t60?: number; seed: number }) => {
  const t60 = o.t60 ?? 1.4;
  return modal(
    [
      { f: o.freq, a: 1, t60 },
      { f: o.freq * 2.01, a: 0.06, t60: t60 * 0.4 },
      { f: o.freq * 5.95, a: 0.07, t60: t60 * 0.12 },
    ],
    0.004,
    o.seed,
  );
};

/** One soft pencil stroke on paper: grainy band-passed noise with a little wobble. */
export const scratch = (o: { seconds: number; seed: number; tone?: number }) => {
  const x = svf(noise(o.seconds, o.seed), o.tone ?? 3600, 1.2, "band");
  const r = rng(o.seed + 9);
  let g = 0;
  for (let i = 0; i < x.length; i++) {
    // paper grain: a jittery, smoothed amplitude
    if (i % 96 === 0) g = 0.5 + 0.5 * Math.abs(r());
    const t = i / x.length;
    x[i] *= g * Math.sin(Math.PI * Math.min(1, t * 1.6)) * (1 - t * 0.3);
  }
  return x;
};

/** A soft, round water drop: a quick upward pitch blip. */
export const drop = (o: { f0: number; f1: number; t60?: number }) => {
  const n = len((o.t60 ?? 0.09) + 0.02);
  const out = new Float64Array(n);
  let ph = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    ph += (2 * Math.PI * (o.f1 + (o.f0 - o.f1) * Math.exp(-t / 0.01))) / SR;
    out[i] = Math.sin(ph) * adEnv(i, 0.0015, o.t60 ?? 0.09);
  }
  return out;
};

/** A muted key press: a small plastic tap and its quieter release. */
export const keyTap = (o: { seed: number; pitch?: number }) => {
  const p = o.pitch ?? 1;
  const down = knock({ f: 420 * p, t60: 0.04, seed: o.seed });
  const up = svf(noise(0.015, o.seed + 5), 2600 * p, 1.5, "band");
  const out = new Float64Array(down.length + len(0.06));
  for (let i = 0; i < down.length; i++) out[i] += down[i];
  const j0 = len(0.045);
  for (let i = 0; i < up.length; i++) out[j0 + i] += up[i] * 0.35 * adEnv(i, 0.0005, 0.012);
  return out;
};

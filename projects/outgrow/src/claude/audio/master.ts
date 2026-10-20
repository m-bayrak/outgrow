// Mastering: a shared room (reverb), loudness to a target (ITU-R BS.1770),
// a look-ahead peak limiter and 16-bit WAV encoding. All deterministic.

import { Bus, SR, db, rng, svf } from "./dsp";

// ---------------------------------------------------------------- reverb

const comb = (x: Float64Array, delay: number, feedback: number, damp: number) => {
  const buf = new Float64Array(delay);
  const out = new Float64Array(x.length);
  let store = 0;
  for (let i = 0; i < x.length; i++) {
    const j = i % delay;
    const y = buf[j];
    store = y * (1 - damp) + store * damp;
    buf[j] = x[i] + store * feedback;
    out[i] = y;
  }
  return out;
};

const allpass = (x: Float64Array, delay: number) => {
  const buf = new Float64Array(delay);
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const j = i % delay;
    const b = buf[j];
    out[i] = b - x[i];
    buf[j] = x[i] + b * 0.5;
  }
  return out;
};

const COMBS = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617];
const ALLPASSES = [556, 441, 341, 225];

/** Freeverb-style room: a long, soft, dark space. The right channel is spread for width. */
export const reverb = (send: Bus, o: { size: number; damp: number; predelay: number }) => {
  const scale = SR / 44100;
  const out = new Bus(send.length / SR);
  const pre = Math.round(o.predelay * SR);
  const chan = (x: Float64Array, spread: number) => {
    // no lows into the room: a long low tail only muddies the strikes
    const hp = svf(x, 240, 0.7, "high");
    const input = new Float64Array(x.length);
    for (let i = pre; i < x.length; i++) input[i] = hp[i - pre] * 0.015;
    let sum = new Float64Array(x.length);
    for (const c of COMBS) {
      const y = comb(input, Math.round((c + spread) * scale), o.size, o.damp);
      for (let i = 0; i < x.length; i++) sum[i] += y[i];
    }
    for (const a of ALLPASSES) sum = allpass(sum, Math.round((a + spread) * scale));
    return sum;
  };
  out.L = chan(send.L, 0);
  out.R = chan(send.R, 23);
  return out;
};

// ---------------------------------------------------------------- loudness

const biquad = (x: Float64Array, b: number[], a: number[]) => {
  const out = new Float64Array(x.length);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const y = b[0] * x[i] + b[1] * x1 + b[2] * x2 - a[1] * y1 - a[2] * y2;
    x2 = x1;
    x1 = x[i];
    y2 = y1;
    y1 = y;
    out[i] = y;
  }
  return out;
};

/** K-weighting at 48 kHz (BS.1770-4). */
const kWeight = (x: Float64Array) =>
  biquad(
    biquad(x, [1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, 0.73248077421585]),
    [1, -2, 1],
    [1, -1.99004745483398, 0.99007225036621],
  );

/** Integrated loudness in LUFS with the absolute (-70) and relative (-10 LU) gates. */
export const integratedLoudness = (bus: Bus) => {
  const l = kWeight(bus.L);
  const r = kWeight(bus.R);
  const block = Math.round(0.4 * SR);
  const hop = Math.round(0.1 * SR);
  const z: number[] = [];
  for (let s = 0; s + block <= l.length; s += hop) {
    let acc = 0;
    for (let i = s; i < s + block; i++) acc += l[i] * l[i] + r[i] * r[i];
    z.push(acc / block);
  }
  const lufs = (m: number) => -0.691 + 10 * Math.log10(m);
  const abs = z.filter((m) => lufs(m) > -70);
  const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length;
  const rel = lufs(mean(abs)) - 10;
  return lufs(mean(abs.filter((m) => lufs(m) > rel)));
};

export const peak = (bus: Bus) => {
  let p = 0;
  for (let i = 0; i < bus.length; i++) p = Math.max(p, Math.abs(bus.L[i]), Math.abs(bus.R[i]));
  return 20 * Math.log10(p);
};

// ---------------------------------------------------------------- limiter

/** Look-ahead peak limiter (linked stereo): never lets a sample past `ceiling` dBFS. */
export const limit = (bus: Bus, ceiling: number) => {
  const c = db(ceiling);
  const look = Math.round(0.005 * SR);
  const n = bus.length;
  // required gain per sample, then a running minimum over the look-ahead window
  const need = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const p = Math.max(Math.abs(bus.L[i]), Math.abs(bus.R[i]));
    need[i] = p > c ? c / p : 1;
  }
  // hold: the lowest gain needed anywhere in the look-ahead, released slowly
  const rel = Math.exp(-1 / (0.12 * SR));
  const hold = new Float64Array(n);
  let h = 1;
  for (let i = 0; i < n; i++) {
    let m = 1;
    for (let k = i; k < Math.min(n, i + look); k++) m = Math.min(m, need[k]);
    h = Math.min(m, 1 - (1 - h) * rel);
    hold[i] = h;
  }
  // a moving average over the look-ahead turns the steps into ramps that still reach every peak in time
  let acc = look;
  for (let i = 0; i < n; i++) {
    acc += hold[i] - (i >= look ? hold[i - look] : 1);
    const g = acc / look;
    bus.L[i] *= g;
    bus.R[i] *= g;
  }
};

/** Fade the last `seconds` out so the film ends without a click. */
export const fadeOut = (bus: Bus, seconds: number) => {
  const n = Math.round(seconds * SR);
  for (let k = 0; k < n; k++) {
    const i = bus.length - n + k;
    const g = Math.cos(((k / n) * Math.PI) / 2);
    bus.L[i] *= g;
    bus.R[i] *= g;
  }
};

/** Scale to the target loudness, limit, and correct once more for what the limiter took. */
export const master = (bus: Bus, target: number, ceiling: number) => {
  // nothing below ~30 Hz: no speaker plays it and it only eats headroom
  bus.L = svf(bus.L, 32, 0.7, "high");
  bus.R = svf(bus.R, 32, 0.7, "high");
  for (let pass = 0; pass < 5; pass++) {
    const gain = db(target - integratedLoudness(bus));
    for (let i = 0; i < bus.length; i++) {
      bus.L[i] *= gain;
      bus.R[i] *= gain;
    }
    limit(bus, ceiling);
  }
  return { lufs: integratedLoudness(bus), peak: peak(bus) };
};

// ---------------------------------------------------------------- WAV

/** 16-bit PCM stereo WAV with seeded TPDF dither. */
export const wav = (bus: Bus): Uint8Array => {
  const n = bus.length;
  const bytes = new Uint8Array(44 + n * 4);
  const v = new DataView(bytes.buffer);
  const str = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  str(0, "RIFF");
  v.setUint32(4, 36 + n * 4, true);
  str(8, "WAVE");
  str(12, "fmt ");
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 2, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * 4, true);
  v.setUint16(32, 4, true);
  v.setUint16(34, 16, true);
  str(36, "data");
  v.setUint32(40, n * 4, true);
  const r = rng(16);
  const q = (x: number) => Math.max(-32768, Math.min(32767, Math.round(x * 32767 + (r() + r()) * 0.5)));
  for (let i = 0; i < n; i++) {
    v.setInt16(44 + i * 4, q(bus.L[i]), true);
    v.setInt16(46 + i * 4, q(bus.R[i]), true);
  }
  return bytes;
};

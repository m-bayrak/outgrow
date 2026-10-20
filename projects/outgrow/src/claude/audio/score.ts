// The sound score of Outgrow. Every cue reads its time from the film's own
// timeline (timeline.ts, ending.ts, finale.ts), so if the picture moves, the
// sound moves with it. The white lines are strings: strikes make them ring,
// the breakthrough opens them into a warm D major chord, the wing that stretches
// toward the bubble tightens them into one note.

import { IMPACTS, SHAPE_TRACK, WAVES, charge } from "../src/timeline";
import { FLIGHT_END, FLIGHT_START, LINES, SPARK, flightPos, flightProgress, toScreenFinal } from "../src/ending";
import { BUBBLE, BUBBLE_CENTER, DOTS, PULL_FROM, T, TOUCH, pullState, typingPulse } from "../src/finale";
import { inOutCubic } from "../src/math";
import {
  Bus,
  SR,
  adEnv,
  clamp,
  db,
  glide,
  midi,
  modal,
  noise,
  onePole,
  pluck,
  reverse,
  shape,
  svf,
  thump,
  warmTone,
} from "./dsp";
import { reverb } from "./master";

export type Cue = { t: number; event: string; sound: string };

/** Pitches, all in D: open fifths and suspended notes until the breakthrough resolves them. */
const N = { D2: 38, A2: 45, D3: 50, E3: 52, Fs3: 54, G3: 55, A3: 57, D4: 62, E4: 64, Fs4: 66, A4: 69, D5: 74, Fs5: 78, A5: 81 };

/** Pan from world x around the shell (camera roughly centred on it). */
const worldPan = (x: number) => clamp(x / 520, -0.7, 0.7);
/** Pan from screen x in the final frame. */
const screenPan = (x: number) => clamp(((x - 540) / 540) * 0.7, -0.7, 0.7);

/** Inverse of inOutCubic, for finding when a glide passes a point. */
const invInOut = (y: number) => {
  let lo = 0;
  let hi = 1;
  for (let k = 0; k < 30; k++) {
    const m = (lo + hi) / 2;
    if (inOutCubic(m) < y) lo = m;
    else hi = m;
  }
  return (lo + hi) / 2;
};

export type Score = { dry: Bus; send: Bus; cues: Cue[] };

export const buildScore = (duration: number, only?: (event: string) => boolean): Score => {
  const dry = new Bus(duration);
  const send = new Bus(duration);
  const cues: Cue[] = [];
  let seed = 100;
  const want = (event: string) => !only || only(event);
  /** Place a mono sound: `wet` of it also goes to the room. */
  const put = (t: number, sig: Float64Array, gainDb: number, pan: number, wet: number) => {
    dry.addMono(t, sig, db(gainDb), pan);
    send.addMono(t, sig, db(gainDb) * wet, pan);
  };
  const cue = (t: number, event: string, sound: string) => cues.push({ t, event, sound });

  // ------------------------------------------------ strings: the white lines
  /** Strum a set of strings around a contact point; later strings come a few ms later. */
  const strum = (t: number, notes: number[], o: { gain: number; pan: number; t60: number; bright: number; spread?: number; wet?: number }) => {
    notes.forEach((m, k) => {
      const f = midi(m) * (1 + 0.0015 * (k % 2 === 0 ? 1 : -1));
      const s = pluck({ freq: f, t60: o.t60, bright: o.bright, seed: seed++ });
      const p = clamp(o.pan + (k - (notes.length - 1) / 2) * 0.12, -0.85, 0.85);
      put(t + k * (o.spread ?? 0.012), s, o.gain - 3, p, o.wet ?? 0.35);
    });
  };
  /** The glassy shimmer of a struck line: inharmonic partials, quiet, long. */
  const glass = (t: number, base: number, gain: number, pan: number, t60 = 2.2) => {
    const g = modal(
      [
        { f: base, a: 1, t60 },
        { f: base * 2.32, a: 0.45, t60: t60 * 0.6 },
        { f: base * 4.25, a: 0.2, t60: t60 * 0.35 },
        { f: base * 6.63, a: 0.08, t60: t60 * 0.2 },
      ],
      0.002,
      seed++,
    );
    put(t, g, gain, pan, 0.5);
  };
  /** A tiny wooden tick: one written letter. */
  const tick = (t: number, gain: number, pan: number, pitch = 1) => {
    const r = noise(0.001, seed++)[0];
    const f = (1500 + 260 * r) * pitch;
    const w = modal(
      [
        { f, a: 1, t60: 0.07 },
        { f: f * 2.76, a: 0.35, t60: 0.035 },
        { f: f * 5.4, a: 0.12, t60: 0.02 },
      ],
      0.0006,
      seed++,
    );
    put(t, w, gain, pan, 0.25);
  };
  /** Soft air: band-passed noise shaped by an envelope and a moving centre frequency. */
  const air = (t0: number, seconds: number, env: (t: number) => number, fc: (t: number) => number, gain: number, pan: (t: number) => number, q = 0.9, wet = 0.3) => {
    const n = Math.round(seconds * SR);
    const sides = [0, 1].map((side) => {
      const x = svf(noise(seconds, seed++ + side * 7), (i) => fc(i / SR), q, "band");
      return shape(x, env);
    });
    const l = new Float64Array(n);
    const r = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      // two decorrelated noises make it wide; the pan leans it
      const p = clamp(pan(i / SR), -1, 1);
      const m = (sides[0][i] + sides[1][i]) * 0.5;
      const s = (sides[0][i] - sides[1][i]) * 0.5;
      l[i] = (m + s) * (1 - Math.max(0, p));
      r[i] = (m - s) * (1 + Math.min(0, p));
    }
    dry.addStereo(t0, l, r, db(gain));
    send.addStereo(t0, l, r, db(gain) * wet);
  };

  // ------------------------------------------------ room tone and the pressure bed
  if (want("bed")) {
    const end = IMPACTS[IMPACTS.length - 1].t;
    // dark, low air that thickens as the fight goes on and is cut by the breakthrough
    const x = svf(noise(end + 0.4, seed++), 140, 0.7, "low");
    shape(x, (t) => (0.35 + 0.65 * clamp(t / end, 0, 1) ** 2) * clamp(t / 0.6, 0, 1) * (t < end ? 1 : Math.exp(-(t - end) / 0.05)));
    put(0, x, -33, 0, 0.2);
    cue(0, "Containment", "dark low air under everything, thickening until the breakthrough");
  }

  // ------------------------------------------------ anticipation breaths
  if (want("breath")) {
    // the soul's charge (timeline.ts) is the breath's own envelope: it inhales, then holds still at the strike
    const x = svf(noise(9, seed++), (i) => 500 + 1700 * charge(i / SR), 1.4, "band");
    shape(x, (t) => Math.pow(charge(t), 1.6) * (IMPACTS.some((m) => t > m.t - 0.012 && t < m.t + 0.06) ? 0 : 1));
    put(0, onePole(x, 2600), -15, 0, 0.3);
    for (const m of IMPACTS) cue(m.t - 0.4, "Gathering before a strike", "a short breath in (noise rising 500 → 2200 Hz), cut at the strike");
  }

  // ------------------------------------------------ strikes
  const strikeNotes = [
    [N.A2, N.E3, N.A3],
    [N.D3, N.A3, N.E4],
    [N.D2, N.A2, N.D3, N.G3, N.A3, N.E4],
    [N.A2, N.E3, N.A3],
  ];
  IMPACTS.slice(0, 4).forEach((m, k) => {
    const pan = worldPan(Math.cos(m.angle) * 300);
    if (want("strike")) {
      put(m.t, thump({ f0: 160, f1: 62, t60: 0.5 + 0.2 * m.strength, click: 0.35, seed: seed++ }), -10 + 5 * Math.log10(m.strength), pan * 0.4, 0.15);
      cue(m.t, `Strike ${k + 1}`, "soft low heartbeat thump (160 → 62 Hz), gently saturated");
    }
    if (want("strings")) {
      strum(m.t + 0.006, strikeNotes[k], { gain: -13 + 6 * Math.log10(m.strength), pan, t60: 2.4 * m.strength, bright: 0.35 + 0.2 * m.strength });
      glass(m.t + 0.01, midi(N.A5 + (k % 2) * 2), -27, -pan, 1.8);
      cue(m.t, `Strike ${k + 1}: lines resonate`, `plucked strings ${k === 2 ? "D–A–D–G–A–E (the shell gives)" : "in open fifths"} + faint glass`);
    }
  });

  // ------------------------------------------------ waves
  if (want("waves")) {
    for (const w of WAVES) {
      const s = w.amp / 46;
      const n = Math.round((1.2 + 1.6 * s) * SR);
      const x = new Float64Array(n);
      let ph = 0;
      for (let i = 0; i < n; i++) {
        const t = i / SR;
        ph += (2 * Math.PI * (midi(N.D2) * (1 - 0.06 * Math.exp(-t / 0.3)))) / SR;
        // a ring that rises gently and fades wide; the octave and fifth above carry it on small speakers
        x[i] = (0.6 * Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.18 * Math.sin(3 * ph)) * Math.min(1, t / 0.04) * Math.exp(-t / (0.22 + 0.35 * s));
      }
      put(w.t, x, -16 + 10 * Math.log10(s), 0, 0.6);
      air(w.t, 1.4, (t) => Math.min(1, t / 0.05) * Math.exp(-t / 0.4), (t) => 180 + 600 * Math.exp(-t / 0.5), -26 + 10 * Math.log10(s), () => 0, 0.7);
      cue(w.t, "Wave rolls through the lines", "low wide ring (D2) with a fading breath of air");
    }
  }

  // ------------------------------------------------ shape changes
  if (want("morphs")) {
    for (const s of SHAPE_TRACK.slice(0, -2)) {
      // the lines are re-tuned as the shell changes shape: a quiet glassy turn
      glass(s.until, midi(N.D5 + (s.until > 5 ? 5 : 0)), -32, 0, 1.2);
      air(s.until, s.morph + 0.3, (t) => Math.sin(Math.PI * clamp(t / (s.morph + 0.3), 0, 1)), (t) => 900 + 1500 * t, -34, () => 0, 2, 0.4);
      cue(s.until, `Shell morphs (${s.shape} → next)`, "a quiet glass shimmer and a turn of air");
    }
  }

  // ------------------------------------------------ breakthrough
  const bt = IMPACTS[IMPACTS.length - 1].t;
  if (want("breakthrough")) {
    put(bt, thump({ f0: 170, f1: 50, t60: 1.4, click: 0.5, seed: seed++ }), -8, 0, 0.25);
    // the shell gives way: a short burst of torn air
    air(bt, 0.9, (t) => Math.min(1, t / 0.015) * Math.exp(-t / 0.14), (t) => 2400 * Math.exp(-t / 0.3) + 300, -18, () => 0, 0.6, 0.5);
    // every string at once, strummed upward, resolving to D major (add9)
    strum(bt + 0.01, [N.D2, N.A2, N.D3, N.Fs3, N.A3, N.D4, N.E4, N.Fs4, N.A4], { gain: -11, pan: 0, t60: 4.5, bright: 0.6, spread: 0.016, wet: 0.5 });
    glass(bt + 0.02, midi(N.Fs5), -22, 0.3, 3);
    glass(bt + 0.05, midi(N.D5), -22, -0.3, 3);
    // then the chord opens and stays, warm, while the wings unfold
    const chord = [N.D3, N.A3, N.D4, N.Fs4, N.E4];
    chord.forEach((m, k) => {
      const len = 4.2;
      const x = warmTone({ freq: midi(m), seconds: len, seed: seed++ });
      shape(x, (t) => clamp((t - 0.05) / 0.5, 0, 1) ** 2 * Math.exp(-Math.max(0, t - 0.6) / 1.4));
      put(bt + 0.05, onePole(x, 1800), -16, (k - 2) * 0.25, 0.7);
    });
    cue(bt, "Breakthrough", "deepest thump + torn air + every string at once, opening into a warm D major (add9) chord");
  }

  // ------------------------------------------------ wings unfold, flight
  if (want("air")) {
    const unfold = SHAPE_TRACK[SHAPE_TRACK.length - 2];
    const t0 = unfold.until;
    const seconds = FLIGHT_START - t0 + 0.2;
    air(t0, seconds, (t) => Math.sin(Math.PI * clamp(t / seconds, 0, 1)) ** 1.5, (t) => 300 + 500 * (t / seconds), -17, (t) => 0.4 * Math.sin(t * 1.3), 0.8, 0.5);
    cue(t0, "Wings unfold", "soft wide air, slowly rising");

    const fs = FLIGHT_END - FLIGHT_START + 0.5;
    const speed = (t: number) => {
      const d = (flightProgress(t + 0.01) - flightProgress(t - 0.01)) / 0.02;
      return clamp(d / 1.6, 0, 1);
    };
    const panAt = (t: number) => screenPan(toScreenFinal(flightPos(FLIGHT_START + t), FLIGHT_START + t).x);
    air(FLIGHT_START, fs, (t) => Math.pow(speed(FLIGHT_START + t), 1.3), (t) => 350 + 1500 * speed(FLIGHT_START + t), -12, panAt, 1.1, 0.35);
    cue(FLIGHT_START, "Flight up the S-curve", "a whoosh that follows the soul's speed and side");
  }

  // ------------------------------------------------ the spark writes
  const glideTicks = (a: number, b: number, letters: number, gain: number, x0: number, x1: number) => {
    for (let j = 0; j < letters; j++) {
      const p = invInOut((j + 0.5) / letters);
      tick(a + p * (b - a), gain - 2 * Math.abs(Math.sin(j * 1.7)), screenPan(x0 + (x1 - x0) * ((j + 0.5) / letters)), 1 + 0.04 * Math.sin(j * 2.3));
    }
  };
  const accent = (t: number, notes: number[], gain: number, pan: number) => {
    put(t, thump({ f0: 200, f1: 75, t60: 0.35, click: 0.6, seed: seed++ }), gain - 6, pan, 0.2);
    strum(t + 0.004, notes, { gain: gain - 4, pan, t60: 1.6, bright: 0.65, spread: 0.008, wet: 0.45 });
    tick(t, gain - 6, pan, 1.25);
  };
  if (want("text")) {
    glass(SPARK.birth, midi(N.A5), -24, 0.5, 0.9);
    cue(SPARK.birth, "A spark is born", "one tiny high glass note");
    const letters = LINES.map((l) => l.text.replace(/ /g, "").length);
    accent(SPARK.breakLand, [N.D3, N.A3, N.D4], -11, -0.3);
    cue(SPARK.breakLand, `"${LINES[0].text}" lands`, "accent: light thump + bright pluck (D–A–D)");
    glideTicks(SPARK.line2Land, SPARK.line2End, letters[1], -24, 140, 760);
    cue(SPARK.line2Land, `"${LINES[1].text}" is written`, "one quiet wooden tick per letter");
    accent(SPARK.keepLand, [N.A2, N.E3, N.A3], -11, -0.3);
    cue(SPARK.keepLand, `"${LINES[2].text}" lands`, "accent: light thump + pluck (A–E–A)");
    glideTicks(SPARK.line4Land, SPARK.line4End, letters[3], -24, 140, 800);
    tick(SPARK.line4End + 0.02, -20, 0.4, 0.8);
    cue(SPARK.line4Land, `"${LINES[3].text}" is written`, "ticks; the full stop a slightly lower one");
  }

  // ------------------------------------------------ the old words are inhaled
  if (want("inhale")) {
    // built forwards — a struck glass chord and a flurry of ticks in a long room — then played backwards,
    // so it swells and is sucked in, ending exactly when the last letter is gone
    const len = T.inhaleEnd - T.inhale + 0.15;
    const local = new Bus(len + 0.1);
    const lsend = new Bus(len + 0.1);
    [N.D4, N.A4, N.E4, N.Fs5].forEach((m, k) => {
      const x = pluck({ freq: midi(m), t60: 1.4, bright: 0.7, seed: seed++, seconds: len });
      local.addMono(0.01 * k, x, db(-12), (k - 1.5) * 0.3);
      lsend.addMono(0.01 * k, x, db(-6), (k - 1.5) * 0.3);
    });
    for (let j = 0; j < 22; j++) {
      const w = modal([{ f: 1400 + 40 * j, a: 1, t60: 0.06 }, { f: (1400 + 40 * j) * 2.76, a: 0.3, t60: 0.03 }], 0.0005, seed++);
      const tt = 0.02 + 0.6 * (j / 22) ** 1.6;
      local.addMono(tt, w, db(-20), Math.sin(j) * 0.5);
      lsend.addMono(tt, w, db(-14), Math.sin(j) * 0.5);
    }
    const room = reverb(lsend, { size: 0.86, damp: 0.3, predelay: 0.01 });
    local.add(room, 1);
    const l = reverse(local.L.subarray(0, Math.round(len * SR)));
    const r = reverse(local.R.subarray(0, Math.round(len * SR)));
    // shape the swell: silent at the start, full at the end, cut clean
    shape(l, (t) => clamp(t / (len * 0.7), 0, 1) ** 2);
    shape(r, (t) => clamp(t / (len * 0.7), 0, 1) ** 2);
    dry.addStereo(T.inhaleEnd - len + 0.06, l, r, db(-4));
    air(T.inhale, len, (t) => (t / len) ** 2.5 * (t < len - 0.07 ? 1 : 0), (t) => 2800 - 2000 * (t / len), -18, () => 0.3, 1.6, 0.1);
    cue(T.inhale, "The soul inhales the old words", "a reversed glass chord and ticks, swelling and sucked in; air drawn inward");
  }

  // ------------------------------------------------ it writes the new words
  if (want("text2")) {
    air(T.launch, T.line1Land - T.launch + 0.1, (t) => Math.sin(Math.PI * clamp(t / 0.5, 0, 1)), (t) => 600 + 900 * t, -24, (t) => 0.4 - t, 1.2, 0.3);
    cue(T.launch, "The soul launches", "a small breath of air");
    glideTicks(T.line1Land, T.line1End, "Meaning".length, -24, 120, 640);
    cue(T.line1Land, '"Meaning" is written', "ticks");
    glideTicks(T.line2Land, T.line2End, "inthe".length, -25, 120, 460);
    cue(T.line2Land, '"in the" is written', "ticks");
    put(T.impact, thump({ f0: 190, f1: 58, t60: 0.7, click: 0.6, seed: seed++ }), -9, 0, 0.25);
    strum(T.impact + 0.004, [N.D3, N.A3, N.D4, N.Fs4], { gain: -10, pan: 0, t60: 2.4, bright: 0.65, spread: 0.01, wet: 0.5 });
    glass(T.impact + 0.01, midi(N.A5), -22, 0.2, 1.6);
    for (let j = 0; j < 9; j++) tick(T.impact + 0.018 * Math.abs(j - 4), -27, screenPan(140 + 80 * j));
    cue(T.impact, '"comments." lands', "the strongest accent of the ending: thump + D major pluck + glass; letters burst as ticks");
  }

  // ------------------------------------------------ the wing is drawn out to the bubble
  if (want("pull")) {
    air(T.dive, T.touch - T.dive + 0.05, (t) => Math.sin(Math.PI * clamp(t / (T.touch - T.dive + 0.05), 0, 1)), (t) => 700 + 1600 * t, -22, (t) => -0.7 * t * 2, 1.2, 0.3);
    cue(T.dive, "Dive to the left wing", "a short rush of air");
    strum(T.touch, [N.A3, N.E4], { gain: -11, pan: screenPan(TOUCH.x), t60: 1.6, bright: 0.55, wet: 0.5 });
    cue(T.touch, "Touches the wing", "two strings plucked where it enters");
    // twelve lines, twelve strings: each starts at its own pitch and glides up as it tightens,
    // and all converge on one note as the lines converge on one point
    const seconds = T.arrive - T.extend + 0.6;
    for (let i = PULL_FROM; i < 24; i++) {
      const k = (i - PULL_FROM) / (23 - PULL_FROM);
      const start = midi(N.A2) * Math.pow(2, (k * 7 - 3) / 12);
      const target = midi(N.A3);
      const x = glide({
        seconds,
        seed: seed++,
        harmonics: 7,
        f: (t) => {
          const e = clamp(pullState(i, T.extend + t).e, 0, 1.05);
          return start + (target - start) * e;
        },
        b: (t) => 0.2 + 0.45 * clamp(pullState(i, T.extend + t).e, 0, 1),
      });
      shape(x, (t) => {
        const e = clamp(pullState(i, T.extend + t).e, 0, 1);
        const after = Math.max(0, T.extend + t - T.arrive);
        return Math.min(1, t / 0.25) * (0.25 + 0.75 * e) * Math.exp(-after / 0.15);
      });
      put(T.extend, onePole(x, 2400), -34, screenPan(lerpScreen(TOUCH.x, BUBBLE.left, k * 0.5)), 0.5);
    }
    cue(T.extend, "The wing's top edge stretches toward the bubble", "twelve bowed strings rising and tightening, converging on one note (A3)");
  }

  // ------------------------------------------------ the bubble
  if (want("bubble")) {
    const pan = screenPan(BUBBLE_CENTER.x);
    glass(T.bubble, midi(N.D5), -24, pan, 1.0);
    air(T.bubble, T.bubbleEnd - T.bubble + 0.15, (t) => Math.sin(Math.PI * clamp(t / 0.6, 0, 1)), (t) => 1800 + 3000 * t, -30, () => pan, 3, 0.4);
    cue(T.bubble, "The bubble is drawn", "a faint glass note and a thin line of air");
    // the soul re-forms and bursts: a soft round pop
    const popN = Math.round(0.18 * SR);
    const pop = new Float64Array(popN);
    let ph = 0;
    for (let i = 0; i < popN; i++) {
      const t = i / SR;
      ph += (2 * Math.PI * (260 + 520 * (1 - Math.exp(-t / 0.012)))) / SR;
      pop[i] = Math.sin(ph) * adEnv(i, 0.002, 0.11);
    }
    put(T.burst, pop, -15, pan, 0.35);
    put(T.burst, thump({ f0: 130, f1: 70, t60: 0.25, click: 0.15, seed: seed++ }), -14, pan, 0.2);
    cue(T.burst, "The soul bursts inside the bubble", "a soft round pop");
    // it splits into three dots
    DOTS.forEach((d, k) => tick(T.split + 0.03 * k, -22, screenPan(d.dot.x), 1.5 + 0.1 * k));
    cue(T.split, "Splits into three dots", "three tiny high ticks");
    // typing: a quiet click as each dot starts its bounce (finale.ts typingPulse: 0.52 s cycle, 0.13 s apart)
    for (let n = 0; ; n++) {
      if (T.typing + n * 0.52 >= T.bars) break;
      DOTS.forEach((d, k) => {
        const t = T.typing + k * 0.13 + n * 0.52;
        if (t < T.bars && typingPulse(t + 0.05, k) > 0) tick(t, -21 - 5 * n, screenPan(d.dot.x), 1.15 + 0.05 * k);
      });
    }
    cue(T.typing, "Typing dots", "a quiet click on each dot's bounce");
    // the dots settle into the bars: the chord comes home, softly
    [N.D3, N.A3, N.Fs4].forEach((m, k) => {
      const x = warmTone({ freq: midi(m), seconds: T.end - T.bars, seed: seed++, harmonics: 4 });
      shape(x, (t) => clamp(t / 0.4, 0, 1) ** 2 * (0.55 + 0.45 * Math.exp(-t / 0.8)) * (1 + 0.15 * Math.sin(2 * Math.PI * 0.9 * Math.max(0, t - (T.barsEnd - T.bars)))));
      put(T.bars, onePole(x, 1400), -30, (k - 1) * 0.3, 0.6);
    });
    cue(T.bars, "Dots become the bubble's bars", "the D major chord returns, very soft, breathing with the bubble");
    // calm pulse: every signal arc (Comments.tsx: k * 0.38 s apart, every 1.15 s) is a soft, round note
    const arcNotes = [N.A4, N.D5, N.Fs5];
    for (let n = 0; ; n++) {
      let any = false;
      for (let k = 0; k < 3; k++) {
        const t = T.barsEnd + k * 0.38 + n * 1.15;
        if (t > T.end - 0.15) continue;
        any = true;
        const x = modal(
          [
            { f: midi(arcNotes[k]), a: 1, t60: 1.3 },
            { f: midi(arcNotes[k]) * 2, a: 0.12, t60: 0.5 },
            { f: midi(arcNotes[k]) * 3.01, a: 0.04, t60: 0.25 },
          ],
          0.012,
          seed++,
        );
        put(t, x, -22 - 2 * n, pan + 0.15, 0.55);
      }
      if (!any) break;
    }
    cue(T.barsEnd, "Calm pulse: signal arcs toward the comment button", "soft round notes A–D–F♯, one per arc, every 1.15 s");
  }

  cues.sort((a, b) => a.t - b.t);
  return { dry, send, cues };
};

const lerpScreen = (a: number, b: number, t: number) => a + (b - a) * t;

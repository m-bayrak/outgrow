// The sound score of Outgrow. Every cue reads its time from the film's own
// timeline (timeline.ts, ending.ts, finale.ts), so if the picture moves, the
// sound moves with it.
//
// The direction (owner, version 06): close, soft and tactile, like ASMR — no
// heavy low hits, no harsh noise. Fingertip knocks, fine crackle of a thin
// shell, breath and rustle, kalimba tines, pencil on paper, water drops, muted
// keys. Three sounds of the first sketch were kept as they were: the glass bells
// when the shell changes shape and at the breakthrough, the rustle of the
// flight, and the small glass note when the spark is born.

import { IMPACTS, SHAPE_TRACK, WAVES, charge } from "../src/timeline";
import { FLIGHT_END, FLIGHT_START, LINES, SPARK, flightPos, flightProgress, toScreenFinal } from "../src/ending";
import { BUBBLE_CENTER, DOTS, PULL_FROM, T, TOUCH, pullState, typingPulse } from "../src/finale";
import { inOutCubic } from "../src/math";
import {
  Bus,
  SR,
  clamp,
  crackle,
  db,
  drop,
  keyTap,
  knock,
  midi,
  modal,
  noise,
  onePole,
  reverse,
  scratch,
  shape,
  svf,
  tine,
  warmTone,
} from "./dsp";
import { reverb } from "./master";

export type Cue = { t: number; event: string; sound: string };

/** Pitches, all in D: open fifths while the shell resists, D major once it opens. */
const N = { D3: 50, A3: 57, D4: 62, E4: 64, Fs4: 66, A4: 69, D5: 74, E5: 76, Fs5: 78, A5: 81 };

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
  const putStereo = (t: number, s: { L: Float64Array; R: Float64Array }, gainDb: number, wet: number) => {
    dry.addStereo(t, s.L, s.R, db(gainDb));
    send.addStereo(t, s.L, s.R, db(gainDb) * wet);
  };
  const cue = (t: number, event: string, sound: string) => cues.push({ t, event, sound });

  /** The glassy bell of a line (kept from the first sketch): inharmonic partials, quiet, long. */
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
  /** Rustle of feathers or fabric: air with a slow, uneven flutter. */
  const rustle = (t0: number, seconds: number, env: (t: number) => number, gain: number, rate: number, tone = 2400) => {
    const r = Array.from({ length: 64 }, (_, k) => noise(0.001, seed + k)[0]);
    seed += 64;
    const flutter = (t: number) => {
      const x = t * rate;
      const i = Math.floor(x);
      const f = x - i;
      const a = r[i % 64];
      const b = r[(i + 1) % 64];
      return 0.55 + 0.45 * (a + (b - a) * f * f * (3 - 2 * f));
    };
    air(t0, seconds, (t) => env(t) * flutter(t), (t) => tone * (0.8 + 0.3 * flutter(t + 0.3)), gain, (t) => 0.3 * Math.sin(t * 2.1), 0.8, 0.25);
  };
  /** One written letter: a short pencil stroke. */
  const letter = (t: number, gain: number, pan: number, k: number) => {
    put(t, scratch({ seconds: 0.045 + 0.025 * Math.abs(Math.sin(k * 1.9)), seed: seed++, tone: 3000 + 500 * Math.sin(k * 2.7) }), gain, pan, 0.15);
  };
  /** A word lands: a fingertip knock, kalimba notes and a pinch of crackle. */
  const accent = (t: number, notes: number[], gain: number, pan: number) => {
    put(t, knock({ f: 210, seed: seed++ }), gain - 5, pan, 0.15);
    notes.forEach((m, k) => put(t + 0.012 * k, tine({ freq: midi(m), t60: 1.6, seed: seed++ }), gain - 7, pan + (k - 1) * 0.2, 0.4));
    putStereo(t, crackle({ seconds: 0.25, density: (x) => 500 * Math.exp(-x / 0.06), seed: seed++, width: 0.5 }), gain - 6, 0.1);
  };

  // ------------------------------------------------ anticipation breaths
  if (want("breath")) {
    // the soul's charge (timeline.ts) is the breath's own envelope: a soft, close inhale, held at the strike
    const x = svf(noise(9, seed++), (i) => 350 + 900 * charge(i / SR), 0.7, "band");
    shape(x, (t) => Math.pow(charge(t), 2) * (IMPACTS.some((m) => t > m.t - 0.02 && t < m.t + 0.06) ? 0 : 1));
    put(0, onePole(x, 2200), -21, 0, 0.15);
    for (const m of IMPACTS) cue(m.t - 0.4, "Gathering before a strike", "a soft close inhale, held at the strike");
  }

  // ------------------------------------------------ strikes
  const strikeNotes = [[N.A3, N.E4], [N.D4, N.A4], [N.D4, N.A4, N.E5], [N.A3, N.E4]];
  IMPACTS.slice(0, 4).forEach((m, k) => {
    const pan = worldPan(Math.cos(m.angle) * 300);
    if (want("strike")) {
      put(m.t, knock({ f: 150 + 30 * m.strength, t60: 0.16, seed: seed++ }), -11 + 6 * Math.log10(m.strength), pan * 0.5, 0.1);
      // the shell resists: the thin rings crackle where they are pressed
      putStereo(m.t, crackle({ seconds: 0.5, density: (x) => 1400 * m.strength * Math.exp(-x / 0.07), seed: seed++, width: 0.5, tone: 2600 }), -13 + 6 * Math.log10(m.strength), 0.1);
      cue(m.t, `Strike ${k + 1}`, "a fingertip knock on wood, close, and the thin rings crackling where they are pressed");
    }
    if (want("strings")) {
      strikeNotes[k].forEach((n, j) => put(m.t + 0.02 + 0.03 * j, tine({ freq: midi(n), t60: 1.6 * m.strength, seed: seed++ }), -17 + 5 * Math.log10(m.strength), pan + (j - 0.5) * 0.3, 0.35));
      cue(m.t, `Strike ${k + 1}: lines resonate`, k === 2 ? "three soft kalimba notes (D–A–E): the shell gives" : "two soft kalimba notes in a fifth");
    }
  });

  // ------------------------------------------------ waves
  if (want("waves")) {
    for (const w of WAVES) {
      const s = w.amp / 46;
      const dir = w.origin.x > 0 ? -1 : 1;
      // a soft brush stroke that travels across the stereo field, like the pulse through the lines
      air(w.t, 1.2, (t) => Math.min(1, t / 0.08) * Math.exp(-t / (0.25 + 0.3 * s)), (t) => 700 + 900 * Math.exp(-t / 0.4), -21 + 8 * Math.log10(s), (t) => dir * (0.6 - 1.2 * Math.min(1, t / 0.7)), 0.6, 0.3);
      // the orange colour running along the lines: a thin trail of crackle
      putStereo(w.t + 0.03, crackle({ seconds: 0.9, density: (t) => 180 * s * Math.exp(-t / 0.3), seed: seed++, width: 0.9, tone: 4200 }), -18 + 6 * Math.log10(s), 0.2);
      cue(w.t, "Wave rolls through the lines", "a soft brush stroke across the stereo field with a thin trail of crackle");
    }
  }

  // ------------------------------------------------ shape changes (kept from the first sketch)
  if (want("morphs")) {
    for (const s of SHAPE_TRACK.slice(0, -2)) {
      glass(s.until, midi(N.D5 + (s.until > 5 ? 5 : 0)), -32, 0, 1.2);
      air(s.until, s.morph + 0.3, (t) => Math.sin(Math.PI * clamp(t / (s.morph + 0.3), 0, 1)), (t) => 900 + 1500 * t, -34, () => 0, 2, 0.4);
      cue(s.until, `Shell morphs (${s.shape} → next)`, "a light glass bell and a turn of air (kept)");
    }
  }

  // ------------------------------------------------ breakthrough
  const bt = IMPACTS[IMPACTS.length - 1].t;
  if (want("breakthrough")) {
    // the shell cracks open close to the ear: a dense burst of fine crackle that thins out
    putStereo(bt, crackle({ seconds: 1.4, density: (x) => 5000 * Math.exp(-x / 0.12) + 60 * Math.exp(-x / 0.6), seed: seed++, width: 1, tone: 2900 }), -9, 0.2);
    put(bt, knock({ f: 120, t60: 0.3, seed: seed++ }), -13, 0, 0.1);
    // and breathes out
    air(bt + 0.02, 1.6, (t) => Math.min(1, t / 0.05) * Math.exp(-t / 0.45), (t) => 1400 - 700 * Math.min(1, t / 1.2), -14, () => 0, 0.6, 0.3);
    // the glass bells (kept)
    glass(bt + 0.02, midi(N.Fs5), -22, 0.3, 3);
    glass(bt + 0.05, midi(N.D5), -22, -0.3, 3);
    // the lines run free: kalimba notes rise through D major, spreading left and right
    [N.D4, N.Fs4, N.A4, N.D5, N.E5, N.Fs5, N.A5].forEach((m, k) =>
      put(bt + 0.15 + 0.085 * k, tine({ freq: midi(m), t60: 2.4, seed: seed++ }), -17 - k * 0.6, (k % 2 === 0 ? -1 : 1) * (0.15 + 0.08 * k), 0.45),
    );
    // a warm, slow swell under the wings
    [N.D3, N.A3, N.Fs4].forEach((m, k) => {
      const x = warmTone({ freq: midi(m), seconds: 3.6, seed: seed++, harmonics: 3 });
      shape(x, (t) => clamp(t / 1.2, 0, 1) ** 2 * Math.exp(-Math.max(0, t - 1.4) / 0.9));
      put(bt + 0.2, onePole(x, 900), -28, (k - 1) * 0.35, 0.4);
    });
    cue(bt, "Breakthrough", "the shell cracks open close to the ear (dense fine crackle), a soft breath out, the glass bells (kept), kalimba notes rising through D major, a slow warm swell");
  }

  // ------------------------------------------------ wings unfold, flight
  if (want("air")) {
    const unfold = SHAPE_TRACK[SHAPE_TRACK.length - 2];
    const t0 = unfold.until + 0.3;
    const seconds = FLIGHT_START - t0 + 0.2;
    rustle(t0, seconds, (t) => Math.sin(Math.PI * clamp(t / seconds, 0, 1)) ** 1.5, -20, 7);
    cue(t0, "Wings unfold", "a soft feather rustle");

    // the flight (kept)
    const fs = FLIGHT_END - FLIGHT_START + 0.5;
    const speed = (t: number) => {
      const d = (flightProgress(t + 0.01) - flightProgress(t - 0.01)) / 0.02;
      return clamp(d / 1.6, 0, 1);
    };
    const panAt = (t: number) => screenPan(toScreenFinal(flightPos(FLIGHT_START + t), FLIGHT_START + t).x);
    air(FLIGHT_START, fs, (t) => Math.pow(speed(FLIGHT_START + t), 1.3), (t) => 350 + 1500 * speed(FLIGHT_START + t), -12, panAt, 1.1, 0.35);
    cue(FLIGHT_START, "Flight up the S-curve", "a rustling whoosh that follows the soul's speed and side (kept)");
  }

  // ------------------------------------------------ the spark writes
  const glideLetters = (a: number, b: number, letters: number, gain: number, x0: number, x1: number) => {
    for (let j = 0; j < letters; j++) {
      const p = invInOut((j + 0.5) / letters);
      letter(a + p * (b - a), gain - 2 * Math.abs(Math.sin(j * 1.7)), screenPan(x0 + (x1 - x0) * ((j + 0.5) / letters)), j);
    }
  };
  if (want("text")) {
    glass(SPARK.birth, midi(N.A5), -24, 0.5, 0.9);
    cue(SPARK.birth, "A spark is born", "one small high glass note (kept)");
    const letters = LINES.map((l) => l.text.replace(/ /g, "").length);
    accent(SPARK.breakLand, [N.D4, N.A4], -10, -0.3);
    cue(SPARK.breakLand, `"${LINES[0].text}" lands`, "a fingertip knock, two kalimba notes (D–A), a pinch of crackle");
    glideLetters(SPARK.line2Land, SPARK.line2End, letters[1], -17, 140, 760);
    cue(SPARK.line2Land, `"${LINES[1].text}" is written`, "one soft pencil stroke per letter");
    accent(SPARK.keepLand, [N.A3, N.E4], -10, -0.3);
    cue(SPARK.keepLand, `"${LINES[2].text}" lands`, "the same, a fifth lower (A–E)");
    glideLetters(SPARK.line4Land, SPARK.line4End, letters[3], -17, 140, 800);
    put(SPARK.line4End + 0.02, knock({ f: 320, t60: 0.06, seed: seed++ }), -18, 0.4, 0.1);
    cue(SPARK.line4Land, `"${LINES[3].text}" is written`, "pencil strokes; the full stop a tiny tap");
  }

  // ------------------------------------------------ the old words are inhaled
  if (want("inhale")) {
    // a close inhale, rising
    const len = T.inhaleEnd - T.inhale;
    air(T.inhale, len + 0.04, (t) => (t / len) ** 1.8 * (t < len ? 1 : 0), (t) => 900 + 2200 * (t / len), -18, () => 0.25, 1.4, 0.05);
    // and the letters drawn in: crackle and kalimba, built forwards in a small room, then played backwards
    const local = new Bus(len + 0.3);
    const lsend = new Bus(len + 0.3);
    [N.A4, N.D5, N.Fs5].forEach((m, k) => {
      const x = tine({ freq: midi(m), t60: 1.2, seed: seed++ });
      local.addMono(0.02 * k, x, db(-12), (k - 1) * 0.4);
      lsend.addMono(0.02 * k, x, db(-6), (k - 1) * 0.4);
    });
    const c = crackle({ seconds: len, density: (x) => 900 * Math.exp(-x / 0.35), seed: seed++, width: 1, tone: 3400 });
    local.addStereo(0, c.L, c.R, db(-8));
    local.add(reverb(lsend, { size: 0.8, damp: 0.4, predelay: 0.01 }), 1);
    const n = Math.round(len * SR);
    const l = reverse(local.L.subarray(0, n));
    const r = reverse(local.R.subarray(0, n));
    shape(l, (t) => clamp(t / (len * 0.6), 0, 1) ** 2);
    shape(r, (t) => clamp(t / (len * 0.6), 0, 1) ** 2);
    dry.addStereo(T.inhale, l, r, db(-9));
    cue(T.inhale, "The soul inhales the old words", "a close rising inhale; crackle and kalimba played backwards, drawn in");
  }

  // ------------------------------------------------ it writes the new words
  if (want("text2")) {
    air(T.launch, T.line1Land - T.launch + 0.1, (t) => Math.sin(Math.PI * clamp(t / 0.5, 0, 1)), (t) => 600 + 900 * t, -26, (t) => 0.4 - t, 1.2, 0.2);
    cue(T.launch, "The soul launches", "a small breath of air");
    glideLetters(T.line1Land, T.line1End, "Meaning".length, -17, 120, 640);
    cue(T.line1Land, '"Meaning" is written', "pencil strokes");
    glideLetters(T.line2Land, T.line2End, "inthe".length, -18, 120, 460);
    cue(T.line2Land, '"in the" is written', "pencil strokes");
    accent(T.impact, [N.D4, N.Fs4, N.A4], -9, 0);
    putStereo(T.impact + 0.01, crackle({ seconds: 0.4, density: (x) => 2200 * Math.exp(-x / 0.1), seed: seed++, width: 0.9, tone: 3000 }), -13, 0.15);
    cue(T.impact, '"comments." lands', "the ending's main accent: a knock, a D major kalimba chord, the letters bursting out as crackle");
  }

  // ------------------------------------------------ the wing is drawn out to the bubble
  if (want("pull")) {
    air(T.dive, T.touch - T.dive + 0.05, (t) => Math.sin(Math.PI * clamp(t / (T.touch - T.dive + 0.05), 0, 1)), (t) => 700 + 1600 * t, -22, (t) => -1.4 * t, 1.2, 0.2);
    cue(T.dive, "Dive to the left wing", "a short rush of air");
    put(T.touch, tine({ freq: midi(N.A4), t60: 1.4, seed: seed++ }), -16, screenPan(TOUCH.x), 0.4);
    putStereo(T.touch, crackle({ seconds: 0.4, density: (x) => 900 * Math.exp(-x / 0.08), seed: seed++, width: 0.4, tone: 3000 }), -12, 0.1);
    cue(T.touch, "Touches the wing", "one kalimba note and a pinch of crackle where it enters");
    // the lines stretch like threads drawn tight: a crackle that thickens while they move,
    // and a thin whistle of air that rises as they converge
    const seconds = T.arrive - T.extend + 0.3;
    const pull = (t: number) => {
      let e = 0;
      for (let i = PULL_FROM; i < 24; i++) e += clamp(pullState(i, T.extend + t).e, 0, 1);
      return e / (24 - PULL_FROM);
    };
    const moving = (t: number) => clamp((pull(t + 0.02) - pull(t - 0.02)) / 0.04, 0, 3) / 3;
    putStereo(T.extend, crackle({ seconds, density: (t) => 30 + 900 * moving(t), seed: seed++, width: 0.7, tone: 3800 }), -16, 0.15);
    const fade = (t: number) => (t < seconds - 0.3 ? 1 : Math.exp(-(t - seconds + 0.3) / 0.08));
    air(T.extend, seconds, (t) => Math.min(1, t / 0.3) * (0.3 + 0.7 * pull(t)) * fade(t), (t) => 700 + 1300 * pull(t), -23, (t) => -0.6 + 0.9 * pull(t), 12, 0.3);
    cue(T.extend, "The wing's top edge stretches toward the bubble", "threads drawn tight: crackle that thickens with the pull, a thin whistle of air rising as the lines converge");
  }

  // ------------------------------------------------ the bubble
  if (want("bubble")) {
    const pan = screenPan(BUBBLE_CENTER.x);
    put(T.bubble, scratch({ seconds: T.bubbleEnd - T.bubble, seed: seed++, tone: 2800 }), -18, pan, 0.2);
    cue(T.bubble, "The bubble is drawn", "one pencil stroke around it");
    put(T.burst, drop({ f0: 280, f1: 820, t60: 0.1 }), -14, pan, 0.3);
    cue(T.burst, "The soul bursts inside the bubble", "a soft round water drop");
    DOTS.forEach((d, k) => put(T.split + 0.04 * k, drop({ f0: 700 + 120 * k, f1: 1500 + 200 * k, t60: 0.05 }), -22, screenPan(d.dot.x), 0.2));
    cue(T.split, "Splits into three dots", "three tiny drops");
    // typing: a muted key press as each dot starts its bounce (finale.ts typingPulse: 0.52 s cycle, 0.13 s apart)
    for (let n = 0; ; n++) {
      if (T.typing + n * 0.52 >= T.bars) break;
      DOTS.forEach((d, k) => {
        const t = T.typing + k * 0.13 + n * 0.52;
        if (t < T.bars && typingPulse(t + 0.05, k) > 0) put(t, keyTap({ seed: seed++, pitch: 1 + 0.06 * k }), -13 - 3 * n, screenPan(d.dot.x), 0.1);
      });
    }
    cue(T.typing, "Typing dots", "muted key presses, one per bounce");
    [N.D4, N.A4, N.Fs5].forEach((m, k) => put(T.bars + 0.05 * k, tine({ freq: midi(m), t60: 2.2, seed: seed++ }), -20, (k - 1) * 0.3, 0.4));
    cue(T.bars, "Dots become the bubble's bars", "a soft kalimba chord, D major");
    // calm pulse: every signal arc (Comments.tsx: k * 0.38 s apart, every 1.15 s) is a quiet kalimba note
    const arcNotes = [N.A4, N.D5, N.Fs5];
    for (let n = 0; ; n++) {
      let any = false;
      for (let k = 0; k < 3; k++) {
        const t = T.barsEnd + k * 0.38 + n * 1.15;
        if (t > T.end - 0.15) continue;
        any = true;
        put(t, tine({ freq: midi(arcNotes[k]), t60: 1.1, seed: seed++ }), -23 - 2 * n, pan + 0.15, 0.4);
      }
      if (!any) break;
    }
    cue(T.barsEnd, "Calm pulse: signal arcs toward the comment button", "quiet kalimba notes A–D–F♯, one per arc, every 1.15 s");
  }

  cues.sort((a, b) => a.t - b.t);
  return { dry, send, cues };
};

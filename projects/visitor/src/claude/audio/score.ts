// The sound of "A thought is a visitor". Effects only. Times come from the
// film's timeline, so when the picture moves the sound moves with it.
//
// Each thought has its own material: the spring is kalimba and drops, the wheel
// is a rolling rustle, the tangle is nervous crackle and pencil. The key is
// small glass and metal; the soul is warm tone and breath. The house answers in
// wood, only while a thought holds the key. The pause is true silence.

import { BEAT, E, SPARK, handAt, soulAt, wheelWeight } from "../src/timeline";
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
  scratch,
  shape,
  svf,
  tine,
  warmTone,
} from "./dsp";

export type Cue = { t: number; event: string; sound: string };
export type Score = { dry: Bus; send: Bus; cues: Cue[] };

const N = {
  D3: 50,
  G3: 55,
  A3: 57,
  D4: 62,
  E4: 64,
  Fs4: 66,
  A4: 69,
  B4: 71,
  D5: 74,
  E5: 76,
  Fs5: 78,
  A5: 81,
};
/** Pan from x in the 941-wide frame. */
const panX = (x: number) => clamp(((x - 470) / 470) * 0.6, -0.6, 0.6);
const DOOR = panX(668);
const PORCH = panX(810);

export const buildScore = (
  duration: number,
  only?: (event: string) => boolean,
): Score => {
  const dry = new Bus(duration);
  const send = new Bus(duration);
  const cues: Cue[] = [];
  let seed = 100;
  const want = (g: string) => !only || only(g);
  const put = (
    t: number,
    sig: Float64Array,
    gain: number,
    pan: number,
    wet: number,
  ) => {
    dry.addMono(t, sig, db(gain), pan);
    send.addMono(t, sig, db(gain) * wet, pan);
  };
  const grains = (
    t: number,
    o: {
      seconds: number;
      density: (t: number) => number;
      tone?: number;
      width?: number;
    },
    gain: number,
    wet: number,
    pan = 0,
  ) => {
    const s = crackle({ ...o, seed: seed++ });
    const gl = 1 - Math.max(0, pan);
    const gr = 1 + Math.min(0, pan);
    dry.addStereo(t, s.L, s.R, db(gain) * gl, db(gain) * gr);
    send.addStereo(t, s.L, s.R, db(gain) * wet * gl, db(gain) * wet * gr);
  };
  const cue = (t: number, event: string, sound: string) =>
    cues.push({ t, event, sound });
  const air = (
    t0: number,
    seconds: number,
    env: (t: number) => number,
    fc: (t: number) => number,
    gain: number,
    pan: (t: number) => number,
    q = 0.9,
    wet = 0.25,
    muffle = 0,
  ) => {
    const side = () => {
      let x = svf(noise(seconds, seed++), (i) => fc(i / SR), q, "band");
      if (muffle) x = onePole(x, muffle);
      return shape(x, env);
    };
    const a = side();
    const b = side();
    const l = new Float64Array(a.length);
    const r = new Float64Array(a.length);
    for (let i = 0; i < a.length; i++) {
      const p = clamp(pan(i / SR), -1, 1);
      l[i] = (0.75 * a[i] + 0.25 * b[i]) * (1 - Math.max(0, p));
      r[i] = (0.25 * a[i] + 0.75 * b[i]) * (1 + Math.min(0, p));
    }
    dry.addStereo(t0, l, r, db(gain));
    send.addStereo(t0, l, r, db(gain) * wet);
  };
  const bump =
    (seconds: number, p = 1) =>
    (t: number) =>
      Math.pow(Math.sin(Math.PI * clamp(t / seconds, 0, 1)), p);
  /** The key's own voice: a tiny inharmonic ting. */
  const ting = (t: number, gain: number, pan: number, f = 2350, t60 = 0.7) =>
    put(
      t,
      modal(
        [
          { f, a: 1, t60 },
          { f: f * 1.51, a: 0.4, t60: t60 * 0.6 },
          { f: f * 2.76, a: 0.16, t60: t60 * 0.3 },
        ],
        0.001,
        seed++,
      ),
      gain,
      pan,
      0.35,
    );
  const note = (
    t: number,
    m: number,
    gain: number,
    pan: number,
    t60 = 1.4,
    wet = 0.35,
  ) => put(t, tine({ freq: midi(m), t60, seed: seed++ }), gain - 5, pan, wet);
  const tap = (
    t: number,
    f: number,
    gain: number,
    pan: number,
    t60 = 0.12,
    wet = 0.15,
  ) => put(t, knock({ f, t60, seed: seed++ }), gain, pan, wet);
  /** Old wood giving a little: a low, grainy, gliding rub. */
  const creak = (
    t0: number,
    seconds: number,
    f0: number,
    f1: number,
    gain: number,
    pan: number,
  ) => {
    const x = new Float64Array(Math.round(seconds * SR));
    const src = svf(
      noise(seconds, seed++),
      (i) => f0 + (f1 - f0) * (i / x.length),
      14,
      "band",
    );
    const n = noise(seconds, seed++);
    let g = 0;
    for (let i = 0; i < x.length; i++) {
      if (i % 420 === 0) g = 0.35 + 0.65 * Math.abs(n[i]);
      x[i] = src[i] * g * bump(seconds)(i / SR);
    }
    put(t0, onePole(x, 2600), gain, pan, 0.2);
  };
  /** The key slides on the floor: brightness and level follow the hand's speed. */
  const slide = (a: number, b: number, gain: number) => {
    const seconds = b - a;
    const speed = (t: number) =>
      clamp(
        Math.abs(handAt(a + t + 0.008).x - handAt(a + t - 0.008).x) /
          0.016 /
          600,
        0,
        1.2,
      );
    air(
      a,
      seconds,
      (t) =>
        speed(t) * clamp(t / 0.02, 0, 1) * clamp((seconds - t) / 0.012, 0, 1),
      (t) => 2200 + 1500 * speed(t),
      gain,
      (t) => panX(handAt(a + t).x),
      2.2,
      0.08,
    );
    grains(
      a,
      { seconds, density: (t) => 260 * speed(t), tone: 4600, width: 0.3 },
      gain + 3,
      0.08,
      panX(600),
    );
  };
  const letters = (
    a: number,
    b: number,
    count: number,
    gain: number,
    x0: number,
    x1: number,
  ) => {
    for (let j = 0; j < count; j++) {
      const u = (j + 0.5) / count;
      put(
        a + u * (b - a),
        scratch({
          seconds: 0.05 + 0.02 * Math.abs(Math.sin(j * 1.9)),
          seed: seed++,
          tone: 3000 + 500 * Math.sin(j * 2.7),
        }),
        gain - 2 * Math.abs(Math.sin(j * 1.7)),
        panX(x0 + (x1 - x0) * u),
        0.15,
      );
    }
  };

  // ------------------------------------------------ the spring arrives and knocks
  if (want("spring")) {
    put(0.02, drop({ f0: 260, f1: 520, t60: 0.08 }), -19, PORCH, 0.2);
    E.hops.forEach((t, k) => {
      tap(t, 260 - 30 * k, -17, PORCH, 0.07);
      note(t, k ? N.A4 : N.D4, -19, PORCH, 0.7);
      put(
        t + 0.03,
        drop({ f0: 300, f1: 620 - 120 * k, t60: 0.09 }),
        -22,
        PORCH,
        0.2,
      );
      cue(
        t,
        `Spring lands, hop ${k + 1}`,
        "a fingertip tap, a short kalimba note and a drop springing up",
      );
    });
    // it leaves in three hops
    [0, 1, 2].forEach((k) => {
      const t = E.bored + 0.15 + ((k + 0.02) / 3) * (6.55 - E.bored - 0.15);
      put(
        t,
        drop({ f0: 280, f1: 560 + 90 * k, t60: 0.09 }),
        -20 - 3 * k,
        0.5,
        0.2,
      );
      note(t, [N.A4, N.E5, N.A5][k], -22 - 3 * k, 0.5, 0.5);
    });
    cue(
      E.bored + 0.15,
      "Spring gets bored and hops away",
      "three drops and kalimba notes, higher and further off",
    );
  }
  if (want("knock")) {
    E.knock.forEach((t, k) => {
      tap(t, 330 + 35 * k, -8 - k, DOOR, 0.1);
      note(t + 0.01, k ? N.A4 : N.E4, -23, DOOR, 0.5);
    });
    cue(
      E.knock[0],
      "First knock, twice",
      "two light, curious fingertip knocks with a hint of kalimba",
    );
    tap(E.knock2, 215, -7, DOOR, 0.16);
    cue(E.knock2, "Wheel knocks, once", "one round, confident knock");
    E.knock3.forEach((t, k) => {
      tap(t, 178 + 6 * k, -8 + k, DOOR, 0.1);
      grains(
        t,
        {
          seconds: 0.18,
          density: (x) => 900 * Math.exp(-x / 0.04),
          tone: 2500,
          width: 0.3,
        },
        -17,
        0.1,
        DOOR,
      );
    });
    cue(
      E.knock3[0],
      "Tangle knocks, three times",
      "three close, dry, rising knocks with nervous crackle",
    );
    tap(E.gentle, 250, -27, DOOR, 0.16, 0.3);
    cue(
      E.gentle,
      "The gentlest knock",
      "the softest sound of the film, alone after silence",
    );
  }

  // ------------------------------------------------ the key
  if (want("key")) {
    const given = (
      form: number,
      push: number[],
      take: number,
      click: number,
    ) => {
      ting(form, -27, panX(520), 2100, 0.9);
      slide(push[0] - 0.02, push[1], -22);
      ting(push[1] - 0.02, -25, panX(700), 2500, 0.4);
      // the tendril winds round it
      put(
        take - 0.16,
        scratch({ seconds: 0.16, seed: seed++, tone: 4200 }),
        -25,
        PORCH,
        0.15,
      );
      ting(take + 0.02, -24, PORCH, 2650, 0.5);
      put(click - 0.07, keyTap({ seed: seed++, pitch: 2.4 }), -14, DOOR, 0.15);
      put(click, keyTap({ seed: seed++, pitch: 1.5 }), -9, DOOR, 0.2);
      ting(click + 0.01, -21, DOOR, 1900, 0.8);
      // the soul loses its light
      put(
        click + 0.02,
        drop({ f0: 720, f1: 230, t60: 0.22 }),
        -19,
        panX(360),
        0.35,
      );
    };
    given(1.5, E.push1, E.take1, E.click1);
    cue(
      E.push1[0],
      "The key goes under the door",
      "metal sliding on the floor, following the hand's speed; a tiny ting outside",
    );
    cue(
      E.click1,
      "Click: the spring has the key",
      "a two-part lock click, a ting, and the soul's light dropping",
    );
    given(6.86, E.push2, E.take2, E.click2);
    cue(E.push2[0], "The key again, twice as fast", "the same sounds, shorter");
    cue(E.click2, "Click: the wheel has the key", "the same click");
    const back = (t: number, span: number) => {
      air(
        t,
        span * 0.5,
        bump(span * 0.5),
        (x) => 900 + 2600 * x,
        -23,
        (x) => 0.5 - x,
        1.4,
      );
      [0.2, 0.33, 0.43].forEach((u, k) =>
        ting(
          t + u * span * 1.3,
          -21 - 3 * k,
          panX(700 - 110 * k),
          2300 + 260 * k,
          0.3,
        ),
      );
      put(
        t + span * 0.55,
        scratch({ seconds: 0.2, seed: seed++, tone: 3400 }),
        -25,
        panX(520),
        0.1,
      );
      // the light comes home
      const home = t + span * 1.2;
      put(home, drop({ f0: 260, f1: 700, t60: 0.18 }), -18, panX(290), 0.3);
      [N.D4, N.A4].forEach((m, k) =>
        note(home + 0.03 + 0.04 * k, m, -18, panX(290), 1.2),
      );
    };
    back(E.bored, 0.58);
    back(E.bored2, 0.48);
    cue(
      E.bored,
      "The key is thrown back, the light returns",
      "a flick of air, tings skipping on the floor, a rising drop and two warm notes",
    );
    ting(10.3, -27, panX(520), 2100, 0.5);
    slide(E.push3, E.halt, -21);
    put(
      E.halt,
      modal([{ f: 2800, a: 1, t60: 0.035 }], 0.0005, seed++),
      -24,
      panX(650),
      0,
    );
    cue(E.halt, "The key stops halfway", "the slide is cut dead, then nothing");
    slide(E.choose, 12.22, -19);
    ting(12.55, -21, panX(440), 2100, 1.4);
    ting(E.keyDown - 0.02, -22, panX(260), 1900, 0.5);
    tap(E.keyDown - 0.02, 520, -24, panX(260), 0.04);
    cue(E.keyDown, "The key is laid down", "one small ting on the floor");
  }

  // ------------------------------------------------ the soul
  if (want("soul")) {
    // asleep: one breath of its lines
    air(
      0.1,
      1.2,
      bump(1.2, 2),
      (t) => 500 + 250 * Math.sin(t * 2),
      -31,
      () => panX(290),
      0.8,
      0.2,
      1800,
    );
    // the arm reaches
    for (const [a, b] of [
      [1.25, 1.8],
      [6.7, 6.95],
      [10.15, 10.6],
    ]) {
      grains(
        a,
        {
          seconds: b - a,
          density: (t) => 110 * bump(b - a)(t),
          tone: 3000,
          width: 0.3,
        },
        -19,
        0.15,
        panX(400),
      );
      air(
        a,
        b - a,
        bump(b - a),
        () => 1300,
        -29,
        () => panX(400),
        1,
      );
    }
    cue(
      1.25,
      "The lines become an arm",
      "fine thread-like crackle and a little air",
    );
    // choosing: breath in, warmth
    air(
      E.choose,
      0.65,
      (t) =>
        Math.pow(clamp(t / 0.6, 0, 1), 1.6) * clamp((0.65 - t) / 0.06, 0, 1),
      (t) => 500 + 1200 * t,
      -21,
      () => panX(310),
      0.8,
      0.15,
    );
    [N.D3, N.A3, N.Fs4].forEach((m, k) => {
      const x = warmTone({
        freq: midi(m),
        seconds: 2.6,
        seed: seed++,
        harmonics: 3,
      });
      shape(
        x,
        (t) =>
          Math.pow(clamp(t / 0.7, 0, 1), 2) *
          Math.exp(-Math.max(0, t - 1.0) / 0.55) *
          clamp((2.6 - t) / 0.3, 0, 1),
      );
      put(
        E.choose + 0.1,
        onePole(x, 1100),
        -29,
        panX(310) + (k - 1) * 0.2,
        0.35,
      );
    });
    [N.D4, N.Fs4, N.A4].forEach((m, k) =>
      note(12.5 + 0.06 * k, m, -18, panX(310), 1.8),
    );
    cue(
      E.choose,
      "The choice: the key comes back",
      "a breath in, a warm D major swell, three kalimba notes as the hand closes",
    );
    // rolling to the door
    const s = E.rest - E.roll;
    const speed = (t: number) =>
      clamp(
        (soulAt(E.roll + t + 0.01).x - soulAt(E.roll + t - 0.01).x) /
          0.02 /
          600,
        0,
        1,
      );
    air(
      E.roll,
      s,
      (t) => speed(t) * clamp((s - t) / 0.05, 0, 1),
      () => 600,
      -19,
      (t) => panX(soulAt(E.roll + t).x),
      0.7,
      0.2,
      1600,
    );
    grains(
      E.roll,
      { seconds: s, density: (t) => 120 * speed(t), tone: 2400, width: 0.4 },
      -20,
      0.15,
      panX(450),
    );
    cue(E.roll, "The soul rolls to the door", "a soft, dark roll over threads");
    tap(E.rest - 0.12, 165, -17, panX(600), 0.2, 0.25);
    [N.D4, N.A4].forEach((m, k) =>
      note(E.rest - 0.1 + 0.05 * k, m, -20, panX(590), 2.0),
    );
    cue(
      E.rest,
      "It leans on the door",
      "a padded touch on wood, an open fifth",
    );
  }

  // ------------------------------------------------ the spring rules the house
  if (want("bounce")) {
    let k = 0;
    for (let peak = E.click1 + 0.3; peak < E.bored - 0.1; peak += BEAT, k++) {
      creak(peak - 0.26, 0.3, 320, 620, -10, 0);
      [N.D4, N.A4, N.B4, N.E5]
        .slice(0, 2 + (k % 3))
        .forEach((m, j) =>
          note(
            peak - 0.04 + 0.05 * j,
            m + (k % 2 ? 2 : 0),
            -16 - j,
            (j % 2 ? 1 : -1) * 0.3,
            1.0,
          ),
        );
      put(
        peak - 0.24,
        drop({ f0: 240, f1: 680, t60: 0.16 }),
        -17,
        panX(400),
        0.3,
      );
      const low = peak + BEAT / 2;
      if (low < E.bored) {
        tap(low, 130, -11, 0, 0.16);
        creak(low - 0.1, 0.22, 480, 260, -12, 0);
      }
      air(
        peak - 0.12,
        0.5,
        bump(0.5, 1.4),
        (t) => 700 + 700 * t,
        -23,
        (t) => (k % 2 ? 1 : -1) * (0.5 - 1.6 * t),
        0.7,
      );
    }
    cue(
      E.click1 + 0.3,
      "The house bounces",
      "wood creaks up, kalimba and a springing drop for the toss; a soft wooden thump down",
    );
    creak(E.bored + 0.02, 0.35, 520, 240, -12, 0);
    tap(6.0, 190, -15, panX(290), 0.14);
    cue(
      6.0,
      "The house straightens, the soul lands",
      "a falling creak, a padded tap",
    );
  }

  // ------------------------------------------------ the wheel
  if (want("wheel")) {
    const roll = (
      t0: number,
      seconds: number,
      env: (t: number) => number,
      gain: number,
      pan: (t: number) => number,
    ) =>
      air(
        t0,
        seconds,
        (t) => env(t) * (0.6 + 0.4 * Math.sin(t * 34)),
        (t) => 620 + 160 * Math.sin(t * 34),
        gain,
        pan,
        1.1,
        0.15,
        2600,
      );
    roll(
      6.12,
      0.55,
      (t) => clamp(t / 0.25, 0, 1) * clamp((0.55 - t) / 0.12, 0, 1),
      -14,
      (t) => 0.7 - 0.4 * t,
    );
    cue(6.15, "The wheel rolls in", "a rolling rustle from the right");
    roll(E.bored2 + 0.1, 0.65, bump(0.65), -15, (t) => 0.35 + 0.5 * t);
    cue(E.bored2 + 0.1, "The wheel rolls off", "the same rustle, leaving");
    const s = E.bored2 - E.click2 + 0.3;
    roll(
      E.click2,
      s,
      (t) =>
        clamp(wheelWeight(E.click2 + t), 0, 1.1) * clamp((s - t) / 0.2, 0, 1),
      -17,
      () => PORCH,
    );
    // the whole house tries to roll
    creak(E.click2 + 0.03, 0.4, 240, 520, -9, -0.1);
    for (let k = 0; k < 2; k++)
      creak(
        E.click2 + 0.45 + 0.5 * k,
        0.36,
        k ? 260 : 460,
        k ? 440 : 280,
        -13,
        k ? 0.2 : -0.2,
      );
    air(
      E.click2 + 0.02,
      s,
      (t) =>
        clamp(t / 0.15, 0, 1) *
        clamp((s - t) / 0.35, 0, 1) *
        (0.7 + 0.3 * Math.sin(t * 4.2)),
      (t) => 800 + 350 * Math.sin(t * 4.2),
      -20,
      (t) => 0.55 * Math.sin(t * 4.2 - 1.2),
      0.8,
    );
    put(
      E.click2 + 0.05,
      scratch({ seconds: 0.4, seed: seed++, tone: 1500 }),
      -18,
      0.1,
      0.2,
    );
    [N.G3, N.D4].forEach((m, k) =>
      note(E.click2 + 0.28 + 0.06 * k, m, -18, 0.15, 1.2),
    );
    cue(
      E.click2 + 0.05,
      "The house rolls like a bowl",
      "wood twisting, circling air, the soul sliding up the wall",
    );
    creak(E.bored2 + 0.02, 0.32, 480, 230, -12, 0);
    tap(9.0, 190, -16, panX(290), 0.14);
  }

  // ------------------------------------------------ the tangle
  if (want("tangle")) {
    grains(
      9.1,
      {
        seconds: 1.75,
        density: (t) =>
          260 *
          clamp(t / 0.3, 0, 1) *
          (0.5 + 0.5 * Math.sin(t * 9) ** 2) *
          clamp((1.75 - t) / 0.12, 0, 1),
        tone: 2700,
        width: 0.4,
      },
      -17,
      0.1,
      PORCH,
    );
    for (let k = 0; k < 6; k++)
      put(
        9.15 + 0.27 * k,
        scratch({ seconds: 0.16, seed: seed++, tone: 1700 + 260 * (k % 3) }),
        -21,
        PORCH,
        0.12,
      );
    cue(9.1, "The tangle arrives", "dry, restless crackle and scribbling");
    // the storm stays outside: gusts on the right, muffled, breaking on the wall
    const g0 = E.storm;
    const period = (2 * Math.PI) / 11;
    air(
      g0 - 0.05,
      1.5,
      (t) =>
        clamp(t / 0.2, 0, 1) *
        clamp((1.5 - t) / 0.5, 0, 1) *
        (0.6 + 0.4 * Math.sin((t * 11) / 1)),
      (t) => 520 + 240 * Math.sin(t * 11),
      -10,
      () => 0.5,
      0.6,
      0.3,
      1500,
    );
    for (let k = 0; k < 3; k++) {
      const t = g0 + 0.28 + k * period * 0.75;
      grains(
        t,
        {
          seconds: 0.4,
          density: (x) => 800 * Math.exp(-x / 0.08),
          tone: 2300,
          width: 0.4,
        },
        -14 - k,
        0.2,
        0.4,
      );
      tap(t, 120, -15 - k, 0.3, 0.14);
    }
    cue(
      E.storm,
      "The storm breaks on the house",
      "muffled gusts on the right only, crackling where they hit the wall; none on the left",
    );
    // it lets go
    air(
      E.calm + 0.05,
      1.3,
      (t) =>
        clamp(t / 0.15, 0, 1) *
        Math.exp(-t / 0.5) *
        clamp((1.3 - t) / 0.3, 0, 1),
      (t) => 1100 - 500 * t,
      -19,
      () => PORCH,
      0.7,
      0.3,
      2400,
    );
    for (let k = 0; k < 5; k++)
      put(
        E.calm + 0.15 + 0.22 * k,
        scratch({ seconds: 0.3, seed: seed++, tone: 1900 - 160 * k }),
        -24 - k,
        PORCH,
        0.2,
      );
    cue(
      E.calm,
      "The tangle lets go",
      "a long breath out, slow loops of pencil settling",
    );
  }

  // ------------------------------------------------ the phrase
  if (want("text")) {
    const bell = (t: number, m: number, gain: number, pan: number) =>
      put(
        t,
        modal(
          [
            { f: midi(m), a: 1, t60: 1.6 },
            { f: midi(m) * 2.32, a: 0.4, t60: 0.9 },
            { f: midi(m) * 4.25, a: 0.15, t60: 0.5 },
          ],
          0.002,
          seed++,
        ),
        gain,
        pan,
        0.5,
      );
    bell(SPARK.leave, N.A5, -25, panX(570));
    air(
      SPARK.leave,
      SPARK.line1 - SPARK.leave + 0.1,
      bump(0.45),
      (t) => 900 + 1800 * t,
      -27,
      (t) => 0.2 - 2 * t,
      1.2,
    );
    cue(
      SPARK.leave,
      "A spark leaves the soul",
      "one small glass note and a thread of air",
    );
    letters(SPARK.line1, SPARK.end1, "Athought".length, -19, 80, 640);
    letters(SPARK.line2, SPARK.end2, "isavisitor".length, -19, 80, 640);
    cue(
      SPARK.line1,
      "The phrase is written",
      "one soft pencil stroke per letter",
    );
    tap(SPARK.stop, 300, -20, panX(680), 0.08);
    [N.D4, N.A4, N.Fs5].forEach((m, k) =>
      note(SPARK.stop + 0.05 * k, m, -20 - k, (k - 1) * 0.3, 2.4, 0.5),
    );
    cue(
      SPARK.stop,
      "The full stop",
      "a tiny tap and a last quiet D major chord that fades by itself",
    );
  }

  cues.sort((a, b) => a.t - b.t);
  return { dry, send, cues };
};

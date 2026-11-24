// The sound of "A thought is a visitor". Effects only. Times come from the
// film's timeline, so when the picture moves the sound moves with it.
//
// Each thought has its own material: the spring is kalimba and drops, the wheel
// is round wooden turns, the tangle is restless wooden ticks. There is no
// sustained noise anywhere (the owner found hiss unpleasant). The key is
// small glass and metal; the soul is warm tone. The house answers in
// wood, only while a thought holds the key. The pause is true silence.

import { BEAT, E, SPARK, handAt, soulAt, wheelWeight } from "../src/timeline";
import {
  Bus,
  clamp,
  db,
  drop,
  keyTap,
  knock,
  midi,
  modal,
  noise,
  onePole,
  shape,
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
  /** Scattered soft wooden ticks: texture made of touches, never of hiss. */
  const ticks = (
    t0: number,
    seconds: number,
    rate: (t: number) => number,
    f: number,
    gain: number,
    pan: number,
  ) => {
    const r = noise(0.02, seed++);
    let i = 0;
    for (let t = 0.01; t < seconds; i++) {
      const k = rate(t);
      if (k > 0.5)
        put(
          t0 + t,
          modal(
            [
              { f: f * (1 + 0.28 * r[i % 900]), a: 1, t60: 0.05 },
              { f: f * 2.4, a: 0.2, t60: 0.02 },
            ],
            0.002,
            seed++,
          ),
          gain - 6 * Math.abs(r[(i + 300) % 900]),
          pan + 0.15 * r[(i + 600) % 900],
          0.15,
        );
      t += (1 / Math.max(6, k)) * (1 + 0.5 * r[(i + 100) % 900]);
    }
  };
  /** A swell of warm tone: breath, gust, glow. */
  const swell = (
    t0: number,
    seconds: number,
    notes: number[],
    env: (t: number) => number,
    gain: number,
    pan: number,
    bright = 900,
  ) =>
    notes.forEach((m, k) =>
      put(
        t0,
        onePole(
          shape(
            warmTone({ freq: midi(m), seconds, seed: seed++, harmonics: 3 }),
            (t) =>
              env(t) *
              clamp(t / 0.04, 0, 1) *
              clamp((seconds - t) / 0.08, 0, 1),
          ),
          bright,
        ),
        gain,
        pan + (k - (notes.length - 1) / 2) * 0.15,
        0.35,
      ),
    );
  const cue = (t: number, event: string, sound: string) =>
    cues.push({ t, event, sound });
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
  /** Old wood giving a little: a run of tiny low knocks that slip faster or slower. */
  const creak = (
    t0: number,
    seconds: number,
    f0: number,
    f1: number,
    gain: number,
    pan: number,
  ) => {
    let i = 0;
    for (let t = 0; t < seconds; i++) {
      const u = t / seconds;
      put(
        t0 + t,
        modal(
          [
            { f: (f0 + (f1 - f0) * u) * 0.62, a: 1, t60: 0.07 },
            { f: (f0 + (f1 - f0) * u) * 1.5, a: 0.25, t60: 0.03 },
          ],
          0.003,
          seed++,
        ),
        gain - 12 + 6 * Math.sin(Math.PI * u),
        pan,
        0.2,
      );
      t += 0.05 - 0.018 * Math.sin(Math.PI * u) + 0.006 * Math.sin(i * 2.3);
    }
  };
  /** The key slides on the floor: brightness and level follow the hand's speed. */
  const slide = (a: number, b: number, gain: number) => {
    // one small glass touch for every step the key travels
    let last = handAt(a).x;
    let n = 0;
    for (let t = a; t <= b; t += 0.004) {
      const x = handAt(t).x;
      if (Math.abs(x - last) < 19) continue;
      last = x;
      put(
        t,
        modal(
          [
            { f: 1250 + 70 * ((n * 3) % 5), a: 1, t60: 0.09 },
            { f: 2900, a: 0.12, t60: 0.04 },
          ],
          0.002,
          seed++,
        ),
        gain - 2 + 2 * Math.sin(n++ * 1.7),
        panX(x),
        0.2,
      );
    }
  };
  const letters = (
    a: number,
    b: number,
    count: number,
    gain: number,
    x0: number,
    x1: number,
  ) => {
    const scale = [N.D5, N.E5, N.Fs5, N.A5];
    for (let j = 0; j < count; j++) {
      const u = (j + 0.5) / count;
      put(
        a + u * (b - a),
        tine({ freq: midi(scale[(j * 3) % 4]), t60: 0.22, seed: seed++ }),
        gain - 5 - 2 * Math.abs(Math.sin(j * 1.7)),
        panX(x0 + (x1 - x0) * u),
        0.25,
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
    });
    cue(
      E.knock3[0],
      "Tangle knocks, three times",
      "three close, dry, rising knocks",
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
      [0, 1, 2].forEach((k) =>
        ting(take - 0.15 + 0.05 * k, -31, PORCH, 1700 + 220 * k, 0.12),
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
      "small glass touches, one per step the key travels; a tiny ting outside",
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
      [0.2, 0.33, 0.43].forEach((u, k) =>
        ting(
          t + u * span * 1.3,
          -21 - 3 * k,
          panX(700 - 110 * k),
          2300 + 260 * k,
          0.3,
        ),
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
      "tings skipping on the floor, a rising drop and two warm notes",
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
    swell(0.1, 1.3, [N.D3, N.A3], bump(1.3, 2), -33, panX(290));
    // the arm reaches
    for (const [a, b] of [
      [1.25, 1.8],
      [6.7, 6.95],
      [10.15, 10.6],
    ]) {
      [N.A3, N.D4, N.E4].forEach((m, k) =>
        note(a + ((b - a) * (k + 0.5)) / 3, m, -24, panX(360 + 50 * k), 0.4),
      );
    }
    cue(1.25, "The lines become an arm", "three soft low kalimba notes");
    // choosing: breath in, warmth
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
      "a warm D major swell, three kalimba notes as the hand closes",
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
    [0.16, 0.32, 0.46, 0.59, 0.72, 0.86].forEach((u, k) =>
      tap(
        E.roll + s * u,
        150 + 12 * (k % 3),
        -22 + 2 * speed(s * u),
        panX(soulAt(E.roll + s * u).x),
        0.1,
        0.2,
      ),
    );
    swell(E.roll, s + 0.3, [N.A3, N.D4], bump(s + 0.3), -31, panX(450));
    cue(
      E.roll,
      "The soul rolls to the door",
      "soft wooden touches and a low warm tone",
    );
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
    }
    cue(
      E.click1 + 0.3,
      "The house bounces",
      "wood gives in a run of low ticks, kalimba and a springing drop for the toss; a soft wooden thump down",
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
    ) => {
      // a round thing turning: soft wooden touches, a little uneven
      for (
        let t = 0.02, k = 0;
        t < seconds;
        t += 0.085 + 0.02 * Math.sin(k * 2.1), k++
      )
        tap(
          t0 + t,
          205 + 45 * (k % 3),
          gain - 4 + 20 * Math.log10(Math.max(0.05, Math.min(1, env(t)))),
          clamp(pan(t), -0.7, 0.7),
          0.08,
          0.2,
        );
    };
    roll(
      6.12,
      0.55,
      (t) => clamp(t / 0.25, 0, 1) * clamp((0.55 - t) / 0.12, 0, 1),
      -14,
      (t) => 0.7 - 0.4 * t,
    );
    cue(6.15, "The wheel rolls in", "soft wooden turns from the right");
    roll(E.bored2 + 0.1, 0.65, bump(0.65), -15, (t) => 0.35 + 0.5 * t);
    cue(E.bored2 + 0.1, "The wheel rolls off", "the same turns, leaving");
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
    swell(
      E.click2 + 0.02,
      s,
      [N.G3, N.D4],
      (t) => bump(s)(t) * (0.65 + 0.35 * Math.sin(t * 9)),
      -28,
      0,
    );
    put(E.click2 + 0.05, drop({ f0: 260, f1: 560, t60: 0.2 }), -20, 0.1, 0.3);
    [N.G3, N.D4].forEach((m, k) =>
      note(E.click2 + 0.28 + 0.06 * k, m, -18, 0.15, 1.2),
    );
    cue(
      E.click2 + 0.05,
      "The house rolls like a bowl",
      "wood twisting, a slow wavering tone, a drop for the soul going up the wall",
    );
    creak(E.bored2 + 0.02, 0.32, 480, 230, -12, 0);
    tap(9.0, 190, -16, panX(290), 0.14);
  }

  // ------------------------------------------------ the tangle
  if (want("tangle")) {
    ticks(
      9.1,
      1.72,
      (t) =>
        20 *
        clamp(t / 0.3, 0, 1) *
        (0.45 + 0.55 * Math.sin(t * 9) ** 2) *
        clamp((1.72 - t) / 0.12, 0, 1),
      620,
      -18,
      PORCH,
    );
    cue(9.1, "The tangle arrives", "dry, restless wooden ticks");
    // the storm stays outside: gusts on the right, muffled, breaking on the wall
    const g0 = E.storm;
    const period = (2 * Math.PI) / 11;
    swell(
      g0 - 0.05,
      1.5,
      [45, 50, 52],
      (t) =>
        clamp(t / 0.2, 0, 1) *
        clamp((1.5 - t) / 0.5, 0, 1) *
        (0.55 + 0.45 * Math.sin(t * 11)),
      -24,
      0.5,
      600,
    );
    for (let k = 0; k < 3; k++) {
      const t = g0 + 0.28 + k * period * 0.75;
      tap(t, 120, -13 - k, 0.35, 0.16);
      ticks(t, 0.28, (x) => 45 * Math.exp(-x / 0.12), 480, -17 - k, 0.4);
    }
    cue(
      E.storm,
      "The storm breaks on the house",
      "low muffled tone gusts and knocks on the right only",
    );
    // it lets go
    [N.A4, N.Fs4, N.E4, N.D4, N.A3].forEach((m, k) =>
      note(E.calm + 0.12 + 0.2 * k + 0.02 * k * k, m, -20 - k, PORCH, 1.1),
    );
    cue(E.calm, "The tangle lets go", "five kalimba notes stepping down");
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
    cue(SPARK.leave, "A spark leaves the soul", "one small glass note");
    letters(SPARK.line1, SPARK.end1, "Athought".length, -19, 80, 640);
    letters(SPARK.line2, SPARK.end2, "isavisitor".length, -19, 80, 640);
    cue(
      SPARK.line1,
      "The phrase is written",
      "one tiny kalimba note per letter",
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

---
date: 2026-10-20
author: claude
status: in progress
---

# Sound effects

**Idea.** Version 06 gets sound: effects only, no music, all synthesized in code and deterministic, so the soundtrack is committed and identical on every render. Warm and organic, with clean precise accents. The white lines are strings: strikes make them ring, the breakthrough opens them into a warm D major chord, and the wing drawn out to the bubble tightens them into one note. The film must still work muted.

**Details.**
- Source: `src/claude/audio/` — `dsp.ts` (plucked strings, glass and wood partials, thumps, filtered air), `score.ts` (every cue reads its time from `timeline.ts`, `ending.ts` and `finale.ts`), `master.ts` (room, BS.1770 loudness, look-ahead limiter, WAV), `render.mjs` (CLI).
- Pitches stay in D: open fifths and suspended notes while the shell resists, D major (add9) at the breakthrough, the same chord, very soft, when the bubble's bars appear.
- Target −14 LUFS integrated, peaks at −1.5 dBFS; nothing below ~30 Hz; thumps carry their weight in the 100–300 Hz harmonics so phones play them.
- Regenerate the map below with `node audio/render.mjs --map`.

**Sound map.**

| Time (s) | Event | Sound |
| ---: | --- | --- |
| 0.00 | Containment | dark low air under everything, thickening until the breakthrough |
| 0.30 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 0.80 | Gathering before a strike | a short breath in (noise rising 500 → 2200 Hz), cut at the strike |
| 1.20 | Strike 1 | soft low heartbeat thump (160 → 62 Hz), gently saturated |
| 1.20 | Strike 1: lines resonate | plucked strings in open fifths + faint glass |
| 1.20 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 1.90 | Gathering before a strike | a short breath in (noise rising 500 → 2200 Hz), cut at the strike |
| 2.30 | Strike 2 | soft low heartbeat thump (160 → 62 Hz), gently saturated |
| 2.30 | Strike 2: lines resonate | plucked strings in open fifths + faint glass |
| 2.30 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 3.00 | Gathering before a strike | a short breath in (noise rising 500 → 2200 Hz), cut at the strike |
| 3.35 | Shell morphs (circle → next) | a quiet glass shimmer and a turn of air |
| 3.40 | Strike 3 | soft low heartbeat thump (160 → 62 Hz), gently saturated |
| 3.40 | Strike 3: lines resonate | plucked strings D–A–D–G–A–E (the shell gives) + faint glass |
| 3.40 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 3.90 | Gathering before a strike | a short breath in (noise rising 500 → 2200 Hz), cut at the strike |
| 4.30 | Strike 4 | soft low heartbeat thump (160 → 62 Hz), gently saturated |
| 4.30 | Strike 4: lines resonate | plucked strings in open fifths + faint glass |
| 4.30 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 4.45 | Shell morphs (oval → next) | a quiet glass shimmer and a turn of air |
| 5.75 | Shell morphs (eight → next) | a quiet glass shimmer and a turn of air |
| 6.10 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 6.45 | Shell morphs (spiral → next) | a quiet glass shimmer and a turn of air |
| 7.40 | Shell morphs (rosette → next) | a quiet glass shimmer and a turn of air |
| 7.85 | Gathering before a strike | a short breath in (noise rising 500 → 2200 Hz), cut at the strike |
| 8.25 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 8.25 | Breakthrough | deepest thump + torn air + every string at once, opening into a warm D major (add9) chord |
| 8.45 | Wings unfold | soft wide air, slowly rising |
| 10.30 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 11.00 | Flight up the S-curve | a whoosh that follows the soul's speed and side |
| 12.40 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 12.62 | A spark is born | one tiny high glass note |
| 13.00 | "Break" lands | accent: light thump + bright pluck (D–A–D) |
| 13.32 | "the shape." is written | one quiet wooden tick per letter |
| 14.12 | "Keep" lands | accent: light thump + pluck (A–E–A) |
| 14.42 | "becoming." is written | ticks; the full stop a slightly lower one |
| 16.00 | The soul inhales the old words | a reversed glass chord and ticks, swelling and sucked in; air drawn inward |
| 17.10 | The soul launches | a small breath of air |
| 17.50 | "Meaning" is written | ticks |
| 18.20 | "in the" is written | ticks |
| 18.85 | "comments." lands | the strongest accent of the ending: thump + D major pluck + glass; letters burst as ticks |
| 19.05 | Dive to the left wing | a short rush of air |
| 19.50 | Wave rolls through the lines | low wide ring (D2) with a fading breath of air |
| 19.50 | Touches the wing | two strings plucked where it enters |
| 19.55 | The wing's top edge stretches toward the bubble | twelve bowed strings rising and tightening, converging on one note (A3) |
| 20.80 | The bubble is drawn | a faint glass note and a thin line of air |
| 21.50 | The soul bursts inside the bubble | a soft round pop |
| 21.75 | Splits into three dots | three tiny high ticks |
| 21.90 | Typing dots | a quiet click on each dot's bounce |
| 22.60 | Dots become the bubble's bars | the D major chord returns, very soft, breathing with the bubble |
| 22.90 | Calm pulse: signal arcs toward the comment button | soft round notes A–D–F♯, one per arc, every 1.15 s |

**Next.** Owner listens to the sketches (strike, string resonance, breakthrough). Then a rough mix over the whole film as a half-resolution draft, then the final render and version 06.

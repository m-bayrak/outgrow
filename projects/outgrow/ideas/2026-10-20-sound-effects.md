---
date: 2026-10-20
author: claude
status: done
---

# Sound effects

**Idea.** Version 06 gets sound: effects only, no music, all synthesized in code and deterministic, so the soundtrack is committed and identical on every render. After the first sketches the owner asked for a softer, close, tactile ASMR direction: no heavy low hits or harsh noise. Three sounds of the first sketch stay as they were — the glass bells when the shell changes shape and at the breakthrough, the rustle of the flight, and the glass note when the spark is born; everything else was remade (fingertip knocks, fine crackle of a thin shell, breath and rustle, kalimba notes, pencil strokes, water drops, muted keys). The film must still work muted.

**Details.**
- Source: `src/claude/audio/` — `dsp.ts` (glass and wood partials, kalimba tines, crackle, pencil strokes, drops, key taps, filtered air), `score.ts` (every cue reads its time from `timeline.ts`, `ending.ts` and `finale.ts`), `master.ts` (room, BS.1770 loudness, look-ahead limiter, WAV), `render.mjs` (CLI).
- Pitches stay in D: open fifths while the shell resists, kalimba notes rising through D major at the breakthrough, a soft D major chord when the bubble's bars appear.
- Target −14 LUFS integrated, sample peaks at −2.5 dBFS (true peak about −1.8); nothing below ~30 Hz; the room is only a hint, so it stays close.
- Regenerate the map below with `node audio/render.mjs --map`.

**Sound map.**

| Time (s) | Event | Sound |
| ---: | --- | --- |
| 0.30 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 0.80 | Gathering before a strike | a soft close inhale, held at the strike |
| 1.20 | Strike 1 | a fingertip knock on wood, close, and the thin rings crackling where they are pressed |
| 1.20 | Strike 1: lines resonate | two soft kalimba notes in a fifth |
| 1.20 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 1.90 | Gathering before a strike | a soft close inhale, held at the strike |
| 2.30 | Strike 2 | a fingertip knock on wood, close, and the thin rings crackling where they are pressed |
| 2.30 | Strike 2: lines resonate | two soft kalimba notes in a fifth |
| 2.30 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 3.00 | Gathering before a strike | a soft close inhale, held at the strike |
| 3.35 | Shell morphs (circle → next) | a light glass bell and a turn of air (kept) |
| 3.40 | Strike 3 | a fingertip knock on wood, close, and the thin rings crackling where they are pressed |
| 3.40 | Strike 3: lines resonate | three soft kalimba notes (D–A–E): the shell gives |
| 3.40 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 3.90 | Gathering before a strike | a soft close inhale, held at the strike |
| 4.30 | Strike 4 | a fingertip knock on wood, close, and the thin rings crackling where they are pressed |
| 4.30 | Strike 4: lines resonate | two soft kalimba notes in a fifth |
| 4.30 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 4.45 | Shell morphs (oval → next) | a light glass bell and a turn of air (kept) |
| 5.75 | Shell morphs (eight → next) | a light glass bell and a turn of air (kept) |
| 6.10 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 6.45 | Shell morphs (spiral → next) | a light glass bell and a turn of air (kept) |
| 7.40 | Shell morphs (rosette → next) | a light glass bell and a turn of air (kept) |
| 7.85 | Gathering before a strike | a soft close inhale, held at the strike |
| 8.25 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 8.25 | Breakthrough | the shell cracks open close to the ear (dense fine crackle), a soft breath out, the glass bells (kept), kalimba notes rising through D major, a slow warm swell |
| 8.75 | Wings unfold | a soft feather rustle |
| 10.30 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 11.00 | Flight up the S-curve | a rustling whoosh that follows the soul's speed and side (kept) |
| 12.40 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 12.62 | A spark is born | one small high glass note (kept) |
| 13.00 | "Break" lands | a fingertip knock, two kalimba notes (D–A), a pinch of crackle |
| 13.32 | "the shape." is written | one soft pencil stroke per letter |
| 14.12 | "Keep" lands | the same, a fifth lower (A–E) |
| 14.42 | "becoming." is written | pencil strokes; the full stop a tiny tap |
| 16.00 | The soul inhales the old words | a close rising inhale; crackle and kalimba played backwards, drawn in |
| 17.10 | The soul launches | a small breath of air |
| 17.50 | "Meaning" is written | pencil strokes |
| 18.20 | "in the" is written | pencil strokes |
| 18.85 | "comments." lands | the ending's main accent: a knock, a D major kalimba chord, the letters bursting out as crackle |
| 19.05 | Dive to the left wing | a short rush of air |
| 19.50 | Wave rolls through the lines | a soft brush stroke across the stereo field with a thin trail of crackle |
| 19.50 | Touches the wing | one kalimba note and a pinch of crackle where it enters |
| 19.55 | The wing's top edge stretches toward the bubble | threads drawn tight: crackle that thickens with the pull, a thin whistle of air rising as the lines converge |
| 20.80 | The bubble is drawn | one pencil stroke around it |
| 21.50 | The soul bursts inside the bubble | a soft round water drop |
| 21.75 | Splits into three dots | three tiny drops |
| 21.90 | Typing dots | muted key presses, one per bounce |
| 22.60 | Dots become the bubble's bars | a soft kalimba chord, D major |
| 22.90 | Calm pulse: signal arcs toward the comment button | quiet kalimba notes A–D–F♯, one per arc, every 1.15 s |

**Next.** Done: the owner approved the ASMR mix; it is version 06.

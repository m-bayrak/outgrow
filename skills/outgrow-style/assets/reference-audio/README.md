# Reference sound effects

The sound of Outgrow version 06: effects only, no music, synthesized in code and deterministic (the same code writes the same WAV, byte for byte). Copy this folder to `audio/` next to `src/` in the Remotion project.

| File | Contains | Reuse |
| --- | --- | --- |
| `dsp.ts` | Stereo bus, seeded noise, filters, envelopes, and the voices: glass bells (`modal`), kalimba (`tine`), fingertip knock, fine crackle, pencil stroke, water drop, muted key tap, warm tone | As is |
| `master.ts` | Room (Freeverb-style, no lows sent), BS.1770 loudness, look-ahead limiter, fade-out, 16-bit WAV | As is |
| `render.mjs` | CLI: `node audio/render.mjs` writes `public/outgrow-sfx.wav`; `--map` prints the sound map; `out/x.wav strike,text` renders only those cue groups at the full mix's gain | Change the target path if needed |
| `score.ts` | Every cue, its time read from the timeline (`IMPACTS`, `WAVES`, `SHAPE_TRACK`, `charge`, `SPARK`, `T`, …) | Rewrite for the new piece |

`score.ts` imports the version 06 sources (`timeline.ts`, `ending.ts`, `finale.ts`), which are newer than the version 03 files in [`../reference-src/`](../reference-src/); the full set is in the studio repo at `projects/outgrow/src/claude/src/`. In a new piece, keep its pattern: one `want("group")` block per kind of event, times taken from the piece's own constants, never copied numbers.

Play it in the composition with `<Html5Audio src={staticFile("outgrow-sfx.wav")} />` from `remotion`, and re-run the CLI after any timing change. Node ≥ 23 runs the `.ts` files directly; `render.mjs` resolves the extensionless imports. The recipe is in [`../../references/recipes.md`](../../references/recipes.md), section "Sound".

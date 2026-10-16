# Outgrow v2

A 13-second, 1080 × 1920, 60 fps rework of **Outgrow**: denser pacing, a camera that reacts, and one continuous set of lines that travels from rings to wings.

## How it works

- [`src/contours.ts`](./src/contours.ts) — 24 closed curves, each sampled at the same parameter θ in every shape (circle → oval → figure eight → spiral → rosette → wings). Morphing is a per-point blend, so the lines never break or get replaced. On top of the shape: the soul's push, impact resonance, travelling orange contact colour and sound-wave pulses.
- [`src/timeline.ts`](./src/timeline.ts) — the score: soul path, impacts, waves, shape track, camera (chase, crash punches, shake, final pull-back).
- [`src/Outgrow.tsx`](./src/Outgrow.tsx) — projects everything through the camera and draws it as SVG.

Every frame is a pure function of its frame number (no `Math.random`, no clock), so scrubbing and rendering always agree.

| Time | Beat |
| --- | --- |
| 0–0.8 s | Hook: living rings, first wave |
| 0.8–4.4 s | Four strikes: right, down-left, up (shell stretches to an oval), rebound into the floor |
| 4.4–7.4 s | Fight: figure eight, spiral, rosette; the camera chases and leans |
| 7.4–9 s | Breakthrough up through the pinch; orange floods the lines |
| 9–13 s | Unfold into the winged seed; slow wingbeat and drift |

## Run

```bash
pnpm install
pnpm dev            # Remotion Studio
pnpm lint
scripts/stills.sh   # key stills + out/sheet.png
pnpm exec remotion render src/index.ts Outgrow ../docs/outgrow-v2.mp4 --codec=h264 --crf=18
```

# A thought is a visitor — Claude lineage

Compositions: `Visitor` (the 18 s film, in draft) and `VisitorFrames` (key frames; frame n shows still n + 1).

| File | Role |
| --- | --- |
| `src/house.ts` | House edges in calm, spring and wheel states, blended by weights; the ground line |
| `src/thought.ts` | The three thoughts, each one unbroken line; the tangle unwinds through `relax` |
| `src/soulLines.ts` | The soul's lines: bed, arm, curled arm, ribbon, swept, cradle; `blend` morphs them point by point |
| `src/waves.ts` | Topographic waves outside the house, knock ripples |
| `src/scene.ts` | The seven key frames as parameters |
| `src/timeline.ts` | The film as a function of time; every event time is in `E` |
| `src/Phrase.tsx` | The spark and the phrase it writes |
| `src/Visitor.tsx` | Drawing and camera |

`audio/` synthesizes the sound (`pnpm sfx` writes `public/visitor-sfx.wav`).

`pnpm install`, `pnpm dev`, `pnpm lint`; `scripts/stills.sh [1 … 7]` renders stills and `out/sheet.png`.

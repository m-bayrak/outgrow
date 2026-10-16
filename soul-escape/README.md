# Soul Escape — Remotion source

This is the editable source for **Outgrow**, an abstract motion piece about an orange soul that outgrows a constricting white shell.

Read the [root README](../README.md) for the published video and project overview. The complete creative brief, reference mapping, and prompt for a second agent live in [`../AGENT-HANDOFF.md`](../AGENT-HANDOFF.md).

## Composition

`SoulEscape` is 1080 × 1920, 60 fps, and 1,500 frames (25 seconds). It has no audio in this version.

| File | Responsibility |
| --- | --- |
| `src/Root.tsx` | Registers the composition and its editable default props. |
| `src/motion.ts` | Deterministic trajectory, impacts, shock waves, contour geometry, camera, and orange colour propagation. |
| `src/SoulEscape.tsx` | SVG layers for the shell, energy, orange protagonist, and tail. |
| `CREATIVE-BRIEF.md` | Beat-by-beat intent for this first implementation. |

## Run

```bash
pnpm install
pnpm dev
```

Select `SoulEscape` in Remotion Studio. `preview.command` can launch the Studio on macOS with the prepared local runtime.

```bash
pnpm lint
pnpm exec remotion render src/index.ts SoulEscape ../docs/outgrow.mp4 --codec=h264 --crf=18
```

The composition state is calculated from the frame number only. Scrubbing the timeline, restarting playback, and rendering should therefore produce the same visual state.

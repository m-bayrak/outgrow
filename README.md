# Outgrow

> **Growth sometimes requires stepping beyond the boundaries that have become too confining.**

**Outgrow** is a 25-second vertical motion piece about an orange soul breaking out of a constricting white shell. It is made in Remotion with procedural SVG linework: a living system of contours that resists, receives energy, and finally follows the soul into a winged form.

## Watch

[Watch both versions](https://m-bayrak.github.io/outgrow/) · [Read the production handoff](./AGENT-HANDOFF.md)

The GitHub Pages site plays two interpretations side by side, both 1080 × 1920, 60 fps, without audio:

| Version | Length | Source | Render |
| --- | --- | --- | --- |
| **Codex** | 25 s | [`soul-escape/`](./soul-escape/) | [`docs/outgrow.mp4`](./docs/outgrow.mp4) |
| **Claude** | 13 s | [`outgrow-v2/`](./outgrow-v2/) | [`docs/outgrow-v2.mp4`](./docs/outgrow-v2.mp4) |

## Concept

The orange point is a bright, energetic soul. The white concentric contours represent the routine or body that has become too small. The soul repeatedly tests the shell; each touch turns the nearby white line orange for an instant and sends a wave through the structure. Resistance stretches the geometry into a figure eight, a rosette, and finally a clean, continuous, symmetric winged form.

## Repository map

| Path | Purpose |
| --- | --- |
| [`soul-escape/`](./soul-escape/) | Codex version: editable Remotion project. |
| [`outgrow-v2/`](./outgrow-v2/) | Claude version: editable Remotion project. |
| [`reference-materials/images/`](./reference-materials/images/) | The seven supplied still-image references. |
| [`reference-materials/videos/`](./reference-materials/videos/) | The seven supplied motion references. |
| [`REFERENCES.md`](./REFERENCES.md) | What to take from every reference, including time ranges. |
| [`AGENT-HANDOFF.md`](./AGENT-HANDOFF.md) | Self-contained brief and ready-to-use prompt for a second agent. |
| [`docs/`](./docs/) | GitHub Pages viewer and both rendered MP4s. |

## Run locally

Requires Node.js 20.19+ (or 22.13+), pnpm, and a browser supported by Remotion.

```bash
cd soul-escape
pnpm install
pnpm dev
```

Choose the `SoulEscape` composition in Remotion Studio. On macOS, `soul-escape/preview.command` also opens the Studio when the bundled runtime is available.

Validate the project:

```bash
cd soul-escape
pnpm lint
```

Render a new MP4:

```bash
cd soul-escape
pnpm exec remotion render src/index.ts SoulEscape ../docs/outgrow.mp4 --codec=h264 --crf=18
```

Then commit and push `docs/outgrow.mp4`; GitHub Pages publishes the updated video from `main/docs`.

## Recreate or extend it with another agent

Give the second agent the repository URL and [`AGENT-HANDOFF.md`](./AGENT-HANDOFF.md). It contains the full narrative, visual rules, all observed motion references, the timing structure, the technical constraints, and a copy-paste production prompt. The reference assets are included in this repository so the agent does not depend on files on this computer.

## Credits and usage

The reference assets in `reference-materials/` were supplied by the project owner solely as creative references. They define motion language and visual direction; they are not source footage to reproduce frame-for-frame, nor are their logos, text, or original colour palettes part of this work.

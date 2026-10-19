# Outgrow — brief

The complete brief for **Outgrow**: concept, art direction, timing and the decisions taken so far. It also works as a self-contained handoff for any agent making a new interpretation. Read [`references/REFERENCES.md`](./references/REFERENCES.md) and inspect the supplied assets before writing animation code.

## Core statement

**Growth sometimes requires stepping beyond the boundaries that have become too confining.**

The film is an abstract inner story. An orange object is a soul: alive, bright, and full of energy. It is enclosed by white rings that stand for a body, routine, or everyday life. Escaping is not effortless. The rings push back. Through repeated attempts, the soul accumulates strength; eventually the system stops resisting and its lines begin to follow the soul toward a new form.

## Non-negotiable art direction

- Format: vertical 9:16, 1080 × 1920, 60 fps, approximately 20–30 seconds.
- Palette: pure black ground, white linework, one vivid orange accent. Do not introduce blue, gold, gradients, or decorative colours from the reference imagery.
- No text, logo, narration, or music is required in the current version.
- The linework must feel precise, smooth, and continuous. The final form must use clean unbroken contours, never sketchy or broken strokes.
- The result must feel hypnotic: constant visual evolution, purposeful camera movement, elastic timing, and no dead stretch of time.
- The orange object is the protagonist. It can pulse, grow, stretch in its velocity direction, and leave a long, short, translucent, or absent tail depending on speed and emotional beat.

## Required interactions

1. Start with concentric white contours enclosing a small orange point.
2. On a collision, the shell must deform elastically and resist the point rather than simply opening.
3. At the exact touch area, nearby white lines briefly become orange. That colour impulse must travel along or through the contours before fading back to white.
4. Each impact also produces a sound-wave-like deformation: a pulse travels from the orange point through the white line system.
5. During attempts, show thin orange energy lines, controlled afterimages, and tail variations as appropriate. These effects should make the soul feel energetic, not noisy.
6. The geometry may become an ellipse, a pinch, a figure eight, spirals, or a rosette. Transitions should be continuous and fast enough to feel inevitable.
7. In the release, the orange object finds a path upward. The white contours surrender and progressively align with it.
8. End with a symmetric winged-seed silhouette: white flowing contours framing an orange vertical seed/tail.

## Suggested timing

| Time | Beat |
| --- | --- |
| 00:00–00:01 | Quiet containment: small orange point, concentric shell, energy gathering. |
| 00:01–00:08 | Multiple attempts: impacts, elastic recoil, orange contact flashes, and propagating waves. |
| 00:08–00:11 | The shell stretches into an asymmetric figure eight while the camera catches and follows the motion. |
| 00:11–00:16 | Geometry spins, opens, and reorganises into rosette / contour studies. |
| 00:16–00:21 | A final upward push turns resistance into release; white lines increasingly follow the orange trajectory. |
| 00:21–00:25 | Calm final winged form, slight breathing, an orange seed and a fine vertical tail. |

## Motion language

- Use an anticipation → impact → elastic overshoot → settling rhythm for each escape attempt.
- Camera tracking should feel like it is attracted to the orange object, especially during fast middle movements. It should not drift independently.
- Use fast, nearly invisible morphs when a linear movement would feel awkward. Preserve the continuity of energy even when geometry changes radically.
- Use radial propagation and contour colour travel to make a hit legible without relying on text or particles.
- Pull the camera back before the finale so the complete symmetric form can be read.

## Technical starting point

Two lineages exist: [`src/codex/`](./src/codex/) (version 01) and [`src/claude/`](./src/claude/) (versions 02–03, see its README). The original implementation is a Remotion composition named `SoulEscape` in [`src/codex/src/Root.tsx`](./src/codex/src/Root.tsx).

- [`motion.ts`](./src/codex/src/motion.ts) contains deterministic seed trajectories, impact pulses, camera motion, contour path generation, and colour fragments.
- [`SoulEscape.tsx`](./src/codex/src/SoulEscape.tsx) composes the white shell, impact waves, orange fragments, seed, and trails.
- Parameters are defined in `defaultProps`: `orange`, `lineCount`, `intensity`, `cameraMotion`, and `showTrails`.
- Every frame must be deterministic from its frame number, so scrubbing and rendering reproduce the same result.

## Copy-paste prompt for a second agent

```text
Create a new 20–30 second vertical 9:16 motion-graphics interpretation named “Outgrow”.

Concept: “Growth sometimes requires stepping beyond the boundaries that have become too confining.” The protagonist is a vivid orange soul, initially trapped inside concentric white contour lines on a pure black background. The white shell represents a body or routine that has become too small.

Use only black, white, and orange. Build precise continuous SVG-like linework, not sketchy strokes. Start with concentric rings; the orange point gathers energy and makes several escape attempts. The rings must resist elastically. At every impact, the contacted white lines flash orange for a moment and an orange/white wave propagates through the contours like a sound wave. The orange object may pulse, stretch in the direction of travel, and use long, short, translucent, or no tail according to its speed.

Make the pacing hypnotic: continuous evolution, rhythmic acceleration and settling, camera tracking that follows the orange object, and quick seamless geometry transitions. Let the shell pass through ellipses, pinches, a figure eight, spirals, and/or a rosette. After a final upward release, the contour system should progressively follow the orange trajectory. End with a clean symmetric winged-seed form made of unbroken white curves, framing an orange vertical seed and thin tail. No text, logos, voiceover, or music.

Use the reference assets and the detailed mapping in REFERENCES.md. Do not reproduce reference footage frame-for-frame or reuse its branding, typography, or colour palettes.
```

## Acceptance checklist

- [ ] The first and final frames clearly communicate containment and release.
- [ ] Every collision shows both local orange contact colour and a travelling deformation.
- [ ] The orange protagonist is always visually dominant without overfilling the frame.
- [ ] The middle section changes shape and camera scale enough to sustain attention.
- [ ] The final linework is symmetric, smooth, and unbroken.
- [ ] The composition renders deterministically at 1080 × 1920 and 60 fps.

## Decisions

Newest last. Every agent adds a row when a direction is settled with the owner.

| Date | Decision | Why |
| --- | --- | --- |
| 2026-10-16 | Palette is black, white and one orange (`#ff6a00`) only. | Keeps the soul the single point of energy. |
| 2026-10-17 | Claude's version rebuilds from scratch, ~13 s instead of 25 s. | Shorts need denser pacing. |
| 2026-10-17 | The same lines carry from rings to wings; no line is ever replaced. | The shell does not vanish; it becomes the wings. |
| 2026-10-17 | The finale keeps a narrow vertical waist with the seed above the node. | Matches the winged-seed reference. |
| 2026-10-19 | Extend the Claude version with a text ending instead of a separate clip. | The story needs a conclusion. |
| 2026-10-19 | On-screen text: **Break** / the shape. / **Keep** / becoming. Verbs orange and burst in on impact; the rest is written by a gliding spark that ends as the full stop. | Matches the target frame `references/images/trace-of-freedom-orange-verbs.png`. |
| 2026-10-19 | Every visible step is published as a new version; nothing in `docs/media/` is overwritten. | The site shows progress as a lineage. |
| 2026-10-19 | Of five ending studies, refine the trace-of-freedom layout: low cropped wings, an upward orange soul with an S-shaped trace, and large left-aligned text. | Preserves visual continuity while leaving black space for readable copy. |
| 2026-10-19 | Enlarge the selected headline into four lines: Break / the shape. / Keep / becoming. Only Break and Keep are orange; all other letters and both periods are white. | Final owner-approved colour assignment supersedes the orange-noun study and improves single-screen Shorts readability. |

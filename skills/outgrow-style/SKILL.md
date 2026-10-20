---
name: outgrow-style
description: Make motion pieces in the owner's Outgrow style — vertical 1080×1920 shorts drawn in code (Remotion) on pure black, with families of continuous white contour lines and one orange "soul" that strikes, breaks out and transforms them, optionally ending in bold Inter Tight words. Use this skill whenever this owner asks for a new animation, short, reel, motion graphic, title or text ending, keyframes or stills, or wants to extend, speed up or revise an existing piece — and whenever they mention Outgrow, the soul, the shell, rings, wings, contour lines, hypnotic shorts, or "our style" / "як ми робили", even if they don't name the style. Also covers the working process with the owner (options first, stills, draft, final, approvals, branches) and the reusable code recipes.
---

# Outgrow style

A way of making short, hypnotic motion pieces, and a way of working with the owner on them. It grew out of the Outgrow project (an orange soul outgrowing a shell of white rings, ending in "Break the shape. Keep becoming."). Use it for that project and for any new piece that should feel like it.

## The look in one breath

Pure black ground. White linework in dense families of parallel, **unbroken** contours. One orange protagonist that is alive: it gathers, strikes, stretches, leaves a tail, makes lines flash orange and ripple like sound. Shapes evolve without pause and change at the peak of a movement. The camera is attracted to the protagonist. Words, if any, are huge Inter Tight 800, verbs in orange, and they arrive through the protagonist's motion.

Read [`references/style.md`](references/style.md) before designing anything. In the Outgrow repository, its root `STYLE.md` is the authoritative copy; if the two differ, follow `STYLE.md`.

## Working with the owner

The owner writes in Ukrainian and thinks visually. They supply references (images, videos with exact seconds they like) and decide; you propose, build and check.

1. **Restate and offer options before building.** Describe how you understood the request (story beats, what moves, what the frame ends on), then give 2–3 concrete options for the open choices with your recommendation first, and ask only what changes what you build. Answer in Ukrainian; keep everything on screen and in the repo in English.
2. **Stills first.** Render 6–9 key frames (one per beat) into one contact sheet and show it. Shape is cheap to fix here and expensive later.
3. **Motion draft.** Half-resolution video. Review it yourself as frame strips before showing it (see Checking your work).
4. **Final.** 1080×1920, 60 fps, `--codec=h264 --crf=18`.
5. Wait for an explicit go-ahead between stages. Never commit, push, open a PR or merge unless the owner says so in that message; branch per task, and in the studio repo follow its `AGENTS.md` (branch prefixes, `LOG.md`, publishing versions and studies).

When a reference is a still the owner made (a target frame), match it closely: derive positions from it (see "Landing on a target frame" in the recipes). When it is a video by someone else, take the motion idea, never its palette, branding or frames.

## Building a piece

Start from the reference implementation in [`assets/reference-src/`](assets/reference-src/) (the Outgrow Claude version): copy it into a new Remotion project and reshape it rather than starting blank. What each file does and the tuned numbers are in [`references/recipes.md`](references/recipes.md); read the section you need:

| Need | Recipe |
| --- | --- |
| Lines that morph between shapes without breaking | Contour field |
| The protagonist: size, stretch, tail, glow, rays | Soul |
| Strikes, orange contact colour, sound waves, breakthrough | Impacts and waves |
| A camera that chases, punches, leans and reveals | Camera |
| A flight along a curve into a designed final frame | Flight and target frame |
| Words that burst in or are written by a spark | Typography |
| Timing that never goes dead | Pacing |
| Synthesized sound effects tied to the timeline (when a brief asks) | Sound — code in [`assets/reference-audio/`](assets/reference-audio/) |

Keep every frame a pure function of its frame number: no `Math.random`, no clock, no state carried between frames. Seeded hashes only. This is what makes Studio scrubbing, stills and renders agree.

## Checking your work

Look before you show. Each check below caught real problems in Outgrow.

- **Stills:** `scripts/stills.sh [seconds…]` (run from the Remotion project, `COMP=<CompositionId>` if it is not `Outgrow`) renders frames and `out/sheet.png`. Read the sheet.
- **Motion strips:** render a half-res draft, then `scripts/strip.sh draft.mp4 <from> <to> <count> out.png` tiles evenly spaced frames from one stretch of time. Look for dead stretches, lopsided morphs, tails that read as worms.
- **Compare with the target** frame side by side; move the camera, not the art, to match framing.
- **Determinism:** render the same frame twice and compare checksums.
- **`pnpm lint`** (eslint + tsc) clean.

Known traps and their fixes are in [`references/lessons.md`](references/lessons.md). Skim it before the stills stage.

## Delivering

- Show stills as one contact sheet and drafts as a video file; say in one line what changed since the last look.
- In the studio repo, a published step is a new numbered video in `docs/media/<project>/` plus an entry in `project.json`; process stills become studies; prompts go in `prompts/`. `AGENTS.md` has the exact steps.

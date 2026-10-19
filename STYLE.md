# Style

The shared visual and motion language of this studio. Every new piece follows it unless its `BRIEF.md` records a deliberate exception and the reason.

## Palette

| Token | Value | Use |
| --- | --- | --- |
| Ground | `#000000` | Always pure black. No gradients, no vignettes. |
| Line | `#ffffff` | Linework and secondary text. |
| Accent | `#ff6a00` | The protagonist, its energy, and key words. One accent only. |

No blue, gold, grey fills or decorative colour, even when a reference uses them. Take a reference's motion, never its palette.

## Line

- Lines are precise, smooth and **unbroken**. A form may stretch, pinch, spiral or fold, but a line never tears or gets replaced by another.
- Families of ~20–30 parallel contours read better than single strokes; density carries the mood.
- Stroke ≈ 2.4 px at 1080 px width, constant on screen regardless of camera zoom.
- Shapes morph point by point (every contour sampled at the same parameter in every shape), so one set of lines travels through the whole film.

## The protagonist

- An orange point: a soul, an energy, a seed. It is always the most important thing on screen and never overfills it.
- It pulses, grows as it gains strength, stretches along its velocity, and leaves a tail whose length and opacity follow its speed (long, short, translucent or none).
- It may shed thin orange energy lines when it gathers itself.

## Interaction vocabulary

| Moment | Treatment |
| --- | --- |
| Gathering | Anticipation: the point pulls back, squashes, short orange rays flicker. |
| Impact | The lines resist elastically and recoil. Where it touches, white turns orange and that colour travels along the line. A sound-wave pulse rolls out through every line. |
| Breakthrough | Orange floods outward through the system, then drains back to white. |
| Release | The lines stop resisting and follow the protagonist. |
| Trace | A fine orange line left behind a flight; it may stay on screen as part of the final frame. |

## Motion

- **Hypnotic, never idle.** No stretch longer than ~1 s without a new event. Something always evolves.
- Rhythm per action: anticipation → impact → elastic overshoot → settle. Strikes accelerate as the film builds.
- Change shape at the peak of a movement, where the eye cannot catch the cut; avoid slow linear morphs.
- Hold the final read at least 1 s.

## Camera

- The camera is attracted to the protagonist: it chases a smoothed average of its recent positions, never glued to it and never drifting on its own.
- Crash punch (zoom in ~6 frames) and a fast-decaying shake are reserved for the 2–3 decisive moments of a film; smaller beats only nudge.
- Lean (slight rotation) during a fight; level out and pull back to reveal a finished form.

## Typography

- Inter Tight, weight 800, set tight and large, left-aligned.
- Verbs (the action) in orange, everything else in white.
- Words arrive through the protagonist's motion: an **impact** bursts a word out of a landing point; a **glide** writes a phrase letter by letter behind the moving spark, letters glowing orange and cooling to white. A spark may come to rest as a full stop.
- English only on screen.

## Format

- Vertical 1080 × 1920, 60 fps, 12–20 s for shorts. The first second must already move.
- No audio unless a brief asks for it.
- Every frame is a pure function of its frame number: no `Math.random`, no clock. Seeded hashes only.

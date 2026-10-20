# Recipes

Tuned building blocks from the Outgrow Claude version. File names refer to [`../assets/reference-src/`](../assets/reference-src/). World units are pixels at zoom 1, origin at the shell centre, y down. Time `t` is in seconds (`frame / fps`).

## Contents

1. Contour field
2. Soul
3. Impacts and waves
4. Camera
5. Flight and target frame
6. Typography
7. Pacing
8. Project setup
9. Sound

## 1. Contour field (`contours.ts`)

**Idea.** 24 closed curves, each sampled at the same 540 values of θ in every shape. A shape is a function `shapePoint(shape, u, θ, t) → {x, y}` where `u = (i + 1) / 24` is the line's place from inside to outside. Morphing = blending two shapes point by point, so lines never tear and the same lines carry through the whole film.

- Ring radius: `R(u) = 150 + 340·u`.
- **Circle**: `polar(R, θ)`.
- **Oval**: x × 0.8, y × 1.26, plus a little extra height where the soul pushed.
- **Figure eight with a pinch**: radius `R·1.28·(ε + (1−ε)·|sin θ|^0.8)`, then rotate by `0.42·tanh(y/260)` so the lobes lean opposite ways. `ε = 0.035 + 0.05u` keeps lines from collapsing into one dot at the pinch. Fade the lean out before a symmetric shape follows.
- **Spiral**: the eight, spun over time, then a vortex (rotate inner points more: `angle = s·max(0, 1 − d/reach)`).
- **Rosette**: radius `∝ ε + (1−ε)·|cos(2.5(θ − spin))|^0.9` (five petals through the centre), slight counter-vortex.
- **Winged seed**: four non-overlapping petal bumps `cos(π/2·d/width)^p` (upper pair at ±0.44 rad from vertical, width 0.42; lower pair at ±0.47, width 0.46, amplitude 0.8), radius `140 + 1500·u^1.1`; fan the tips outward with `k = (d/1640)^1.5`; then `y += 120·tanh(y/28)` to pull the node apart into a narrow vertical waist. Petals must not overlap or the top flattens into a "bat".
- **Shape track**: a list of `{shape, until, morph}`; morph quickly (0.3–0.5 s) at the peak of a movement, slower (≈1.6 s) only for the final unfolding.
- **Breathing**: radius × `1 + 0.012·sin(2π·0.55t + 2.4u)`. A slow wingbeat at the end: tips scale by `1 + 0.035·k·sin(2π·0.45t)`.
- **Line opacity** ramps in from the centre in the first 0.5 s, so frame 0 is already alive.

Render: one SVG path per line (`M…L…Z`), stroke 2.4 px, white. Orange overlays are drawn as separate runs on top (see 3).

## 2. Soul (`Outgrow.tsx`, `timeline.ts`)

- Position is a pure function `soulPos(t)`: keyframed segments (anticipation `outCubic`, strike `inCubic`, recoil `outCubic`) plus procedural orbits (a lissajous figure eight through the pinch; a tight spiral inside the rosette). Make segment ends meet exactly.
- Velocity by central difference `soulVel(t)` (±1/120 s).
- Radius 15 → 18 → 21 → 26 px as it fights, pulse `1 + 0.12·sin(2π·1.6t) + 0.25·charge`. Grow to ~58 as a final seed.
- Stretch along velocity: `1 + min(1.5, speed/1400)`, squeeze across by `1/√stretch`.
- Seed shape: blunt end leading, trailing side pinched to a point (`pinch = 1 − 0.75·seed·back^1.6`).
- Tail: a filled polygon through the soul's own last 3–17 frames, width `0.4·radius` tapering with `(1 − k/n)^1.4`. Thicker reads as a worm.
- Glow: a blurred ellipse 2.2 × radius at 45 % opacity behind the body.
- Energy rays while gathering: 9 thin orange lines (1.4 px) flickering around the soul, length ∝ `charge`.

## 3. Impacts and waves (`contours.ts`)

- **Push**: points near the soul's direction (`exp(−(Δθ/0.42)²)`) are moved out to `soul distance + 26 + 8·i`, so rings stack and compress. Contact strength → orange.
- **Resonance**: after a strike at angle ψ, each ring rings like a membrane: `26·strength·dampedSettle(dt − 0.011·i, 2.6 Hz, 4.2)` within ±0.95 rad, outer rings a beat later.
- **Travelling colour**: orange runs along each ring away from the contact both ways (`ψ ± 3.4·dt`, width 0.28 rad, decays `e^(−2.4dt)`).
- **Sound wave**: from a point, a Gaussian ring (σ ≈ 85 px) moving at 900–1500 px/s displaces lines outward and tints them; amplitude 16–46 px, decays `e^(−1.3dt)`.
- **Breakthrough flood**: orange sweeps outward through every line and drains back over ~0.6 s.
- Draw orange as runs of constant quantised intensity (6 levels): a soft 4× wide blurred halo at 35 % plus a crisp 1.15× core.

## 4. Camera (`timeline.ts`)

- `screen = rotate(p − centre, rot)·zoom + (W/2, H/2) + shake`. Keep stroke widths in screen space so lines stay crisp at any zoom.
- **Chase**: centre = mix(rest point, *weighted average of the soul's positions over the last 0.3 s*, follow), follow 0.15 → 0.7 during the fight → 0 for the reveal. Without the averaging, fast orbits make the frame jitter.
- **Crash punch** (2 per film at most): zoom up ~30 % in 0.12 s with `inQuad`, settle `outCubic`; shake `15·strength·e^(−dt/0.045)` px. Smaller strikes get a 5 % nudge and 4 px.
- **Lean**: rotation `0.22·sin(…)` during the fight, back to 0 for the reveal.
- **Reveal**: pull back so the whole form reads (zoom ≈ 0.57 for the wings), then a slow linear drift in so the end is never frozen.

## 5. Flight and target frame (`ending.ts`)

- To land on a designed final frame, fix the **final camera** first (centre, zoom, rotation), then write the flight path as **screen** points measured from the target image and convert them to world with the inverse camera. The art stays where it is; the camera arrives as the soul does (`cameraHandoff` blends from the running camera to the final one).
- Path: Catmull-Rom through the points, resampled by arc length so speed follows the easing, not the spacing of points. `inOutCubic` over ~1.4 s; at the end a small recoil along the tangent, then a gentle hover.
- The flight leaves its own path as a fine orange trace (stroke = line width). Keep any earlier vertical tail anchored at its origin.

## 6. Typography (`Title.tsx`)

- Inter Tight 800 via `@remotion/google-fonts/InterTight`; measure glyphs with `@remotion/layout-utils` only after `waitUntilDone()` (hold the render with `delayRender`). Fit the size so the widest line matches the target frame.
- Lines left-aligned at x ≈ 100 with tight leading: baseline step ≈ 0.9 × font size (148 px in Outgrow).
- **Spark**: an 11 px orange dot with a glow; it buds off the soul, then hops in quadratic arcs (lift 70–170 px) and squashes on landing (`1 + 0.6s`, `1 − 0.38s`).
- **Impact word** (verbs, orange): letters fly out of the landing point to their slots, centre letters first (0.018 s stagger), scale `outBack(2.2)` from 0.15, plus an orange shock ring (r 30 → 330 px, 0.55 s) and one damped breath of the whole word.
- **Glide phrase** (white): the spark slides along the line; each letter appears as the spark passes it (rise 0.22 × size, scale from 0.55, `outBack(2)`), glows orange when fresh and cools to white behind the spark.
- The spark may end as a full stop: it parks on the period's position, shrinks to its size and cools to white.

## 7. Pacing

- 12–20 s for shorts. Hook in the first second (already moving, first wave at ~0.3 s).
- Strikes accelerate (≈1.1 s, then 1.1 s, then 1.1 s with a bigger one), each with anticipation → strike → overshoot → settle.
- Something new every ≤ 1 s; if a stretch only "returns to the centre", add an event (a rebound strike filled Outgrow's gap at ~4 s).
- Hold the final read ≥ 1 s, but keep it breathing.

## 8. Project setup

- Remotion 4 project: `pnpm install`, `pnpm dev`, `pnpm lint`. Composition 1080 × 1920, 60 fps, `defaultProps` for colours and line width.
- Node from Homebrew; with Node ≥ 25 there is no corepack, so install pnpm with Homebrew.
- Add Remotion packages with `pnpm exec remotion add <pkg>` to keep versions aligned.

## 9. Sound (`../assets/reference-audio/`)

- Only when a brief asks for it. Effects only, no music, all synthesized in code (no samples), deterministic, committed as a WAV in `public/` and played with `<Html5Audio>`.
- Every cue reads its time from the timeline constants, so a timing change moves the sound with it. The soul's `charge(t)` is the anticipation breath's own envelope.
- Tone the owner approved for Outgrow 06: soft, close, tactile, like ASMR. Strikes are a fingertip knock plus fine crackle where the rings are pressed; lines answer with two soft kalimba notes in a fifth; waves are a brush stroke panned across the stereo field with a thin crackle trail; the breakthrough is a thin shell cracking open close to the ear, a breath out, glass bells and kalimba rising through D major; letters are pencil strokes; the bubble is a pencil stroke, a water drop, muted key taps, quiet kalimba on each signal arc. Keep everything in one key (D).
- The owner rejected the first palette's deep thumps, torn-noise burst and all strings at once as too hard; kept only the light glass bells, the flight's rustle and the spark's glass note.
- Mix: about −14 LUFS integrated, sample ceiling −2.5 dBFS so the true peak stays near −1.8 after AAC; high-pass the reverb send (~240 Hz) and the master (~32 Hz); keep the room only a hint (wet −6 dB). If the limiter has to take more than ~4 dB, lower the loudest transients instead.
- Check without ears: `ffmpeg -af ebur128=peak=true` for loudness and true peak, `showspectrumpic` for balance, two renders compared byte for byte, and the audio cross-correlated against the WAV after the render (offset 0 ms). The owner judges the sound itself: send short clips over the picture.

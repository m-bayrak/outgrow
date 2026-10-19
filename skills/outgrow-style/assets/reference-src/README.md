# Reference implementation

The source of Outgrow (Claude lineage, version 03): a 16.5 s, 1080 × 1920, 60 fps Remotion composition. Copy these files into the `src/` of a new Remotion project and reshape them.

| File | Contains |
| --- | --- |
| `math.ts` | Easing, keyframe interpolation, damped settle, angle helpers, integer hash |
| `contours.ts` | The contour field: shapes, morph blend, push, resonance, travelling colour, waves |
| `timeline.ts` | The score: soul path, impacts, waves, shape track, camera |
| `ending.ts` | Flight to a target frame, final camera, spark timing, text lines |
| `Title.tsx` | Words: font loading and measuring, impact and glide reveals, the spark |
| `Outgrow.tsx` | Puts it together: camera projection, SVG lines, orange runs, soul, tail, rays, trace |

Register it in `Root.tsx` as a 1080 × 1920, 60 fps composition (990 frames) with `defaultProps={{ orange: "#ff6a00", white: "#ffffff", lineWidth: 2.4 }}`. Needs `@remotion/google-fonts` and `@remotion/layout-utils` (add with `pnpm exec remotion add`).

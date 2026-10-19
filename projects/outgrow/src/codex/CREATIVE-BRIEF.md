# Soul Escape — first implementation brief

Vertical animation: 1080 × 1920, 60 fps, 25 seconds. Pure black ground, white contours, and an orange soul. There is no text, voiceover, or sound in this version.

## Story beats

- **0–1 s:** an orange point sits inside concentric circles and gathers energy.
- **1–8 s:** attempts to break free in several directions. The shell resists and rebounds. The tail changes with velocity; lines briefly turn orange at contact points and pulses travel through the structure.
- **8–11 s:** circles lengthen into a figure eight while the camera catches the movement.
- **11–16 s:** contour geometry rotates and opens into a rosette. Energy reorganises the shell.
- **16–21 s:** a final upward push turns the shell into symmetric wings; colour travels along the contours.
- **21–25 s:** the finished winged form holds with a subtle breath, an orange drop, and a long fine tail.

## Creative rules

The opening should be based on the upper-left panel of `From concentric circles to winged symmetry`. The figure-eight and contour-study images are intermediate vocabulary. The end should echo `Symmetric_winged_seed_linework`: smooth, continuous lines without breaks.

The intended experience is hypnotic rather than merely decorative. Camera tracking, radial waves, and travelling contact colour make the viewer feel each escape attempt. Reference motion is interpreted as technique, never copied together with its text, logos, or source colour palette.

## Editing controls

`defaultProps` in `src/Root.tsx` exposes the orange colour, line count, deformation intensity, camera motion, and trails. The animation is fully deterministic from frame number, so arbitrary timeline jumps reproduce the same state.

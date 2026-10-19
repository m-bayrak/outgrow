@AGENTS.md

## Claude-specific

- Skills to reach for: `remotion-*` (Remotion APIs and rendering), `genart:genart` (determinism), `video-shotcraft:video-shotcraft` (camera recipes and motion helpers), `algorithmic-art` (flow fields, particles, new line effects), `frontend-design` (the `docs/` site), `canvas-design` (posters).
- Preview: `.claude/launch.json` starts Remotion Studio for the Claude lineage and a static server for `docs/`.
- Key stills: `projects/<p>/src/claude/scripts/stills.sh [seconds …]` renders frames and `out/sheet.png`; read the sheet before judging a visual change.
- Branch names start with `claude/`.

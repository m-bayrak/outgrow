---
date: 2026-10-19
author: claude
status: proposed
---

# A site that shows the lineage

**Idea.** Each project page shows its latest version large and every earlier step as a lineage tree, so the site reads as a record of progress rather than a gallery.

- Latest version large on the left (top on phones), autoplaying, muted, looping.
- On the right, a tree drawn in SVG: thin white branches, the current lineage as a fine orange S-trace (echoing the trace in version 03). Each version is a node with a small poster.
- Hover: the node pulses orange and previews a short clip. Click: that version moves into the large player.
- The tree branches honestly: brief → 01 Codex; brief → 02 Claude → 03 Claude.
- Home page: one row per project, title in large Inter Tight and its newest frame.

**Build.** Static HTML, CSS and a little JavaScript reading `docs/data/projects.json`; no framework and no build step. A later upgrade could embed live compositions with `@remotion/player` (that one would need React).

**Next.** Mockup first, then code.

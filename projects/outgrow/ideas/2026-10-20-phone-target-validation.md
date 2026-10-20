---
date: 2026-10-20
author: codex
status: proposed
---

# Validate the comment target on both phone layouts

**Idea.** Validate version 04's actual final frame against the supplied iPhone and Android layouts before proposing a placement change. An average point between two screenshots does not by itself establish an overlap in video coordinates.

**Details.**
- The owner supplied an iPhone screenshot, an Android screenshot and a manually overlaid target-area image. These contain third-party UI/content and are not stored in the public repository.
- Identify each device's displayed video viewport first, excluding navigation bars and any margins; map the same 1080 × 1920 frame into each viewport with its actual scaling/cropping.
- Compare the drawn bubble's bounds with the native comment button on each layout, rather than scaling entire phone screenshots directly to 9:16.
- Preserve 04's approved slightly-left placement unless a comparison shows a problem.
- Earlier Codex discussion suggested a short up/down nudge as an alternative to exact alignment; do not add it unless a fixed bubble fails and the owner approves the motion.
- A larger illustration only changes visual guidance; it does not change the native hit area. No universal alignment guarantee has been established.

**Next.** Open questions: should the graphic partly overlap the real icon, as initially requested, or always sit beside it, as approved for 04? Which current phone/app layouts should define acceptance?

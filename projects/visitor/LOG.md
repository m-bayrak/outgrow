# A thought is a visitor — work log

Append-only. Every agent adds an entry when it finishes a piece of work (format in `AGENTS.md`). Read the latest entries before starting.

## 2026-11-24 · claude · claude/visitor-stills-602ddb
- Set up the project: brief, seven reference images, prompts (verbatim, `used_for` empty until studies exist; `produced` says what each made).
- Built the seven key frames in `src/claude` (parametric house, thoughts, soul lines, waves). `scripts/stills.sh` renders them and the contact sheet. Lint passes; frame 3 rendered twice gives the same checksum.
- Site data untouched: `docs/site.js` expects at least one version per project, and opening this one would break the page.
- The skill update on `claude/skill-audio` (6fa4186) is already in `main` through its own pull request; nothing was merged here.
- Open: the owner's feedback on the stills. No motion, audio or publishing until approved. Open questions are in `BRIEF.md`. The frame 6 waves hug the house and do not yet clearly come from the tangle; frames 2 and 6 have no reference to match.

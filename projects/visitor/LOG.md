# A thought is a visitor — work log

Append-only. Every agent adds an entry when it finishes a piece of work (format in `AGENTS.md`). Read the latest entries before starting.

## 2026-11-24 · claude · claude/visitor-stills-602ddb
- Set up the project: brief, seven reference images, prompts (verbatim, `used_for` empty until studies exist; `produced` says what each made).
- Built the seven key frames in `src/claude` (parametric house, thoughts, soul lines, waves). `scripts/stills.sh` renders them and the contact sheet. Lint passes; frame 3 rendered twice gives the same checksum.
- Site data untouched: `docs/site.js` expects at least one version per project, and opening this one would break the page.
- The skill update on `claude/skill-audio` (6fa4186) is already in `main` through its own pull request; nothing was merged here.
- Open: the owner's feedback on the stills. No motion, audio or publishing until approved. Open questions are in `BRIEF.md`. The frame 6 waves hug the house and do not yet clearly come from the tangle; frames 2 and 6 have no reference to match.

## 2026-11-24 · claude · claude/visitor-stills-602ddb
- The owner chose how the phrase is written: variant A, a spark from the soul that ends as the full stop. Recorded in `BRIEF.md` with planned timing; nothing built yet.
- Open: feedback on the stills, then approval for a motion draft. Frame 7 still shows a white full stop; under this decision it becomes the orange spark.

## 2026-11-24 · claude · claude/visitor-stills-602ddb
- Frame 6 rebuilt from the owner's new reference (`references/images/frame-6-the-choice.png`, prompt 16): `surf` waves from the tangle, torn loops (`burst`), ground flat up to the porch, key held beside the soul. The other six stills are byte-identical to before.
- Open: the owner's verdict on the stills. Nothing beyond stills is approved.

## 2026-11-24 · claude · claude/visitor-stills-602ddb
- The owner approved the seven stills.
- Next: a half-resolution motion draft, only after a separate go-ahead.

## 2026-11-24 · claude · claude/visitor-stills-602ddb
- First motion draft of the whole 18 s (`src/claude/src/timeline.ts`, `Phrase.tsx`; composition `Visitor`), 540 × 960, no sound, rendered to the ignored `out/`. Reviewed as frame strips, not watched in real time. Frame 740 rendered twice gives the same checksum; lint passes.
- Stills 1–6 are unchanged; still 7 now ends in the orange spark dot.
- Known: when the soul lands back on its bed (about 5.95 s and 8.95 s) the line ends whip for 2–3 frames; as the key is seated (about 7.4 s) the wheel and the key overlap for a moment.
- Open: the owner's feedback on the draft. Final render, sound and publishing are not approved.

## 2026-11-24 · claude · claude/visitor-stills-602ddb
- The owner approved the motion of draft 1.
- Next, each only after a separate go-ahead: the two known flaws, the final 1080 × 1920 render, sound, publishing.

## 2026-11-24 · claude · claude/visitor-stills-602ddb
- Final master rendered as approved, with no changes to draft 1: 1080 × 1920, 60 fps, 18 s, h264 crf 18, silent, 8.1 MB, in the ignored `src/claude/out/visitor-master.mp4`. The two known flaws stay by the owner's choice.
- Open: sound, publishing as version 01, push and pull request, each only after a go-ahead.

# Outgrow — work log

Append-only. Every agent adds an entry when it finishes a piece of work (format in [`AGENTS.md`](../../AGENTS.md#working-together)). Read the latest entries before starting.

## 2026-10-16 · codex · main
- Version 01: `src/codex/` (Remotion composition `SoulEscape`), 25 s, published on GitHub Pages.
- Added the brief (`BRIEF.md`, then named `AGENT-HANDOFF.md`), `references/REFERENCES.md` and the supplied reference images and videos.

## 2026-10-17 · claude · feat/outgrow-v2
- Version 02: new lineage `src/claude/`, 13 s. 24 continuous contours morph circle → oval → figure eight → spiral → rosette → winged seed; four strikes with travelling orange contact colour and sound waves; reactive camera.
- Pages now shows Codex and Claude side by side. Merged in PR #1.

## 2026-10-19 · claude · feat/outgrow-text-ending
- Version 03: extended the Claude lineage to 16.5 s with the text ending (`src/claude/src/ending.ts`, `Title.tsx`). Target frame: `references/images/trace-of-freedom-orange-verbs.png`.
- Not merged yet.

## 2026-10-19 · claude · claude/repo-structure
- Restructured the repo into a multi-project studio: `projects/outgrow/` (brief, references, ideas, log, `src/codex`, `src/claude`), `docs/media/outgrow/` with numbered web videos and posters, `project.json` manifest, `scripts/build-site-data.mjs`, `templates/`, `inbox/`.
- Added `AGENTS.md` (rules for every agent), `CLAUDE.md`, `STYLE.md`.
- Next: new site with the latest version large and a lineage tree of all versions (mockup first, see `ideas/2026-10-19-versions-site.md`); a reusable Outgrow style skill; file the owner's ChatGPT/Codex materials into `ideas/` and `references/`.

## 2026-10-19 · codex · codex/import-materials
- Filed five distilled idea records: original motion/review notes, ending composition directions, type-scale/colour iterations, slogan explorations, and proposed Shorts comment-arrow placement.
- Added 21 reference/review images and rows in references/REFERENCES.md: seven concept/refinement stills, a review contact sheet, nine Codex render samples, the Claude v02 finale, two sourced Shorts UI illustrations, and a generated arrow schematic. The already-filed selected orange-verbs image was verified identical and not duplicated.
- Appended decisions for the selected trace-of-freedom composition, enlarged type, exact copy and punctuation colours. Source and published media were not changed; existing masters/web renders were not duplicated.
- No third-party video or private chat was added. Original video URLs/authors remain unresolved in inbox/2026-10-19-outgrow-video-source-links/note.md. Legacy footage remains untouched under the append-only scope.
- Open: supply verified original video links and authors; decide whether the proposed comment CTA is wanted; continue production from the selected target using the staged workflow in AGENTS.md.

## 2026-10-19 · codex · codex/import-materials
- Removed the third-party Shorts phone mockup and mobile-browser screenshot from the branch's current files at the owner's request. The import now contains 19 additional images.
- Kept their reference-table rows and comment-arrow idea, replacing local image links with external source links marked "(external, not stored)".
- Earlier commits retain the removed files in Git history; this follow-up does not rewrite history. No source code or published media changed.

## 2026-10-19 · claude · claude/third-party-rule
- Merged Codex's import (PR #3) as a squash, so the two removed third-party screenshots never entered `main` history; deleted `codex/import-materials`.
- `AGENTS.md`: anything made by someone else (video, image, screenshot, app UI, article graphic) is linked in `REFERENCES.md`, never committed; only owner- or agent-made images go in `references/images/`.
- Next: new site with a version tree (mockup first).

## 2026-10-20 · claude · claude/versions-site
- New site (`docs/index.html`, `site.css`, `site.js`): the chosen item large on the left; on the right the title and a lineage tree growing up from the brief, the chosen item's ancestry drawn as an orange trace. Built entirely from `docs/data/projects.json`.
- Studies: `project.json` now lists 17 stills (concepts, Codex review sheet, five ending studies, type and colour refinements, the comment-arrow proposal) with parent, group and status; version 03 is `basedOn` the orange-verbs target. Web copies in `docs/media/outgrow/studies/` via `scripts/encode-studies.mjs`; `build-site-data.mjs` validates them.
- `AGENTS.md`: how to show a study on the site.
- Next: a reusable Outgrow style skill; a home page listing projects once there is more than one.

## 2026-10-20 · codex · codex/archive-prompts
- Added prompts/README.md and 18 dated records: nine verbatim image-generation prompt strings for e1–e5, t1–t3 and a1, plus nine owner creative instructions/excerpts covering the original brief, reference roles and ending refinements.
- Documented actual image inputs, settings and superseded variants. Ukrainian creative wording is retained at the owner's request; metadata and editorial notes are English. Long rich-text excerpts are labelled as transcriptions, not byte-identical message markup.
- Recorded that t3 was edited from t2 even though its conceptual parent in project.json is t1. No manifest, source, media or site files changed.
- Missing: generating prompts for supplied c1–c7 images and original Claude execution prompts for versions 02–03 are unavailable here; no reconstructed text is presented as an exact prompt. The existing BRIEF handoff is not claimed to be Claude's execution prompt.

## 2026-10-20 · claude · claude/prompts-on-site
- Merged Codex's prompt archive (PR #6).
- `scripts/build-site-data.mjs` now reads `projects/<p>/prompts/*.md` and attaches each prompt to the versions and studies in its `used_for`; no manual links in `project.json`. 17 items have prompts; 02, 03 and r1 have none on record.
- The site shows them under the chosen item as collapsible entries (owner's requests first, then tool prompts) with a link to the file. Site data is always revalidated, so new items appear without a stale cache.
- `AGENTS.md`: where prompts go and the required front matter.

## 2026-10-20 · claude · claude/prompts-02-03
- Added the prompts behind versions 02 and 03 from Claude's session: the owner's request to rebuild from scratch, the production brief handed between Claude sessions, the owner's approvals, and the owner's request for the text ending. Verbatim, with English translations; local file paths replaced by repository paths.
- Updated the coverage note in `prompts/README.md`. Prompts now attach to 19 items; only r1 (a review sheet) has none.

## 2026-10-20 · claude · claude/outgrow-style-skill
- Added the reusable skill `skills/outgrow-style/`: the working process with the owner, the style (copy of `STYLE.md`), tuned recipes (contour field, soul, impacts and waves, camera, flight to a target frame, typography, pacing), a lessons table of past traps and fixes, the Claude lineage source as a reference implementation, and the `stills.sh` / `strip.sh` checking scripts.
- Linked into `~/.claude/skills/outgrow-style` on the owner's machine; `AGENTS.md` and `CLAUDE.md` point agents to it.

## 2026-10-20 · claude · claude/comments-ending
- Version 04 "Comments ending" (parent 03, 24.6 s): the soul inhales "Break the shape. Keep becoming.", writes Meaning / in the / **comments.**, dives into 12 guiding lines that converge on a drawn comment bubble slightly left of YouTube's real button, and settles as three typing dots that become the bubble's bars; ~2 s calm pulse. Owner approved the open points, the stills and the draft.
- Code: `src/claude/src/finale.ts` (score and layout), `Comments.tsx` (render), `shapes.ts` (soul outlines moved out of `Outgrow.tsx`); inhale added to `Title.tsx`; duration and a touch wave in `timeline.ts`.
- Published `docs/media/outgrow/04-claude-comments.{mp4,jpg}`; the target frame is study m1 (`basedOn` of 04). Decision row in `BRIEF.md`; idea `ideas/2026-10-20-comments-ending.md` marked chosen.
- Open: the owner's original Ukrainian request for this ending is not in `prompts/` (only its translated summary in the idea file); check on a real phone that the bubble reads as pointing to the button; the master is not attached to a Release.

## 2026-10-20 · claude · claude/master-downloads
- GitHub Releases with full-quality masters: `outgrow-03` (16.5 s, 32.1 MB; verified against the 03 web copy) and `outgrow-04` (24.6 s, 38.5 MB).
- Versions can name their master in `project.json` (`master.url`, `master.size`); `build-site-data.mjs` checks it is a Release download link; the site shows "Download master (… MB)" next to the code link. `AGENTS.md` step 6 says how.
- Open: no master on record for 01 (Codex) or 02.

## 2026-10-20 · codex · codex/latest-ideas
- Added proposed idea records in ideas/: 2026-10-20-soul-becomes-pointer.md, 2026-10-20-period-becomes-pointer.md, 2026-10-20-larger-comment-bubble.md, 2026-10-20-phone-target-validation.md and 2026-10-20-comment-cta-copy-options.md. Each distinguishes historical alternatives from the approved version 04 baseline.
- Added four agent-generated concept images in references/images/: comments-soul-pointer-study.png, comments-period-pointer-study.png, comments-contour-pointer-study.png and comments-bubble-high-study.png, with rows in references/REFERENCES.md. Existing m1 is byte-identical to the selected local concept and was not duplicated.
- Open: whether to explore an alternative pointer/period transition, whether the 04 bubble needs resizing, which phone layouts define acceptance, overlap versus the currently approved beside-button placement, and whether to test alternate/pinned-comment wording. No decisions, code, version records or published media changed.

## 2026-10-20 · codex · codex/latest-ideas
- Added verbatim owner request bodies with English translations in prompts/2026-10-20-owner-comments-continuation.md and prompts/2026-10-20-owner-comment-bubble-refinement.md. They record historical creative input for 04 and m1, not approval of the new proposed alternatives. Third-party screenshots and attachment metadata are excluded.
- Ran scripts/build-site-data.mjs and regenerated docs/data/projects.json to attach the requests. Verified original prompt strings, translations, local idea links, proposed statuses and unchanged version/study records; no third-party images added.
- Open: owner review of the five proposals. Work is committed locally on codex/latest-ideas; no push, PR or merge requested.

## 2026-10-20 · claude · claude/comments-studies
- Built on Codex's `codex/latest-ideas` (PR #12): its four concept stills are now studies on the site. Under 03, group "Comment pointer studies": p1 soul pointer (explored), p2 period pointer (explored), p3 contour pointer (chosen); b1 first bubble (superseded) grew from p3, and m1 now hangs from b1, so the tree reads 03 → p3 → b1 → m1 → 04.
- Web copies in `docs/media/outgrow/studies/`; site data rebuilt.

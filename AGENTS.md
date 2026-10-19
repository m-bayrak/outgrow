# Agent guide

This repository is a motion-graphics studio. Several AI agents (Codex, Claude, ChatGPT) work in it for one owner. This file is the single source of rules for all of them. Follow it exactly so that work lands in the right place the first time and nobody has to explain it twice.

- Talk to the owner in **Ukrainian**. Write everything in the repository (code, docs, commit messages, on-screen text) in **English**.
- This repository is **public**. Never commit personal data, private chats, credentials, or **anything made by someone else** — videos, images, screenshots, article graphics, fonts outside their licence. Link to it instead (see below).

## Read before you start

1. This file.
2. [`STYLE.md`](./STYLE.md) — the visual and motion language. Mandatory for new pieces.
3. The project you are touching: `projects/<project>/BRIEF.md`, then `projects/<project>/LOG.md` (the latest entries tell you what the other agents just did and what is next).

## Repository map

```
AGENTS.md               rules for every agent (this file)
CLAUDE.md               Claude-specific additions; imports this file
STYLE.md                shared visual and motion language
README.md               front page for people
inbox/                  fallback drop zone when you cannot tell where something belongs
templates/              starting files for new projects and ideas
scripts/                repo-level tools (site data, media encoding)
projects/<project>/
  project.json          manifest: title, statement, every published version
  BRIEF.md              concept, rules, decisions log
  LOG.md                append-only work log shared by all agents
  ideas/                one Markdown file per idea
  references/           images/, videos/, REFERENCES.md
  src/<author>/         one Remotion project per lineage (codex, claude, …)
docs/                   GitHub Pages site (served from main/docs)
  media/<project>/      web videos and posters, one pair per version
  data/projects.json    generated from all project.json files — do not edit by hand
```

## Where things go

| You have | Put it in | Also do |
| --- | --- | --- |
| An idea, sketch description, direction | `projects/<p>/ideas/YYYY-MM-DD-<slug>.md` (from [`templates/idea.md`](./templates/idea.md)) | One line in `LOG.md` |
| An image the owner or an agent made (sketch, generated concept, render still) | `projects/<p>/references/images/<descriptive-name>.<ext>` | A row in `references/REFERENCES.md`: what to take from it |
| A video the owner made | `projects/<p>/references/videos/` | A row in `REFERENCES.md` |
| **Anything by someone else**: video, image, screenshot, app UI, article graphic | **Do not commit the file.** A row in `REFERENCES.md` under *External references* with the link, author if known, what to take from it and, for video, the exact time ranges. Mark it "(external, not stored)" | Describe what matters in words; if a visual is essential, make your own schematic instead |
| A decision ("we do X because Y") | The **Decisions** table in `projects/<p>/BRIEF.md` | One line in `LOG.md` |
| Code for a piece | `projects/<p>/src/<author>/` (a standalone pnpm + Remotion project) | — |
| A new published version | See **Publishing a version** | — |
| A still that shows a step of the process (concept, layout or colour study, review sheet) | The image in `references/images/` as above, then see **Showing a study on the site** | — |
| A new project | Copy `templates/project/` to `projects/<new-id>/`, fill it in | A row in the root `README.md` |
| Anything you cannot place | `inbox/YYYY-MM-DD-<slug>/` with a `note.md` (see `inbox/README.md`) | The next agent files it and empties the folder |

File names: lowercase, words joined by `-`, dates as `YYYY-MM-DD`. Keep the owner's original file name only for references where it carries meaning.

If you are unsure whether something counts as someone else's (for example a screenshot of an app, or an image that shows a real person), treat it as external. Removing a file later does not erase it from Git history, so decide before committing.

## Publishing a version

Every visible step forward is a **new** version. Never overwrite or delete an existing file in `docs/media/`.

1. Render the master from `projects/<p>/src/<author>/` into its `out/` folder (git-ignored), 1080 × 1920, `--codec=h264 --crf=18`.
2. Encode the web copy and poster:
   ```bash
   scripts/encode-web.sh <master.mp4> docs/media/<p>/<NN>-<author>-<slug> [poster-second]
   ```
   This writes `<NN>-<author>-<slug>.mp4` (~8–15 MB) and `.jpg`. `NN` is the next two-digit number in that project.
3. Add an entry to `versions` in `projects/<p>/project.json` (copy the shape of the last one; `parent` is the version it grew from, or `null` for a fresh interpretation of the brief).
4. Run `node scripts/build-site-data.mjs` and commit the regenerated `docs/data/projects.json`.
5. Append to `LOG.md`.
6. Masters are not committed. When the owner asks, attach the master to a GitHub Release tagged `<p>-<NN>`.

## Showing a study on the site

Studies are the stills between versions. They hang on the same lineage tree as small dots.

1. Make sure the image is in `projects/<p>/references/images/` (owner- or agent-made only).
2. Add an entry to `studies` in `projects/<p>/project.json`:
   - `id`: short and unique in the project (e.g. `e6`); `title`; `author`; `date`;
   - `parent`: the version or study it grew from, or `null` for the brief;
   - `group`: optional; studies with the same group and parent share one row (e.g. "Ending studies");
   - `status`: `chosen`, `explored`, `superseded` or `proposed`;
   - `image`: `media/<p>/studies/<id>.jpg`; `source`: the path of the original in `references/images/`; `note`: one or two plain sentences.
   A version can name the study it was built from with `basedOn`.
3. Run `node scripts/encode-studies.mjs` (makes the 720 px web copy) and `node scripts/build-site-data.mjs`.

## Working together

- **One branch per task**, named `<agent>/<short-task>`: `codex/…`, `claude/…`, `chatgpt/…`. Start from an up-to-date `main`.
- Touch only what your task needs. Do not reformat or move other agents' files.
- `main` changes only through a pull request that the owner approves. Push, open PRs and merge only when the owner asks.
- Small, focused commits with a clear message: what changed and why.
- **Before you finish, append to `projects/<p>/LOG.md`**:
  ```
  ## YYYY-MM-DD · <agent> · <branch>
  - What was done (with paths or version numbers)
  - What is open / suggested next
  ```
  Never rewrite earlier entries.

## How a piece is made

Each stage waits for the owner's approval before the next:

1. **Brief** — restate the idea, propose options, agree on them.
2. **Stills** — 6–9 key frames, one per beat, as a contact sheet.
3. **Draft** — half-resolution video for timing and motion.
4. **Final** — full render, then publish it as a version.

Check your own work visually before showing it: render frames and look at them, compare against the references.

## Tech

- Node.js (Homebrew), pnpm. Each `src/<author>/` is its own pnpm project: `pnpm install`, `pnpm dev` (Remotion Studio), `pnpm lint`.
- Keep Remotion package versions aligned across a project (`npx remotion add <pkg>` picks the right one).
- Determinism is required: same frame number, same pixels.

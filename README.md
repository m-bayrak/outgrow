# Outgrow studio

Vertical motion pieces made in code: black ground, white linework, one orange soul.

**[Watch](https://m-bayrak.github.io/outgrow/)** · [Style](./STYLE.md) · [Agent guide](./AGENTS.md)

## Projects

| Project | Statement | Versions |
| --- | --- | --- |
| [Outgrow](./projects/outgrow/) | Growth sometimes requires stepping beyond the boundaries that have become too confining. | 01 Codex · 02 Claude, wings · 03 Claude, text ending |

Each project keeps its brief, references, ideas, a shared work log and one Remotion source per lineage under `projects/<project>/`. Every published step is a separate video in `docs/media/<project>/`, listed in the project's `project.json`.

## Working here

Codex, Claude and ChatGPT all follow [`AGENTS.md`](./AGENTS.md): where each kind of material goes, how a version is published, branch and log conventions. Read it first.

## Run a piece locally

Requires Node.js 20.19+ (or 22.13+) and pnpm.

```bash
cd projects/outgrow/src/claude   # or src/codex
pnpm install
pnpm dev                         # Remotion Studio
pnpm lint
```

## Credits and usage

Reference assets in `projects/*/references/` were supplied by the owner solely as creative references. They inform motion language and direction; they are not source footage, and their logos, text and palettes are not part of this work.

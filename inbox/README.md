# Inbox

A fallback drop zone. Use it only when you cannot tell where something belongs (see the table in `AGENTS.md`).

Create `inbox/YYYY-MM-DD-<slug>/` containing the files and a `note.md`:

```
---
date: YYYY-MM-DD
from: owner | codex | claude | chatgpt
project: outgrow | new | unsure
type: idea | reference | decision | other
---

What this is and why it matters, in three to five lines.
```

The next agent that sees it files everything into `projects/…`, adds a line to that project's `LOG.md`, and deletes the folder.

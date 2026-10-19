# Outgrow prompt archive

This folder preserves creative instructions behind the work. It contains no private conversation, account details, local paths, or third-party media. The owner explicitly requested original creative wording: Ukrainian excerpts are retained, while metadata and editorial explanations are English.

## How to reuse

Read current BRIEF.md and STYLE.md first. Historical prompts record what actually happened, including superseded colour choices and earlier typography approximations; they do not override current decisions. Use each file's Context section to supply the required input images, not just its text block.

- **Owner records:** original creative wording. Very short requests are verbatim; long rich-text descriptions are explicitly labelled plain-text transcriptions or excerpts. No missing text is invented.
- **Tool records:** exact prompt strings passed to image generation, preserved verbatim. Input images and settings are documented outside the prompt. Repository-relative input paths replace private machine paths only in Context.
- **used_for:** IDs from project.json associated with the request or output. An owner reference-role record informs version 01; it did not generate the supplied concept images.
- **Dates:** image tool calls are from October 19; October 16 owner-brief dates follow project records rather than independently available per-message timestamps.

## Generation chain

| Output ID | Exact image-generation prompt | Actual edit/reference input |
| --- | --- | --- |
| e1 | [Beyond the frame](./2026-10-19-e1-beyond-frame.md) | Claude v02 finale + external typography sample |
| e2 | [Between the wings](./2026-10-19-e2-between-wings.md) | Same two references |
| e3 | [Under pressure](./2026-10-19-e3-under-pressure.md) | Same two references |
| e4 | [Trace of freedom](./2026-10-19-e4-trace-freedom.md) | Same two references |
| e5 | [Words as shell](./2026-10-19-e5-words-shell.md) | Same two references |
| t1 | [Larger type](./2026-10-19-t1-large-type.md) | e4 |
| t2 | [Orange noun phrases](./2026-10-19-t2-orange-objects.md) | t1 |
| t3 | [Orange verbs](./2026-10-19-t3-orange-verbs.md) | t2 (manifest conceptual parent is t1) |
| a1 | [Comment-arrow schematic](./2026-10-19-a1-comment-arrow.md) | Text-only generation |

## Owner creative instructions

- [Motion reference directions](./2026-10-16-owner-motion-references.md)
- [Reference-image roles](./2026-10-16-owner-image-reference-roles.md)
- [Soul and shell](./2026-10-16-owner-soul-and-shell.md)
- [Contact colour](./2026-10-16-owner-contact-colour.md)
- [Headline and five variants](./2026-10-19-owner-five-variants.md)
- [Larger letters](./2026-10-19-owner-larger-letters.md)
- [Orange noun phrases](./2026-10-19-owner-orange-objects.md)
- [Final orange verbs](./2026-10-19-owner-orange-verbs.md)
- [Comment-arrow reference](./2026-10-19-owner-comment-arrow.md)

## Coverage and missing provenance

- **c1–c7:** supplied images; original generating prompts are not available in this conversation. Reference-role and narrative descriptions are preserved, not represented as their generating prompts.
- **01:** the original owner brief and contact-colour instruction are available. This animation was implemented directly in code; no separate single tool prompt generated it.
- **02–03:** added later by Claude from its own session: the owner's requests and approvals verbatim ([rebuild from scratch](./2026-10-16-owner-rebuild-from-scratch.md), [approvals](./2026-10-17-owner-v02-approvals.md), [text ending](./2026-10-19-owner-text-ending.md)) and the [production brief](./2026-10-16-claude-v02-production-brief.md) one Claude session handed to the next. Local file paths in the owner's text are replaced with repository paths. Claude's own descriptions and plans between these messages are not prompts and are summarised in BRIEF.md and ideas/.
- **r1:** a render-review contact sheet made using FFmpeg/PIL, not image generation; there is no text-to-image prompt.
- **e1–e5, t1–t3, a1:** all nine actual image-generation prompt strings are preserved here.
- **External typography sample:** a temporary three-frame sheet from 1–2 seconds of “Claude made this amazing motion design in 15 minute”; no third-party sheet is committed. Original URL remains unresolved in references/REFERENCES.md.
- The reusable animation prompt already in BRIEF.md was drafted as a handoff; it is not evidence of the exact instruction executed by another agent.

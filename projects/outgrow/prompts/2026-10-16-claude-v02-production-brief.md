---
date: 2026-10-16
author: claude
tool: Claude Code (handoff to a new session)
used_for: ["02"]
---

# Claude's production brief for version 02

## Prompt

```text
Продовжуй роботу над Outgrow v2 у цій новій сесії (її створено, щоб підвантажились плагіни Remotion, Generative Art і video-shotcraft). Спілкуйся з користувачем українською.

1. Перевір, що скіли плагінів Generative Art (genart) і video-shotcraft тепер доступні, і прочитай їхні інструкції (особливо рецепти камери з video-shotcraft і перевірку детермінізму з genart). Локальні скіли Remotion лежать у ~/.claude/skills/remotion-*.
2. Перед першою правкою файлів виклич propose_branch (пропозиція: feat/outgrow-v2) і дотримуйся відповіді.
3. Створи новий Remotion-проєкт у ~/code/outgrow/outgrow-v2/ (Node 26 і pnpm 12 уже встановлено через brew; corepack немає). Стару soul-escape/ не чіпай. Композиція 1080×1920, 60 fps, ~14 с.
4. Реалізуй систему контурів за погодженим описом: ті самі безперервні лінії від кілець до крил (кожен контур — одна замкнена/безрозривна крива; форма = суміш цілей коло → овал → вісімка з защемленням → спіраль/розетка → крила, плюс поле деформацій від ударів і хвиль), помаранчева душа з хвостом, помаранчеві спалахи на лініях у місці удару, звукові хвилі, камера реагує (панчі, трекінг, відʼїзд). Палітра лише чорний/білий/помаранчевий. Кожен кадр детермінований від номера кадру.
5. Відрендери 6–8 ключових стоп-кадрів (по одному на кожен біт розкадрування: гачок, удар, боротьба/вісімка, спіраль/розетка, прорив, розкриття, фінал), сам переглянь їх, порівняй з reference-materials/images і виправ очевидне.
6. Покажи користувачу контакт-лист стоп-кадрів (SendUserFile) і запитай, чи затверджує форму, перш ніж переходити до руху. Не роби фінальний рендер MP4 і не пуш без явного дозволу.

Готово, коли користувач отримав контакт-лист затверджуваних стоп-кадрів, а код у outgrow-v2/ збирається (pnpm lint без помилок).
```

## Translation

Continue work on Outgrow v2 in this new session (created so the Remotion, Generative Art and video-shotcraft plugins load). Talk to the user in Ukrainian.

1. Check that the Generative Art (genart) and video-shotcraft skills are available and read them (especially video-shotcraft's camera recipes and genart's determinism checks). Local Remotion skills are in `~/.claude/skills/remotion-*`.
2. Before the first file edit, call propose_branch (suggestion: feat/outgrow-v2) and follow the answer.
3. Create a new Remotion project in `outgrow-v2/` (Node 26 and pnpm 12 installed via Homebrew; no corepack). Leave the old `soul-escape/` alone. Composition 1080 × 1920, 60 fps, ~14 s.
4. Build the contour system as agreed: the same continuous lines from rings to wings (each contour one closed, unbroken curve; shape = a blend of targets circle → oval → pinched figure eight → spiral/rosette → wings, plus a deformation field from strikes and waves), an orange soul with a tail, orange flashes on the lines where it strikes, sound waves, a reactive camera (punches, tracking, pull-back). Palette black, white, orange only. Every frame deterministic from its number.
5. Render 6–8 key stills, one per beat (hook, strike, struggle/figure eight, spiral/rosette, breakthrough, unfolding, finale), review them, compare with the reference images and fix the obvious.
6. Send the user a contact sheet and ask whether they approve the form before moving on to motion. No final MP4 and no push without explicit permission.

Done when the user has the contact sheet to approve and the code in `outgrow-v2/` passes `pnpm lint`.

## Context

The brief one Claude session handed to the next, written after the owner approved Claude's description of version 02. Paths refer to the layout before the repository was restructured (`outgrow-v2/` is now `projects/outgrow/src/claude/`, `reference-materials/` is now `projects/outgrow/references/`); the home-directory prefix of the local skills path is omitted.

## Result

Nine key stills were approved, then motion, then the 13-second final render published as version 02.

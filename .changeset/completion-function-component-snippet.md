---
'@tsrx/typescript-plugin': patch
'@ripple-ts/language-server': patch
---

Fix editor completions (e.g. the `function component` snippet) dying after you type a word, erase it back to a blank line, and start typing again — they worked the first time but never came back until the editor was reloaded.

Root cause: the compiler only emits source↔generated mappings for the tokens it produces, so blank lines and trailing whitespace were covered by no mapping. Volar only runs completion providers where a `completion`-capable mapping covers the cursor, and returns an empty **complete** list everywhere else. VS Code caches that empty-complete result and stops re-requesting, so the cursor visiting a blank line (e.g. after erasing a half-typed word) permanently killed completions there. The language plugin now fills those uncovered gaps with completion-only mappings, without overlapping the precise per-token mappings (an overlap would make TypeScript query completions at the wrong offset).

Also in the completion plugin: the `function component` snippet is now offered when typing `export func…` (it was suppressed inside `export`), moved out of the `@`-directive list so it is not suggested while typing `@`, and the general snippet list is marked incomplete so VS Code keeps re-requesting it as you type.

---
'@ripple-ts/language-server': patch
'@tsrx/typescript-plugin': patch
'@tsrx/core': patch
---

Add TSRX `@` control-flow completions and make them reachable in editors.
Typing `@` in a template now offers `@{}`, `@if`, `@for`, `@switch`, and
`@try` snippets plus the clause keywords (`@else`, `@else if`, `@empty`,
`@case`, `@default`, `@pending`, `@catch`), replacing the typed `@` prefix so
accepting `@if` never produces `@@if`. The legacy `@`-reactivity `@value`
suggestion and the outdated control-flow snippets (`for-of`, `for-index`,
`for-key`, `for-empty`, `for-index-key`, `if-else`, `switch-case`,
`try-pending`) are removed. Previously no completions could appear at a typed
`@` at all: Volar only routes completion requests through completion-enabled
mappings, so `@`-containing JSX text chunks now get exact completion-only
mappings, and the parse-error fallback mapping (a bare `@` in statement
position is a parse error mid-keystroke) keeps completion enabled.

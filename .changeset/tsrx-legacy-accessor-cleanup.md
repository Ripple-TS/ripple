---
'@ripple-ts/language-server': patch
---

Remove legacy `@`-reactivity accessor syntax from completion snippet bodies.
The `track-derived`, `effect`, and `untrack` snippets now insert plain
placeholders (`${2:dependency}`, `console.log(value)`, `${1:value}`) instead
of the removed `@dependency`/`@value` accessor reads.

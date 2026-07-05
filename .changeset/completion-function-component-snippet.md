---
'@ripple-ts/language-server': patch
---

Improve the `function component` completion snippet: it is now offered when typing `export func…` (it was suppressed inside an `export` statement), and it is no longer suggested while typing `@` (it is not an `@`-directive).

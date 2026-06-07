---
"@tsrx/core": patch
"@tsrx/ripple": patch
"@tsrx/solid": patch
"@tsrx/vue": patch
"ripple": patch
"@tsrx/prettier-plugin": patch
"@tsrx/eslint-parser": patch
"@ripple-ts/language-server": patch
"@tsrx/mcp": patch
---

Add `@empty { ... }` fallbacks for TSRX `@for` loops, require prefixed template continuation clauses such as `@else`, `@empty`, `@pending`, `@catch`, `@case`, and `@default`, and reject direct `continue`, `break`, and `return` statements inside `@for` loop bodies and `@if` template branches.

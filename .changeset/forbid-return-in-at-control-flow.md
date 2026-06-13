---
'@tsrx/core': patch
'@tsrx/ripple': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
---

Disallow `return` statements inside `@try`/`@catch`/`@pending` blocks.

`return` is only valid in the JS setup at the top of a `@{ … }` code block —
never inside a `@`-directive block. `@if`/`@for`/`@switch` already rejected
returns; `@try`/`@catch`/`@pending` previously allowed `return <markup>` (lowering
it into a reactive boundary fallback). They now reject any `return` (with or
without an argument) with the same `Return statements are not allowed inside TSRX
templates` diagnostic, consistently across every target (ripple, react, preact,
solid, vue). Render markup by writing it as the block's output instead of
returning it. Returns inside nested ordinary functions are unaffected.

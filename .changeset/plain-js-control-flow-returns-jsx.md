---
'ripple': patch
'@tsrx/core': patch
'@tsrx/ripple': patch
'@tsrx/solid': patch
---

Treat plain JS control flow inside `@{ … }` as ordinary JavaScript that returns
JSX.

Only `@`-directives (`@if`/`@for`/`@switch`/`@try`) lower to template control
flow. Plain `if`/`for`/`for…of`/`for…in`/`while`/`do…while`/`switch`/`try`
inside a code block are now compiled exactly like the same control flow in a
regular `function C() { …; return <jsx> }` body — their JSX returns become
`tsrx_element` values rather than being template-ized.

Previously these plain statements were mis-routed into the template transform:
on **ripple** an early-return guard produced a `_$_.if`/`_$_.switch`/`_$_.try`
wrapper (with dead code in the `switch`/`try` cases) and plain loops threw a
compile error; on **solid** they produced `<Show>`/`<Switch>`/`<For>`/`<Errored>`
(dropping trailing output for `try`). They now stay as plain control flow, so
early-return guards and loops behave like normal JavaScript.

As part of this, the ripple client and server targets no longer emit the
`return_guard` bookkeeping variable: a plain early `return` is a real early
return, so subsequent template output is naturally skipped without a guard flag.

On **solid**, this means a plain guard (`if (signal()) return …`) inside a
component body now runs once at setup — exactly like a regular Solid component —
instead of being lifted into a reactive `<Show>`. Use `@if` (or another
`@`-directive) when you want reactive conditional rendering.

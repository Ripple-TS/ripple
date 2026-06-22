---
'@tsrx/ripple': patch
'@tsrx/core': patch
'ripple': patch
---

Skip the wrapper anchor for single control-flow / code-block root components. When a component's entire renderable body is a single `@if`, `@switch`, `@for`, or `@try` (including a `@{}` body whose only output after setup is one of these), the compiler now renders it directly before the parent-provided `__anchor` instead of synthesizing a `<!>` fragment wrapper and an extra append + clone. For deep recursive trees this measurably cuts mount time (the wrapper accounted for a large share of mount-time DOM appends and `cloneNode`s) and shrinks generated output.

Hydration is preserved: the control-flow runtimes (`if_block`/`switch_block`/`for_block`/`for_block_keyed`/`try_block`) capture the SSR boundary marker and hand it to `append()` afterward, so the existing context-aware cursor advance still runs — including for a control-flow-root component used as a child of a composite/slot with following siblings.

Also relaxes the compiler's text-expression detection: `string + anything` (e.g. `{a + '|' + b}`) is now recognized as text and lowered to the fast `set_text` path without requiring an explicit `as string`, since such an expression always evaluates to a string in JS.

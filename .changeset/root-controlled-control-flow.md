---
'@tsrx/ripple': patch
'@tsrx/core': patch
'ripple': patch
---

Skip the wrapper anchor for single control-flow / code-block / component root scopes. When a scope's entire renderable output is a single `@if`, `@switch`, `@for`, `@try`, or static child component — i.e. a component body, a control-flow branch, or a `@{}` body whose only output after setup is one of these — the compiler now renders it directly before the parent-provided `__anchor` instead of synthesizing a `<!>` fragment wrapper and an extra append + clone. For deep recursive trees this measurably cuts mount time and shrinks generated output; in the recursive-context benchmark it brought mount DOM operations to one clone + one append per element (from ~1.5×) and halved the comment-anchor nodes.

Hydration is preserved. The control-flow runtimes (`if_block`/`switch_block`/`for_block`/`for_block_keyed`/`try_block`) capture the SSR boundary marker and hand it to `append()` afterward, so the existing context-aware cursor advance still runs — including for a root scope used as a child of a composite/slot with following siblings. Single-component roots need no runtime change at all, since a component's own content advances the hydration cursor.

Also relaxes the compiler's text-expression detection: `string + anything` (e.g. `{a + '|' + b}`) is now recognized as text and lowered to the fast `set_text` path without requiring an explicit `as string`, since such an expression always evaluates to a string in JS.

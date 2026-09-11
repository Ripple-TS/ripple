---
'@tsrx/ripple': patch
---

A `@for` directive now lowers as a template loop wherever it is written, not only inside a `@{ … }` component. Both the index/key analysis and the server lowering were gated on being inside a component, and a component was recognized only by its `@{ … }` body — so a template written anywhere else silently lost the parts of `@for` that depend on that analysis: a function that returns its template (`function List({ items }) { return <ul>…</ul> }` or `({ items }) => <ul>…</ul>`), a template held in a variable, and a bare `@for` assigned to a variable and rendered through an expression.

This fixes, for a `@for` in any such template: an `index` binding read without `.value`, rendering `[object Object]`; a `key` clause that did not reach its tracked pattern; and, on the server, the loop being dropped from the output altogether with its item and index bindings left dangling.

---
'@tsrx/core': patch
---

Apply lazy `&{ … }` / `&[ … ]` destructuring inside nested `@{ … }` code blocks
and `@if` / `@for` / `@switch` / `@try` directive bodies (React, Preact, Solid,
and Vue production output), instead of leaving the lazy declaration as a plain
destructure while its references go unrewritten.

These scopes lower to compiler-generated function boundaries — scoped IIFEs,
`.map(...)` callbacks, and `<Show>` / `<For>` / `<Match>` render closures — that
did not exist when `has_lazy_descendants` was first stamped, so the lazy
transform's fast-path skipped them. The descendant flag is now re-derived over
the fully lowered tree before the transform runs, so a `let &{ name } = props`
declared in a nested block or directive body is rewritten to
`let __lazy0 = props` + `__lazy0.name` exactly as it is in a flat component body.
A `@switch` case body's lazy bindings are now collected too (the shared switch
block scope), so a reference like `{value}` becomes `{__lazy0.value}` rather than
a half-transformed `let __lazy0 = props` with a dangling `value`.

Type-only (virtual TSX) output is unchanged: it never runs the lazy transform, so
the pattern keeps printing as a plain destructure.

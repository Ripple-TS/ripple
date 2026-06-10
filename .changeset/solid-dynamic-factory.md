---
'@tsrx/core': patch
'@tsrx/solid': patch
---

Lower dynamic tags (`<{expr}>`) for Solid production output to a scoped
`const TsrxDynamic_N = _tsrx_dynamic(() => expr)` binding (aliasing `dynamic`
from `@solidjs/web`) instead of the `Dynamic` helper component. The
declaration is placed in the scope that owns the expression (e.g. inside
`<For>` callbacks), and the type-only transform keeps the
`<TsrxDynamic is={expr}>` shape.

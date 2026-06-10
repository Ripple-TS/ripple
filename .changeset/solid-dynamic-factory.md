---
'@tsrx/core': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
---

Lower dynamic tags (`<{expr}>`) for Solid and Vue production output to scoped
component bindings instead of the `Dynamic` helper component. Solid binds
`const TsrxDynamic_N = _tsrx_dynamic(() => expr)` (aliasing `dynamic` from
`@solidjs/web`); Vue aliases the tag inside an import-free expression-child
IIFE so vue-jsx-vapor's render block keeps it reactive. Declarations are
placed in the scope that owns the expression (e.g. inside loop callbacks),
and the type-only transform keeps the `<TsrxDynamic is={expr}>` shape with
source mappings for both tag positions.

---
'ripple': patch
---

fix(types): widen `Component`'s return type to everything the runtime renders

`Component` declared `(props: T) => void | TSRXElement`, so a component that
returned a string, number, bigint, boolean, `null`, or an array — all of which
both runtimes render — was rejected at `mount`, `hydrate`, and the server
`render`. The return type is now the new exported `Renderable` union, which
mirrors the shared dispatch in `render_value`/`render_expression`: elements
render, arrays flatten recursively, nullish renders nothing, everything else is
stringified. Promises, functions, and symbols stay rejected because neither
runtime renders them.

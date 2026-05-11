---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
---

Compile `for ... of` in React and Preact components through a new `map_iterable` runtime helper instead of an inline `Array.isArray(src) ? src : Array.from(src)` normalization followed by `.map(...)`. Both the non-hook and hook-bearing lowerings now emit a single `map_iterable(source, (item, i) => ...)` call that accepts any `Iterable` — `Set`, `Map`, generators, and other iterators — without copying arrays. The helper is imported from a new target-namespaced subpath: `@tsrx/react/runtime` for React output and `@tsrx/preact/runtime` for Preact output, both of which re-export from `@tsrx/core/runtime`, so end-user projects only need the target package installed. Loop-scoped TS types in editor-tooling (non-module-scoped helper) output reference the new `IterationValue<T>` helper so destructured `Map` entries and other non-array sources type-check correctly.

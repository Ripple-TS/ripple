---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
---

Collect transform-time errors instead of throwing in loose mode for the JSX
targets (React, Preact, Solid, Vue). Recoverable validation failures (component
`await` without `"use server"`, `<tsx:kind>` mismatches, multiple `ref={...}`
attributes, malformed `try` blocks, fragment-as-element, `for await...of`)
now push onto `result.errors` so the typescript-plugin and other editor
tooling can surface them as diagnostics on top of a still-valid virtual TSX,
mirroring how `@tsrx/ripple` already behaves.

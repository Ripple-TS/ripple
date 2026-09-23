---
'@tsrx/ripple': patch
'ripple': patch
'@ripple-ts/vite-plugin': patch
---

Update `@tsrx/core` to ^0.3.2, where each `@switch` arm (`@case x: { … }` or
`@default: { … }`) is its own block scope. Two arms can now declare the same
local: the server output and the TypeScript output give an arm that declares a
name its own block inside the generated `switch`, so the names no longer collide.
`@import` inside a `<style>` block is now the `tsrx-css-import` compile error.

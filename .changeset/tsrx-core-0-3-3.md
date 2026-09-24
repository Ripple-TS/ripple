---
'@tsrx/ripple': patch
'ripple': patch
'@ripple-ts/vite-plugin': patch
---

Update `@tsrx/core` to ^0.3.3. Two `module B { … }` blocks in the same
`declare namespace` now merge as they do in TypeScript instead of failing with
`'B' has already been declared in the current scope`. The editor now reports
TypeScript errors on a class whose base is a call, a parenthesized expression, or
an array literal, such as `class Model extends createBase() {}`.

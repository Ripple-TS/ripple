---
'@tsrx/core': patch
---

Fix a parse error on a callback prop whose parameter has a no-argument function
type, such as `<Boundary fallback={(reset: () => void) => …}>`, by upgrading
`@sveltejs/acorn-typescript` to a version that restores parser state after
speculative parse branches.

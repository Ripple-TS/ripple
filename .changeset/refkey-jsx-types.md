---
'ripple': patch
'@tsrx/ripple': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
'@tsrx/core': patch
'@tsrx/prettier-plugin': patch
---

Type host `ref={...}` attributes, named ref props, and generated ref keys so inline callbacks `{ref ...}` receive element-specific JSX types.

Exclude `returnType` from the compiler types that use typeAnnotation instead due to the way `@sveltejs/acorn-typescript` parses them.

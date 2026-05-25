---
'ripple': patch
'@tsrx/core': patch
'@tsrx/prettier-plugin': patch
---

Type host `ref={...}` attributes and generated ref keys so inline callbacks `{ref ...}` receive element-specific JSX types.

Exclude `returnType` from the compiler types that use typeAnnotation instead due to the way `@sveltejs/acorn-typescript` parses them.

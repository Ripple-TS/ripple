---
'@ripple-ts/adapter': patch
'@ripple-ts/adapter-node': patch
'@ripple-ts/adapter-bun': patch
---

Extract shared adapter primitives and types into `@ripple-ts/adapter`, then use
them from both `@ripple-ts/adapter-node` and `@ripple-ts/adapter-bun`.

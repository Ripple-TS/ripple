---
'@ripple-ts/adapter': patch
'@ripple-ts/adapter-node': patch
'@ripple-ts/adapter-bun': patch
---

Add a shared `ServeStaticDirectoryOptions` type in `@ripple-ts/adapter` and update
node/bun adapters to consume it instead of redefining the same
`ServeStaticOptions & { dir?: string }` shape locally.

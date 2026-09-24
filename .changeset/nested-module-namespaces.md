---
'@tsrx/ripple': patch
---

Compile `declare module A.B { … }` and a `module` block inside a `declare`
namespace as TypeScript namespaces instead of failing with a fatal error about
`module server`. A dotted `module server.api` now reports that dotted names are
not supported, and a misplaced `module` block is reported without discarding the
file's editor output.

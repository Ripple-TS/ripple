---
'@tsrx/prettier-plugin': patch
---

Keep the `type` keyword when printing `export type { X } from '…'` and inline `export { type X, y }` specifiers, and the `declare` keyword on ambient `declare module '…' { … }` declarations. Previously formatting stripped them, turning type-only re-exports into runtime re-exports of nonexistent bindings and leaving invalid `module '…' { … }` output.

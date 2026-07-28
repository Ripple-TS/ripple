---
'@tsrx/prettier-plugin': patch
'@tsrx/core': patch
---

fix: stop dropping TypeScript modifiers when formatting

Formatting silently rewrote what the source declared. `readonly` was dropped from
interface and type-literal members, turning `readonly id: number` into a mutable
`id: number`; `abstract` was dropped from classes and their members (and abstract
methods gained an empty body, making them concrete); and `declare`, `override`,
`accessor`, accessor kinds on method signatures (`get`/`set`), `abstract new`,
`declare global` (printed as `declare module global`), computed keys, class static
blocks, and constructor parameter properties were dropped or mangled the same way.

All of these now round-trip, and `@tsrx/core`'s AST types carry the class modifiers
the printer needs.

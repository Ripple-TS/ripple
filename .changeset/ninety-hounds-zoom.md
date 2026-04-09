---
'@ripple-ts/prettier-plugin': patch
---

Fix formatting of TypeScript interface call signatures with conditional types (including `infer`) so Prettier preserves them instead of emitting unknown-node placeholders.

---
'@tsrx/ripple': patch
---

Report an actionable diagnostic for unsupported runtime TypeScript enums in
`.tsrx` files instead of silently emitting invalid client or server JavaScript.
Erase ambient enum declarations from JavaScript while preserving them for editor
type checking.

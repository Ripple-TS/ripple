---
'@tsrx/typescript-plugin': patch
---

Resolve the bare-package TSRX compiler declared in the nearest tsconfig.json before built-in compiler candidates, and validate declarations with a fail-closed npm package specifier allowlist. Malformed configs without a textual `tsrx` key now warn and preserve candidate resolution, while malformed or invalid compiler declarations hard-stop instead of silently falling back.

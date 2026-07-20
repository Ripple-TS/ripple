---
'@tsrx/typescript-plugin': patch
---

Resolve the bare-package TSRX compiler declared in the nearest tsconfig.json before built-in compiler candidates, trim valid declarations before resolution, and validate them with a fail-closed npm package specifier allowlist. Compiler package roots are now discovered from their nearest package.json instead of assuming a fixed entry layout. Malformed configs without a textual `tsrx` key now warn and preserve candidate resolution, while malformed or invalid compiler declarations hard-stop instead of silently falling back.

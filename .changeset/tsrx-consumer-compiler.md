---
'@tsrx/typescript-plugin': patch
---

Resolve bare-package TSRX compiler declarations through the active TypeScript project's explicit `extends` chain, including transitive, array, JSONC, and package-based configs. The nearest tsconfig is used only when project context is unavailable. Child and later declarations override inherited values, resolution starts from the config that supplied the effective declaration, and nested projects do not inherit unrelated ancestor configs. Compiler declarations remain trimmed and protected by the fail-closed npm package specifier allowlist. Unresolved inheritance and malformed or effectively invalid declarations hard-stop, while malformed readable config chains without `tsrx` intent warn and preserve candidate resolution. Missing relative bases are tracked so creating them refreshes the project automatically.

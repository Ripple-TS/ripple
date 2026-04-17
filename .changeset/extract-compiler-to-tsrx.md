---
'@tsrx/core': patch
'@tsrx/ripple': patch
'ripple': patch
'@ripple-ts/eslint-plugin': patch
---

Extract compiler into `@tsrx/core` and `@tsrx/ripple` packages

- `@tsrx/core`: Core compiler infrastructure — parser factory, scope management, utilities, constants, and type definitions
- `@tsrx/ripple`: Ripple-specific compiler — RipplePlugin, analyze, client/server transforms
- Remove compiler source code from `ripple` package (consumers should use `@tsrx/ripple`)
- Migrate eslint-plugin type imports to `@tsrx/core/types/*`
- Remove unused compiler dependencies from `ripple` package

---
"@tsrx/core": patch
"@tsrx/ripple": patch
"@tsrx/solid": patch
"@tsrx/prettier-plugin": patch
"@tsrx/eslint-parser": patch
"@tsrx/eslint-plugin": patch
"@ripple-ts/language-server": patch
"@tsrx/mcp": patch
---

Remove the reserved `<tsx>` expression wrapper and use TSRX fragments as the native expression form.

Plain `<tsx>` is now treated as an ordinary element, while host-framework islands continue to use explicit compat tags such as `<tsx:react>`. Tooling now uses the `TsrxFragment` AST node for native fragments and updates formatting, linting, symbols, transforms, and generated docs around the simplified syntax.

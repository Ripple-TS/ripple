---
'@tsrx/core': patch
'@tsrx/ripple': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
'@tsrx/eslint-parser': patch
'@tsrx/mcp': patch
---

Add shared TSRX semantic analysis and report free-floating template output in normal function bodies. Runtime builds now fail when output would be discarded, while type-only and Volar compilation collect the diagnostic and continue. Return or retain template values, or use an `@{}` function body for implicit output.

---
'@tsrx/core': patch
---

Replace the JSX platform contract's `any` values with ESTree and ESTree JSX node types, and
rename the generic AST clone helper to `clone_ast_node`. Remove the obsolete pre-parser-native
attribute normalization API and its legacy AST types.

---
'@tsrx/ripple': patch
---

`parse()` now returns the parser's raw AST instead of the Ripple-normalized
one: template nodes keep their JSX shapes (`JSXElement`, `JSXFragment`,
`JSXText`, `JSXExpressionContainer`, `JSXAttribute`, `JSXStyleElement`) and
control-flow directives keep their `JSX…Expression` forms. The Ripple-specific
`Element`/`TsrxFragment`/`Text`/`TSRXExpression`/`Attribute`/`SpreadAttribute`
node types are no longer produced; the analyzer and client/server transforms
consume the parser AST directly.

The analyzer and transforms are also copy-on-write now — they never mutate the
parsed AST — so `compile_to_volar_mappings` no longer clones the tree, and the
Volar source walk sees the analyzer's scoped-CSS metadata: class attributes on
scoped elements get their CSS hover and go-to-definition mappings back.

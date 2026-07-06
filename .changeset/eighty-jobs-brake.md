---
'@tsrx/core': patch
---

Remove the Ripple-normalized AST node types (`Element`, `TsrxFragment`,
`Text`, `TSRXExpression`, `Attribute`, `SpreadAttribute`) and their builders
(`builders.text`, `builders.tsrx_fragment`, `builders.tsrx_expression`).
`@tsrx/ripple` now consumes the parser's JSX AST directly, so these shapes are
no longer produced anywhere.

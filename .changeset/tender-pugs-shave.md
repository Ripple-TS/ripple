---
'@tsrx/prettier-plugin': patch
---

fix: keep parentheses around a parenthesized default-exported class or function expression

`export default (class Named {})` was formatted to `export default class Named {}`,
which is a different program. The parenthesized form is a class *expression*, so
`Named` is bound only inside the class body; the paren-less form is a class
*declaration*, so `Named` becomes a module-scoped binding that later code can
reference. The same applied to `export default (function foo() {})`.

The printer now consults the original source for the parens rather than the node
type alone — a decorated `export default @dec class Named {}` also parses as a
`ClassExpression` but is genuinely a declaration — and terminates the
parenthesized expression export with a semicolon.

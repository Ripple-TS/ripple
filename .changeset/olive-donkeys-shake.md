---
'@tsrx/prettier-plugin': patch
'@tsrx/core': patch
---

fix: terminate expression default exports, and print anonymous default-exported functions

`export default <expression>` is a statement and needs a `;`, but the printer
only emitted one for the parenthesized class and function expressions handled in
the previous fix. Every other expression form lost its terminator:
`export default foo;` was formatted to `export default foo`.

That is an ASI hazard, not a cosmetic difference. The following line is pulled
into the exported expression whenever it starts with `(`, `[`, a template
literal, `+`, `-`, or `/`, so

```ts
export default foo;
(function () {})();
```

was reformatted into the single call `export default foo(function () {})()`.

The terminator is now decided by whether the export is a declaration or an
expression. The declaration forms — `class`, `function`, `interface`, an
overload signature, and the decorated `export default @dec class Named {}` that
parses as a `ClassExpression` — still end at their closing brace.

Separately, `export default function () {}` crashed the printer. It is the one
position where a `FunctionDeclaration` may be anonymous, and the printer read
the name unconditionally. Anonymous default-exported functions, async functions,
and generators now print.

`@tsrx/core` gains `TSRXExportDefaultDeclaration`, which models the two
TypeScript-only declaration forms the parser puts in that slot —
`export default interface Foo {}` and `export default function foo();` — that
estree's `ExportDefaultDeclaration` does not.

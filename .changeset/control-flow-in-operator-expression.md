---
'@tsrx/core': patch
---

Lower bare `@if`/`@for`/`@switch`/`@try` control-flow directives that sit as an
operand of an operator expression — a logical/binary operand
(`let c = (@if (…) { … }) || 'default'`, `count + @switch (…) { … }`), a
conditional (ternary) branch (`cond ? @if (…) { … } : <p />`), or a sequence
expression. For the React, Preact, Solid, and Vue targets these previously leaked
an untransformed `JSXIfExpression`/`JSXForExpression`/`JSXSwitchExpression`/`JSXTryExpression`
straight to the printer and crashed with "Not implemented: JSX…Expression". The
operand is now wrapped in a native TSRX fragment before transform, so it flows
through the same render machinery as an expression-bodied arrow, `return`,
assignment, or call argument, and each platform emits its existing lowering.

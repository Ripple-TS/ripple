---
'@tsrx/core': patch
---

Lower bare `@if`/`@for`/`@switch`/`@try` control-flow directives that sit directly in an expression position — an expression-bodied arrow (`const M = (props) => @switch (x) { … }`), a `return @switch (x) { … }`, or assignment to a variable (`const view = @switch (x) { … }`, `view = @switch (x) { … }`). For the React, Preact, Solid, and Vue targets these previously leaked an untransformed `JSXSwitchExpression`/`JSXIfExpression`/`JSXForExpression`/`JSXTryExpression` straight to the printer and crashed with "Not implemented: JSX…Expression". The directive is now wrapped in a native TSRX fragment before transform, so it flows through the same render machinery as a component-body output and each platform emits its existing lowering (an IIFE+`switch` for React/Preact/Vue, `<Switch>`/`<Match>` for Solid).

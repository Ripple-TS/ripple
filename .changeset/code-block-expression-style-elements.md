---
'@tsrx/core': patch
---

Lower TSRX-only nodes inside expression-position `@{ … }` code blocks. Setup
statements of a code block used as an expression (e.g. `const Test = @{ … }`)
were carried into the generated scoped IIFE verbatim without re-visiting them,
so a style expression (`const styles = <style> … </style>`) or a nested
`@{ … }` block inside the setup reached the printer as a raw `JSXStyleElement`
/ `JSXCodeBlock` node and failed with "Not implemented: JSXStyleElement". The
lowered scope is now re-visited the same way function-body code blocks are, so
style expressions compile to their class maps (with the CSS emitted) and
nested blocks lower into their own scopes.

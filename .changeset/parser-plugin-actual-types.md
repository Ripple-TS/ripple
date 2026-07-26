---
'@tsrx/core': patch
---

chore(types): type the parser plugin without `any`

Every `any` cast in the acorn plugin is gone, and the type declarations it was
papering over now describe what the parser actually produces:
`jsx_parseOpeningElementAt` returns `TSRXJSXOpeningElement | JSXOpeningFragment`
instead of the plain `JSXOpeningElement` it never emits for `<>` or a dynamic
`<{expr}>` tag, `TSRXJSXFragment` carries the loose-mode `unclosed` flag, and
`TSRXJSXClosingElement` carries the `isDynamic` flag both halves of a dynamic tag
get. `@sveltejs/acorn-typescript`'s `tsTryParseAndCatch` and
`tsParseTypeArgumentsInExpression` are declared on the parser interface, and the
in-place node retypes (statement to `JSX*Expression` directive, opening/closing
element to fragment, the under-construction template node's discriminant and
opening/closing slots) go through named views in the types package. Parser
behavior is unchanged.

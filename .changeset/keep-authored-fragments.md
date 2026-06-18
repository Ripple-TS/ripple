---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Keep an authored `<> … </>` fragment verbatim when it is used as a JavaScript
value, instead of unwrapping a single-child fragment to its bare child (React,
Preact, Solid, Vue, and Ripple `to_ts`).

Previously a single-child fragment in a value position was collapsed —
`const v = <>{1}</>` became `const v = 1`, and
`@if (cond()) { <>{[1, 2, 3]}</> } @else { <>{[3, 4, 5]}</> }` became
`cond() ? [1, 2, 3] : [3, 4, 5]` — turning the author's JSX into a plain value and
changing its meaning. Authored fragments are now kept in value positions: a
variable initializer, an assignment, an operator operand, a conditional branch,
an array element, and the branches of an `@if`/`@for`/`@switch`/`@try`.

A compiler-generated wrapper fragment (the one added around a control-flow
directive so it lowers to a value) is marked internally and still collapses, so
`const x = @switch (…) { … }` is unchanged. Multi-child fragments, empty `<></>`,
and `<><></></>` were already kept; a fragment in a JSX-child / `{ … }` container
slot is unchanged.

For the JSX targets, render-output positions (a component's render, a `return`)
still collapse. Ripple's `to_ts` view additionally keeps authored render-output
fragments (a directive branch body, the component's `<> … </>` output); Ripple's
client/server runtime output is unaffected (it already renders fragments via
`tsrx_element`), so only the `to_ts` view changes.

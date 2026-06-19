---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Keep an authored `<> … </>` fragment verbatim in EVERY position, instead of
unwrapping a single-child fragment to its bare child (React, Preact, Solid, Vue,
and Ripple `to_ts`).

Previously a single-child fragment was collapsed — `const v = <>{1}</>` became
`const v = 1`, `return <>{x}</>` became `return x`, and
`@if (cond()) { <>{'Hi'}</> }` became `cond() ? 'Hi' : null` — turning the author's
JSX into a plain value and changing its meaning (a fragment is always a truthy
element and has a different type, so collapsing can produce the wrong output).
Authored fragments are now kept everywhere:

- value positions: a variable initializer, an assignment, an operator operand, a
  conditional branch, an array element, a call argument;
- render output: a component's `<> … </>` render, a `return <>…</>`, an arrow body
  `() => <>…</>`;
- the branches of an `@if`/`@for`/`@switch`/`@try` (`@if (c) { <>{'Hi'}</> }` →
  `c ? <>{'Hi'}</> : null`, `@for (…) { <>{x}</> }` → `… => <>{x}</>`);
- Ripple `to_ts` additionally keeps a fragment in a JSX-child `{ … }` container slot
  (`<div>{<>{x}</>}</div>`), matching the JS targets.

An empty authored `<></>` is also kept verbatim everywhere — `return <></>` stays
`return <></>` (not `null`) on all targets.

A compiler-generated wrapper fragment (the one added around a control-flow directive
so it lowers to a value) is marked internally and still collapses, so
`const x = @switch (…) { … }` is unchanged. A nested authored fragment collapses
outer→inner (`<><>{x}</></>` → `<>{x}</>`) — still a fragment, so no wrong output.
A `<style>` inside a fragment is still collected and scoped (the re-wrap operates on
the already style-stripped value). Ripple's client/server runtime output is
unaffected (it renders fragments via `tsrx_element`).

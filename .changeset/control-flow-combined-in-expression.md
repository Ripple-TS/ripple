---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Allow a `@if`/`@for`/`@switch`/`@try` control-flow directive or a `@{ … }` code
block to be combined into an expression (React, Preact, Solid, Vue, and Ripple),
instead of crashing the printer with "Not implemented: JSX…Expression" or leaking
a bare `if (…) { … }` into expression position.

A directive combined into an expression — an operator operand
(`const ad = (@if (…) { … }) || 'fallback'`), a conditional branch, a `@for`
iterable, an `@if`/`@switch` test — is now wrapped so it lives inside a fragment.
For the JSX targets the directive is wrapped in a `<> … </>` (kept as the truthy
fragment value in an operand position, collapsed to its rendered value in a
"raw value" slot). For Ripple the directive is wrapped before normalization, so
the client and server lower it to a `_$_.tsrx_element(…)` render (the control flow
runs inside the render callback) and the `to_ts` output keeps the `<> … </>` for
its TSX type view.

For Ripple the wrap covers a directive used in ANY value position, not just
operators: the sole value of a slot (`let cd = @if (…) { … }`,
`cd = @switch (…) { … }`, `render(@if (…) { … })`), a concise arrow body
(`xs.map((x) => @if (x) { … })`), a `return` argument inside a nested function, a
member object, and so on — all previously leaked a bare `if (…) { … }` statement
in some or all modes. The positions where a directive is already lowered correctly
(render children, statements, `@if` branches, a `@{ … }` code block's render
output) are left untouched. A `@{ … }` code block self-lowers to an IIFE in every
position and is never wrapped (so it is not redundantly fragment-wrapped in, e.g.,
an array element). The JSX targets already collapse a sole-value directive to its
rendered value, so they are unchanged.

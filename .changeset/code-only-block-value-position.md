---
'@tsrx/ripple': patch
---

Lower a code-only `@{ … }` block in value position to a `tsrx_element`. The
value-position IIFE wrap was gated on the block having render output, so a
render-less block assigned to a variable or returned (e.g.
`const Test = @{ const y = 1; };`) was lowered to a bare `BlockStatement` and
printed as a malformed object literal (`const Test = { const y = 1; };`) in
client, server, and `to_ts` output. The wrap now applies regardless of render
output, so a code-only block gets the same lowering as a render-bearing one —
a `tsrx_element` whose setup runs on render and which renders nothing (an
immediately-invoked arrow in the `to_ts` view).

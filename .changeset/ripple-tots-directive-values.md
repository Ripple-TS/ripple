---
'@tsrx/ripple': patch
---

Lower a `@if`/`@for`/`@switch`/`@try` directive used as a VALUE to a typed value
in Ripple's `to_ts` (Volar/editor) output, matching the JS targets — instead of a
void IIFE whose branches had no `return` (so the binding typed as `void`).

Previously `const v = @if (cond()) { <a/> } @else { <b/> }` produced
`const v = (() => { if (cond()) { <a/>; } else { <b/>; } })()` (no returns →
`void`). It now produces a typed value per directive:

- `@if` → a ternary: `const v = cond() ? <a /> : <b />;` (`@else if` chains nest;
  a missing/empty branch is `null`; a branch with setup becomes a returning IIFE).
- `@switch` → a returning IIFE: `(() => { switch (cond()) { case 1: return <a />; … } return null; })()`.
- `@try` → a returning IIFE: `(() => { try { return <a />; } catch (e) { return <b />; } })()`.
- `@for` → an array `.map`: `xs.map((x) => { return <li>{x}</li>; })`.

A branch or case with multiple sibling templates (`@case 1: { <a /> <b /> }`) is
merged into a single `return <><a /><b /></>` rather than several returns where
only the first would be reachable, so the editor types match the template.

The change is scoped to the generated value-position wrapper, so a directive in
render position (a statement, a component's output, a direct JSX child) still
renders unchanged, and the client/server runtime output is byte-identical (only
the `to_ts` view changes).

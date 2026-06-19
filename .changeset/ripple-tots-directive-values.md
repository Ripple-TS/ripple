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
- `@for` → `Array.from(iterable).map((x, i) => { return <li>{x}</li>; })`. `@for`
  accepts any iterable, but `Set`/`Map`/generators have no `.length` or `.map`, so
  lowering them directly typed the binding as an error and never surfaced the
  `@empty` branch; `Array.from(…)` yields a real array (the `to_ts` analog of the
  JS targets' `map_iterable` helper). `; index i` becomes the callback's second
  parameter `(x, i)`; `@empty` is `Array.from(…).length === 0 ? <empty> : <map>`.
  `@for await` iterates an `AsyncIterable`, which `Array.from` does not accept, so
  it instead lowers to an awaited async IIFE with a real `for await` loop
  (`await (async () => { const a = []; for await (const x of xs) a.push(…); return a; })()`).

A branch or case with multiple sibling templates (`@case 1: { <a /> <b /> }`) is
merged into a single `return <><a /><b /></>` rather than several returns where
only the first would be reachable. A directive NESTED inside a branch — directly
(`@case 1: { <a /> @if (c) { <b /> } }` → `return <><a />{c ? <b /> : null}</>`) or
inside an authored fragment that is the branch's value (`@case 1: { <><a /> @for (…)
{ … }</> }` → `return <><a />{xs.map(…)}</>`) — is value content too, so it is
lowered to its own value and merged into the fragment, not left as a bare
`if (c) { … }` / `for (…) { … }` dropped from the value. This holds at any nesting
depth and for every directive combination. So the editor types match the template.

The change is scoped to the generated value-position wrapper, so a directive in
render position (a statement, a component's output, a direct JSX child) still
renders unchanged, and the client/server runtime output is byte-identical (only
the `to_ts` view changes).

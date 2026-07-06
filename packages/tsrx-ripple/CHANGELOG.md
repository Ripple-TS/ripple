# @tsrx/ripple

## 0.1.35

### Patch Changes

- [#1315](https://github.com/Ripple-TS/ripple/pull/1315)
  [`cc95ffa`](https://github.com/Ripple-TS/ripple/commit/cc95ffaef3f3d3cd252176ea94308f89739f0212)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep single-text template
  output faithful to the source instead of promoting it to a string-literal
  expression. A component or fragment whose only output is a text node (e.g.
  `<>@</>` or `<>Hello</>`) is now emitted as-is in both the editor (type-only)
  view and runtime codegen, rather than being rewritten to `{'@'}` / `{'Hello'}`.
  This fixes valid text characters like `@` being mangled and preserves source
  fidelity/mappings across all targets. Nullish or whitespace-only single-text
  output now renders nothing at runtime instead of emitting a stray empty-string
  expression.

- [#1319](https://github.com/Ripple-TS/ripple/pull/1319)
  [`6f78b7f`](https://github.com/Ripple-TS/ripple/commit/6f78b7ff5a5e1f9873a839b709f38e9506545a63)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Valueless event attributes
  (e.g. mid-typing `<div onC>`) no longer crash the compiler with a position-less
  TypeError. They now produce a positioned error at the attribute (recoverable in
  loose/collect mode, so editor completions and diagnostics stay alive on the rest
  of the file), while boolean shorthand on non-event attributes like
  `<div hidden>` keeps compiling clean.

- Updated dependencies
  [[`cc95ffa`](https://github.com/Ripple-TS/ripple/commit/cc95ffaef3f3d3cd252176ea94308f89739f0212)]:
  - @tsrx/core@0.1.34

## 0.1.34

### Patch Changes

- [#1312](https://github.com/Ripple-TS/ripple/pull/1312)
  [`e4e6d7b`](https://github.com/Ripple-TS/ripple/commit/e4e6d7b854786ad19a2c86276ea7e0ffb062e61a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix
  `HierarchyRequestError: Node can't be inserted in a #comment parent` during
  hydration of a `<>…</>` fragment that contains control flow — e.g. an `@if` (or
  `@for`/`@switch`/`@try`/`@else`) body, or a component body, whose fragment leads
  with an `@for`/`@if`. In template position the client lowers such a fragment to
  a `<!>` placeholder + `expression(() => tsrx_element(…))`, whose hydration needs
  a matching `<!--[-->`…`<!--]-->` boundary. The server inlined the fragment
  without one, so the client's `expression()` borrowed the first nested
  control-flow's start marker as its own and advanced the hydration cursor past
  that child's content, landing later operations on a comment node. The server
  transform now brackets such fragments with hydration block markers — matching
  every other control-flow block — when the fragment is a control-flow branch body
  (or nested in an element within one) or leads with content that emits its own
  start marker: a control-flow directive or a `{ … }`/`@{ … }` expression lowered
  to `render_expression`. Fragments that lead with an element/component/plain text
  are unchanged (they reuse their host boundary), so no extra comment nodes are
  emitted for the common cases.

## 0.1.33

### Patch Changes

- [#1283](https://github.com/Ripple-TS/ripple/pull/1283)
  [`ba498cd`](https://github.com/Ripple-TS/ripple/commit/ba498cde76e9f83235ce91da825f403a28441bff)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Print empty fragements as is
  inside expressions {<></>} instead of {null}

- [#1292](https://github.com/Ripple-TS/ripple/pull/1292)
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Allow a
  `@if`/`@for`/`@switch`/`@try` control-flow directive or a `@{ … }` code block to
  be combined into an expression (React, Preact, Solid, Vue, and Ripple), instead
  of crashing the printer with "Not implemented: JSX…Expression" or leaking a bare
  `if (…) { … }` into expression position.

  A directive combined into an expression — an operator operand
  (`const ad = (@if (…) { … }) || 'fallback'`), a conditional branch, a `@for`
  iterable, an `@if`/`@switch` test — is now wrapped so it lives inside a
  fragment. For the JSX targets the directive is wrapped in a `<> … </>` (kept as
  the truthy fragment value in an operand position, collapsed to its rendered
  value in a "raw value" slot). For Ripple the directive is wrapped before
  normalization, so the client and server lower it to a `_$_.tsrx_element(…)`
  render (the control flow runs inside the render callback) and the `to_ts` output
  keeps the `<> … </>` for its TSX type view.

  For Ripple the wrap covers a directive used in ANY value position, not just
  operators: the sole value of a slot (`let cd = @if (…) { … }`,
  `cd = @switch (…) { … }`, `render(@if (…) { … })`), a concise arrow body
  (`xs.map((x) => @if (x) { … })`), a `return` argument inside a nested function,
  a member object, and so on — all previously leaked a bare `if (…) { … }`
  statement in some or all modes. The positions where a directive is already
  lowered correctly (render children, statements, `@if` branches, a `@{ … }` code
  block's render output) are left untouched. A `@{ … }` code block self-lowers to
  an IIFE in every position and is never wrapped (so it is not redundantly
  fragment-wrapped in, e.g., an array element). The JSX targets already collapse a
  sole-value directive to its rendered value, so they are unchanged.

- [#1286](https://github.com/Ripple-TS/ripple/pull/1286)
  [`0e9f523`](https://github.com/Ripple-TS/ripple/commit/0e9f52358a615c2fc7759544e96c43dccb533c86)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep empty fragments in
  expression position: `let b = <></>` stays `<></>` instead of `null`, and
  `let c = <><></></>` keeps both levels instead of collapsing to `<></>`. Applies
  to the React, Preact, Solid, Vue, and Ripple to_ts targets.

- [#1292](https://github.com/Ripple-TS/ripple/pull/1292)
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep an authored `<> … </>`
  fragment verbatim in EVERY position, instead of unwrapping a single-child
  fragment to its bare child (React, Preact, Solid, Vue, and Ripple `to_ts`).

  Previously a single-child fragment was collapsed — `const v = <>{1}</>` became
  `const v = 1`, `return <>{x}</>` became `return x`, and
  `@if (cond()) { <>{'Hi'}</> }` became `cond() ? 'Hi' : null` — turning the
  author's JSX into a plain value and changing its meaning (a fragment is always a
  truthy element and has a different type, so collapsing can produce the wrong
  output). Authored fragments are now kept everywhere:
  - value positions: a variable initializer, an assignment, an operator operand, a
    conditional branch, an array element, a call argument;
  - render output: a component's `<> … </>` render, a `return <>…</>`, an arrow
    body `() => <>…</>`;
  - the branches of an `@if`/`@for`/`@switch`/`@try` (`@if (c) { <>{'Hi'}</> }` →
    `c ? <>{'Hi'}</> : null`, `@for (…) { <>{x}</> }` → `… => <>{x}</>`);
  - Ripple `to_ts` additionally keeps a fragment in a JSX-child `{ … }` container
    slot (`<div>{<>{x}</>}</div>`), matching the JS targets.

  An empty authored `<></>` is also kept verbatim everywhere — `return <></>`
  stays `return <></>` (not `null`) on all targets.

  A compiler-generated wrapper fragment (the one added around a control-flow
  directive so it lowers to a value) is marked internally and still collapses, so
  `const x = @switch (…) { … }` is unchanged. A nested authored fragment collapses
  outer→inner (`<><>{x}</></>` → `<>{x}</>`) — still a fragment, so no wrong
  output. A `<style>` inside a fragment is still collected and scoped (the re-wrap
  operates on the already style-stripped value). Ripple's client/server runtime
  output is unaffected (it renders fragments via `tsrx_element`).

- [#1292](https://github.com/Ripple-TS/ripple/pull/1292)
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep a `<> … </>` fragment
  that is combined into an expression as a fragment, instead of collapsing its
  single child to a bare value (React, Preact, Solid, Vue, and Ripple `to_ts`).

  A fragment is always a truthy element, but its single child may be falsy, so
  unwrapping `<>{0}</>` to `0` flipped the meaning of `<>{0}</> || 'default'` from
  rendering `0` to rendering `'default'`. When a fragment is the operand of an
  operator, a conditional branch, an array element, or another combined
  expression, the fragment is now preserved. The existing collapse is unchanged
  for a fragment that is the sole value of a render-output slot (a `return`, a
  variable initializer, an arrow body, a call argument), where it only renders and
  the collapse is invisible.

- [#1292](https://github.com/Ripple-TS/ripple/pull/1292)
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Lower a
  `@if`/`@for`/`@switch`/`@try` directive used as a VALUE to a typed value in
  Ripple's `to_ts` (Volar/editor) output, matching the JS targets — instead of a
  void IIFE whose branches had no `return` (so the binding typed as `void`).

  Previously `const v = @if (cond()) { <a/> } @else { <b/> }` produced
  `const v = (() => { if (cond()) { <a/>; } else { <b/>; } })()` (no returns →
  `void`). It now produces a typed value per directive:
  - `@if` → a ternary: `const v = cond() ? <a /> : <b />;` (`@else if` chains
    nest; a missing/empty branch is `null`; a branch with setup becomes a
    returning IIFE).
  - `@switch` → a returning IIFE:
    `(() => { switch (cond()) { case 1: return <a />; … } return null; })()`.
  - `@try` → a returning IIFE:
    `(() => { try { return <a />; } catch (e) { return <b />; } })()`.
  - `@for` → `Array.from(iterable).map((x, i) => { return <li>{x}</li>; })`.
    `@for` accepts any iterable, but `Set`/`Map`/generators have no `.length` or
    `.map`, so lowering them directly typed the binding as an error and never
    surfaced the `@empty` branch; `Array.from(…)` yields a real array (the `to_ts`
    analog of the JS targets' `map_iterable` helper). `; index i` becomes the
    callback's second parameter `(x, i)`; `@empty` is
    `Array.from(…).length === 0 ? <empty> : <map>`. `@for await` iterates an
    `AsyncIterable`, which `Array.from` does not accept, so it instead lowers to
    an awaited async IIFE with a real `for await` loop
    (`await (async () => { const a = []; for await (const x of xs) a.push(…); return a; })()`).

  A branch or case with multiple sibling templates (`@case 1: { <a /> <b /> }`) is
  merged into a single `return <><a /><b /></>` rather than several returns where
  only the first would be reachable. A directive NESTED inside a branch — directly
  (`@case 1: { <a /> @if (c) { <b /> } }` → `return <><a />{c ? <b /> : null}</>`)
  or inside an authored fragment that is the branch's value
  (`@case 1: { <><a /> @for (…) { … }</> }` → `return <><a />{xs.map(…)}</>`) — is
  value content too, so it is lowered to its own value and merged into the
  fragment, not left as a bare `if (c) { … }` / `for (…) { … }` dropped from the
  value. This holds at any nesting depth and for every directive combination. So
  the editor types match the template.

  The change is scoped to the generated value-position wrapper, so a directive in
  render position (a statement, a component's output, a direct JSX child) still
  renders unchanged, and the client/server runtime output is byte-identical (only
  the `to_ts` view changes).

- [#1307](https://github.com/Ripple-TS/ripple/pull/1307)
  [`f55466b`](https://github.com/Ripple-TS/ripple/commit/f55466bde65d0cff00c0c4525af9d68ae794ffd2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Skip the wrapper anchor for
  single control-flow / code-block / component root scopes. When a scope's entire
  renderable output is a single `@if`, `@switch`, `@for`, `@try`, or static child
  component — i.e. a component body, a control-flow branch, or a `@{}` body whose
  only output after setup is one of these — the compiler now renders it directly
  before the parent-provided `__anchor` instead of synthesizing a `<!>` fragment
  wrapper and an extra append + clone. For deep recursive trees this measurably
  cuts mount time and shrinks generated output; in the recursive-context benchmark
  it brought mount DOM operations to one clone + one append per element (from
  ~1.5×) and halved the comment-anchor nodes.

  Hydration is preserved. The control-flow runtimes
  (`if_block`/`switch_block`/`for_block`/`for_block_keyed`/`try_block`) capture
  the SSR boundary marker and hand it to `append()` afterward, so the existing
  context-aware cursor advance still runs — including for a root scope used as a
  child of a composite/slot with following siblings. Single-component roots need
  no runtime change at all, since a component's own content advances the hydration
  cursor.

  Also relaxes the compiler's text-expression detection: `string + anything` (e.g.
  `{a + '|' + b}`) is now recognized as text and lowered to the fast `set_text`
  path without requiring an explicit `as string`, since such an expression always
  evaluates to a string in JS.

- [#1305](https://github.com/Ripple-TS/ripple/pull/1305)
  [`bbc3843`](https://github.com/Ripple-TS/ripple/commit/bbc384387e33c538234be36c07cc4b30ef6ce136)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Server transform: accumulate
  each runtime block's output into a single `__out` string and push it once per
  block (flushing only before a child block) instead of emitting an `output_push`
  per element. Adjacent static + dynamic holes coalesce into one
  `__out += a + b + c`, and accumulation spans loops and control flow, so e.g. a
  whole `@for` feed renders in one push. Output is byte-identical; this only
  changes how the SSR string is assembled.
- Updated dependencies
  [[`ba498cd`](https://github.com/Ripple-TS/ripple/commit/ba498cde76e9f83235ce91da825f403a28441bff),
  [`313b351`](https://github.com/Ripple-TS/ripple/commit/313b3513e4a959dd80b546da41c798066c5ccb0f),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`bbe6e74`](https://github.com/Ripple-TS/ripple/commit/bbe6e7422c690558f0dfcb3abe5452d4f4cdde91),
  [`0e9f523`](https://github.com/Ripple-TS/ripple/commit/0e9f52358a615c2fc7759544e96c43dccb533c86),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`2b65285`](https://github.com/Ripple-TS/ripple/commit/2b65285bfcd4c6a0aa93d7fa0b25082e6ec74e1f),
  [`f55466b`](https://github.com/Ripple-TS/ripple/commit/f55466bde65d0cff00c0c4525af9d68ae794ffd2),
  [`b887deb`](https://github.com/Ripple-TS/ripple/commit/b887debf5f47e63d73184ac218ec8b3542a5e21c),
  [`3668c5f`](https://github.com/Ripple-TS/ripple/commit/3668c5fe9cdaca4862707d653d23af94780f42af)]:
  - @tsrx/core@0.1.33

## 0.1.32

### Patch Changes

- [#1277](https://github.com/Ripple-TS/ripple/pull/1277)
  [`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve significant
  whitespace and keep fragments faithful in TSRX template output.
  - Parser: a sibling after a closing tag (`<b>1</b> 2`, `<> <>x</> y <>z</> </>`)
    now reads as JSX text at the source, so significant inline whitespace is kept
    instead of being eaten by `skipSpace`. This fixes the leading space being
    dropped (`" 2 "` not `"2 "`) and removes several closing-tag
    whitespace/context workarounds.
  - Transform: a single-text fragment used as a JSX child stays a fragment
    (`<>123</>` instead of `{'123'}`), and an empty fragment child stays `<></>`
    instead of `{null}`. Expression/return-position single-text fragments still
    lower to a string (`return <>x</>` -> `return "x"`). Whitespace at a
    fragment/element's content edges is wrapped in a `{' '}` container so it
    survives formatting/JSX collapsing; whitespace between siblings stays bare
    (`<b/> <i/>`). The edge rule is shared (`wrapEdgeWhitespace`) across the
    React/Preact/Solid transforms and the Ripple to_ts view.
  - Ripple target: whitespace-only text that is a significant inline space is kept
    rather than dropped, so edge and inter-element spaces survive in client
    templates and SSR output. The to_ts / Volar type-checking view now matches the
    JSX targets — literal text stays bare (not `{"123"}`), single-text fragments
    stay `<>123</>`, empty fragments stay `<></>` (not `{null}`), `{a}` expression
    containers are preserved for type visibility, and edge whitespace prints as
    single-quote `{' '}`.

- Updated dependencies
  [[`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432),
  [`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432)]:
  - @tsrx/core@0.1.32

## 0.1.31

### Patch Changes

- [#1268](https://github.com/Ripple-TS/ripple/pull/1268)
  [`3d93339`](https://github.com/Ripple-TS/ripple/commit/3d93339e851818b547c43c29c8965700c069b037)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Never render `null` or
  `undefined` as text in interpolated template output.

  When adjacent text and expressions are merged for concatenation, a dynamic value
  was coerced with `String(value)`, so a nullish value printed the literal string
  `"null"`/`"undefined"` (e.g. `<h1>Welcome,{user.name}</h1>` rendered
  `Welcome,null`). The merge now coerces via `String(value ?? '')` so nullish
  values render as empty text. This applies to both the client and server targets.
  An author-written `String(...)` is unaffected and still stringifies nullish
  explicitly.

- [#1266](https://github.com/Ripple-TS/ripple/pull/1266)
  [`5646eb4`](https://github.com/Ripple-TS/ripple/commit/5646eb4e4c101b34100acf30ea57ad4065a47720)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix client crash when a
  `function C() { return <jsx> }` component renders a template control-flow
  directive (`@if`/`@for`/`@switch`/`@try`).

  The block-statement return form is transformed via the generic function path,
  which never sets the `component` render state. A directive-branch element in
  statement position (e.g. `@if (cond) { <p>…</p> }`) then matched the
  out-of-component "bare template statement" rule and was double-wrapped: its
  content compiled into an orphaned template while the template the branch
  actually referenced was left empty, crashing at runtime with
  `Cannot read properties of null (reading 'cloneNode')`. A synthetic children
  render arrow now establishes itself as the component boundary when no enclosing
  component is set, so directive branches inline their content correctly. The
  `@{ … }` form and the server target were already correct.

- [#1269](https://github.com/Ripple-TS/ripple/pull/1269)
  [`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Disallow `return` statements
  inside `@try`/`@catch`/`@pending` blocks.

  `return` is only valid in the JS setup at the top of a `@{ … }` code block —
  never inside a `@`-directive block. `@if`/`@for`/`@switch` already rejected
  returns; `@try`/`@catch`/`@pending` previously allowed `return <markup>`
  (lowering it into a reactive boundary fallback). They now reject any `return`
  (with or without an argument) with the same
  `Return statements are not allowed inside TSRX templates` diagnostic,
  consistently across every target (ripple, react, preact, solid, vue). Render
  markup by writing it as the block's output instead of returning it. Returns
  inside nested ordinary functions are unaffected.

- [#1269](https://github.com/Ripple-TS/ripple/pull/1269)
  [`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Treat plain JS control flow
  inside `@{ … }` as ordinary JavaScript that returns JSX.

  Only `@`-directives (`@if`/`@for`/`@switch`/`@try`) lower to template control
  flow. Plain `if`/`for`/`for…of`/`for…in`/`while`/`do…while`/`switch`/`try`
  inside a code block are now compiled exactly like the same control flow in a
  regular `function C() { …; return <jsx> }` body — their JSX returns become
  `tsrx_element` values rather than being template-ized.

  Previously these plain statements were mis-routed into the template transform:
  on **ripple** an early-return guard produced a `_$_.if`/`_$_.switch`/`_$_.try`
  wrapper (with dead code in the `switch`/`try` cases) and plain loops threw a
  compile error; on **solid** they produced
  `<Show>`/`<Switch>`/`<For>`/`<Errored>` (dropping trailing output for `try`).
  They now stay as plain control flow, so early-return guards and loops behave
  like normal JavaScript.

  As part of this, the ripple client and server targets no longer emit the
  `return_guard` bookkeeping variable: a plain early `return` is a real early
  return, so subsequent template output is naturally skipped without a guard flag.

  On **solid**, this means a plain guard (`if (signal()) return …`) inside a
  component body now runs once at setup — exactly like a regular Solid component —
  instead of being lifted into a reactive `<Show>`. Use `@if` (or another
  `@`-directive) when you want reactive conditional rendering.

- Updated dependencies
  [[`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e),
  [`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e)]:
  - @tsrx/core@0.1.31

## 0.1.30

### Patch Changes

- Updated dependencies
  [[`b104604`](https://github.com/Ripple-TS/ripple/commit/b10460473fec0ee68b4963cbc2a3d9d5bb3bc633)]:
  - @tsrx/core@0.1.30

## 0.1.29

### Patch Changes

- [#1259](https://github.com/Ripple-TS/ripple/pull/1259)
  [`3b6fb73`](https://github.com/Ripple-TS/ripple/commit/3b6fb73170d4ad6a383befdda951ce0da4fcbb46)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Lower a code-only `@{ … }`
  block in value position to a `tsrx_element`. The value-position IIFE wrap was
  gated on the block having render output, so a render-less block assigned to a
  variable or returned (e.g. `const Test = @{ const y = 1; };`) was lowered to a
  bare `BlockStatement` and printed as a malformed object literal
  (`const Test = { const y = 1; };`) in client, server, and `to_ts` output. The
  wrap now applies regardless of render output, so a code-only block gets the same
  lowering as a render-bearing one — a `tsrx_element` whose setup runs on render
  and which renders nothing (an immediately-invoked arrow in the `to_ts` view).

- [#1262](https://github.com/Ripple-TS/ripple/pull/1262)
  [`1c645c8`](https://github.com/Ripple-TS/ripple/commit/1c645c8f854df23bb1271b3402d1885616b525cd)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Prune unreachable selectors
  from `<style>` blocks consistently across targets.

  For a style expression (`const styles = <style> … </style>`), only standalone
  class selectors — scoped (`.x`) or global-wrapped (`:global(.x)`) — end up in
  the generated class map, but the emitted CSS still contained every selector.
  Top-level selectors that don't contribute a class map entry (element selectors,
  compound selectors, descendant chains, global tag selectors) are now commented
  out as unused, while standalone classes, `:global(.x)` selectors, and rules
  nested inside a reachable rule (e.g. `&:hover`) are kept.

  Free-standing `<style>` blocks in the shared JSX targets (react, preact, solid,
  vue) now prune selectors that match no element, the same way the Ripple target
  always has, instead of keeping every authored selector. Selector matching also
  recognizes `className` as the class attribute for React-style targets.

- [#1260](https://github.com/Ripple-TS/ripple/pull/1260)
  [`b1256fd`](https://github.com/Ripple-TS/ripple/commit/b1256fdb5bf279ee7dd20bf1a71dcfccc47e279c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Make style scope hashes
  unique per style block and per file. The hash was derived from the style block's
  content alone, so two `<style>` blocks with identical CSS — in different
  components of the same file, or in different files — collided and shared a
  scope. The hash input now includes the filename and the line/column where the
  `<style>` tag starts. Because the filename may be an absolute path, the hash
  also switched from the reversible djb2 hash to the truncated SHA-256 hash so
  file structure can't be recovered from class names in the shipped bundle.

  The `filename` parameter of `parse`, `parseModule`, and the per-target `parse`
  wrappers is now required (typed as a non-empty string), and parsing a `<style>`
  element without one throws a clear error instead of silently seeding the hash
  with an empty name. The prettier plugin and eslint parser pass their host's file
  path through, falling back to a plugin-specific placeholder when formatting or
  linting in-memory text.

- Updated dependencies
  [[`67de047`](https://github.com/Ripple-TS/ripple/commit/67de047d103f39673b25910e1a97760278820999),
  [`1c645c8`](https://github.com/Ripple-TS/ripple/commit/1c645c8f854df23bb1271b3402d1885616b525cd),
  [`b1256fd`](https://github.com/Ripple-TS/ripple/commit/b1256fdb5bf279ee7dd20bf1a71dcfccc47e279c)]:
  - @tsrx/core@0.1.29

## 0.1.28

### Patch Changes

- [#1254](https://github.com/Ripple-TS/ripple/pull/1254)
  [`4af2591`](https://github.com/Ripple-TS/ripple/commit/4af259139d118a27d177531aa6a21435a3f3a015)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Support `@{ … }` code blocks
  in template children position, each with its own lexical scope. Code-block
  children of elements, fragments, and control-flow branches were silently dropped
  on the client, and the server kept their render output while losing the setup
  statements (referencing undeclared variables at runtime). The lowering pays only
  for what a block uses: a template-only block merges statically into the parent
  template (no `_$_.expression`, no inline component), a code-only block becomes a
  plain `{ … }` statement block, and a block with both setup code and render
  output becomes a scoped inline component (`(() => @{ … })()`, the same lowering
  as value-position blocks). Nested blocks (`@{ @{ … } }`) shadow correctly
  instead of collapsing into one scope, share a single closure and `with_scope`
  wrapper per chain, and empty chains compile to nothing.

- [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep fragment expression
  children inside `{ … }` containers in the TS/Volar virtual code. Fragments with
  multiple children printed bare expressions as JSX children (`<>{a} {a}</>`
  became `<>aa</>`), which TypeScript reads as JSX text — hiding the expressions
  from type checking, hover, and rename in the editor.
- Updated dependencies
  [[`f001849`](https://github.com/Ripple-TS/ripple/commit/f00184940979a77cbf6873a811caaaa436feab46),
  [`4af2591`](https://github.com/Ripple-TS/ripple/commit/4af259139d118a27d177531aa6a21435a3f3a015),
  [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482),
  [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482),
  [`f1a4c10`](https://github.com/Ripple-TS/ripple/commit/f1a4c10d2ad8ed604375f36f7ae3b653fe95ed1a)]:
  - @tsrx/core@0.1.28

## 0.1.27

### Patch Changes

- Updated dependencies
  [[`60a78c9`](https://github.com/Ripple-TS/ripple/commit/60a78c9def09eed6d706c42bc751d2d051d1d57f)]:
  - @tsrx/core@0.1.27

## 0.1.26

### Patch Changes

- [#1240](https://github.com/Ripple-TS/ripple/pull/1240)
  [`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Render `<{expr}>` dynamic
  tags directly through `_$_.composite` in the client production output instead of
  lowering to the `Dynamic` helper component, and fix hydration of dynamic string
  tags claiming the SSR-rendered element.

- [#1240](https://github.com/Ripple-TS/ripple/pull/1240)
  [`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add parser, formatter, and
  compiler support for `<{expr}>` dynamic element tags.

- [#1241](https://github.com/Ripple-TS/ripple/pull/1241)
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Treat dynamic tags
  (`<{expr}>`) like the runtime `Dynamic` helper during scoped CSS analysis on all
  targets: type selectors are no longer pruned (the tag can resolve to any
  element), the element's classes match scoped selectors, and the scope hash is
  applied to its class.

- [#1241](https://github.com/Ripple-TS/ripple/pull/1241)
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Remove the runtime `Dynamic`
  component exports; dynamic rendering is the `<{expr}>` tag syntax. The `Dynamic`
  type declarations remain so type-only output keeps type-checking, but the JS is
  gone: React and Preact production output now lowers dynamic tags to a scoped
  component alias (`const TsrxDynamic_N = expr;`), Ripple SSR uses the internal
  `_$_.dynamic_element` helper, and the imported-`Dynamic` detection for scoped
  CSS is removed (the element marking is now `metadata.dynamicElement`, set by the
  dynamic-tag lowering).
- Updated dependencies
  [[`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9)]:
  - @tsrx/core@0.1.26

## 0.1.25

### Patch Changes

- Updated dependencies
  [[`d14ec84`](https://github.com/Ripple-TS/ripple/commit/d14ec84f26233e514be9e59ffc94e61db5089587),
  [`921fb9c`](https://github.com/Ripple-TS/ripple/commit/921fb9ce6485db41527b631f5236b7abbac74986),
  [`1693c9e`](https://github.com/Ripple-TS/ripple/commit/1693c9e6daf1421e71171fe3c50e37adfc858b69)]:
  - @tsrx/core@0.1.25

## 0.1.24

### Patch Changes

- [#1229](https://github.com/Ripple-TS/ripple/pull/1229)
  [`6fd49c9`](https://github.com/Ripple-TS/ripple/commit/6fd49c9dd737e889844e254763f66e13ea4a7241)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Replace the removed `<@...>`
  dynamic tag syntax with runtime `Dynamic` helpers. Ripple now exports `Dynamic`
  and reuses its composite runtime path for dynamic elements/components, while
  React, Preact, Solid, and Vue expose target-specific `Dynamic` helpers with
  typed `is` props.

  React, Preact, Solid, and Vue now mark imported runtime `Dynamic` elements
  during shared JSX analysis so scoped CSS classes are applied through aliases
  without treating local components named `Dynamic` as runtime elements.

  Dynamic component prop forwarding now uses a shared core runtime helper that
  excludes the internal `is` prop without snapshotting getter-backed reactive
  props.

  The TSRX parser, transforms, analyzers, prettier support, and related tests no
  longer recognize dynamic tag syntax. Stale JSX identifier `tracked` plumbing
  from that parser path has also been removed.

- Updated dependencies
  [[`6fd49c9`](https://github.com/Ripple-TS/ripple/commit/6fd49c9dd737e889844e254763f66e13ea4a7241)]:
  - @tsrx/core@0.1.24

## 0.1.23

### Patch Changes

- [`88a254c`](https://github.com/Ripple-TS/ripple/commit/88a254c69953a5ace33bc10047f11052ec598672)
  Thanks [@leonidaz](https://github.com/leonidaz)! - For Ripple, emit
  `@for @empty` fallback bodies in client `to_ts` output. Mapping of the node for
  all targets.

- [`4c5f992`](https://github.com/Ripple-TS/ripple/commit/4c5f992b9a11e1f26abee476a6add89f959169bc)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix client compile crash for
  `<script src={...} />` (and other attribute-only scripts) inside `<head>`. Such
  scripts now render as real elements instead of being treated as inline-text
  scripts, which previously threw when they had no child content.

- [`186b3b2`](https://github.com/Ripple-TS/ripple/commit/186b3b2557761ff06c9056bf2e0b7ab8c7692477)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Lower a `@{ … }` code block
  that produces render output when it sits in a plain expression position —
  assigned to a variable (`const view = @{ … }`, `view = @{ … }`) or returned
  (`return @{ … }`). Ripple only lowered a code block when it was a function body,
  so as a bare value it reached the printer as a raw `JSXCodeBlock` and crashed
  with "Not implemented: JSXCodeBlock" (and produced malformed
  `const view = { … }` virtual TS in editor/`to_ts` output). The block is now
  wrapped in an immediately-invoked arrow (`(() => @{ … })()`) before analysis,
  reusing the existing arrow-body render path; the synthesized arrow gets its own
  scope so the block's setup statements resolve correctly. This applies to client,
  server, and `to_ts` output, so type-checking, hover, and navigation work for
  these positions.

- Updated dependencies
  [[`9eb4819`](https://github.com/Ripple-TS/ripple/commit/9eb4819cede6da7e93cbcd2bdf284bcb42d40464),
  [`88a254c`](https://github.com/Ripple-TS/ripple/commit/88a254c69953a5ace33bc10047f11052ec598672),
  [`ba3a7f6`](https://github.com/Ripple-TS/ripple/commit/ba3a7f6485ea163e60cc0750a8e8b06b50728009),
  [`ac6f358`](https://github.com/Ripple-TS/ripple/commit/ac6f3582ca0b2814004439c882d6aa735c8afe50),
  [`78ffa8d`](https://github.com/Ripple-TS/ripple/commit/78ffa8d90fd01e85bf34e5c6adef0e51caae8da7),
  [`16560cb`](https://github.com/Ripple-TS/ripple/commit/16560cb466430bdbe8749d9491bc79e69e58d02c),
  [`4be6e54`](https://github.com/Ripple-TS/ripple/commit/4be6e54bbfee20927adca473648a94aa173d7d77),
  [`2b67f83`](https://github.com/Ripple-TS/ripple/commit/2b67f83d7ed7eab7a39bc33524fcf73f737d977e),
  [`9918c52`](https://github.com/Ripple-TS/ripple/commit/9918c52e954f2b8e1a994892e7c555e8277f2d59),
  [`e8493be`](https://github.com/Ripple-TS/ripple/commit/e8493be0b3489f402105297251e1919c103c2360),
  [`c424675`](https://github.com/Ripple-TS/ripple/commit/c424675102a9edd4f1e356fb6db30124a9c2d885)]:
  - @tsrx/core@0.1.23

## 0.1.22

### Patch Changes

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Preserve expression braces for
  literal JSX attributes in Volar TypeScript output.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Map preserved TypeScript pragma
  comments to their original source ranges in Volar TypeScript output.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Preserve scoped CSS classes for
  dynamic TSRX elements when selectors use tag names.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Support fenced script-only TSRX
  control-flow directive bodies.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Wrap fenced TSRX setup
  statements in an IIFE for `to_ts` virtual TypeScript output.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `@empty { ... }` fallbacks
  for TSRX `@for` loops, require prefixed template continuation clauses such as
  `@else`, `@empty`, `@pending`, `@catch`, `@case`, and `@default`, and reject
  direct `continue`, `break`, and `return` statements inside `@for` loop bodies
  and `@if` template branches.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Keep lazy tracked value
  conditions as unwrapped values in Volar TypeScript output.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the stale
  `ScriptContent` AST node typing and dead transform handlers.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Return JSX from root
  control-flow branches, preserve direct JSX expression children, and emit pending
  fallbacks as valid Volar TypeScript output.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Restore CSS embedded mappings
  for Ripple style blocks while keeping stylesheet AST children out of Volar
  TypeScript output.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Prevent TSRX parser hangs when
  JSX switch cases contain elements followed by break statements, and preserve
  dynamic element lowering through Ripple normalization.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Prevent Volar TypeScript output
  from collecting statements out of nested ordinary function bodies.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Keep TSRX template replay
  locations aligned so generated TypeScript source maps stay within the source
  document.

- Updated dependencies
  [[`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)]:
  - @tsrx/core@0.1.22

## 0.1.21

### Patch Changes

- [#1191](https://github.com/Ripple-TS/ripple/pull/1191)
  [`e738e11`](https://github.com/Ripple-TS/ripple/commit/e738e1153694f56f35cfcab8982d897d7199d85a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Avoid stringifying adjacent
  TSRX expression children when either expression contains a function call, and
  preserve parentheses around TypeScript assertions before non-null assertions
  when formatting.

- [#1198](https://github.com/Ripple-TS/ripple/pull/1198)
  [`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the unused namespaced
  TSX island feature and React bridge package.

- Updated dependencies
  [[`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21),
  [`e00f596`](https://github.com/Ripple-TS/ripple/commit/e00f5961d5668c054435c8a366ef2a6da6e4a381)]:
  - @tsrx/core@0.1.21

## 0.1.20

### Patch Changes

- [#1185](https://github.com/Ripple-TS/ripple/pull/1185)
  [`0ea87fb`](https://github.com/Ripple-TS/ripple/commit/0ea87fb3cbef21c3c00d63cc2a1f3c9f34d01c24)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the reserved `<tsx>`
  expression wrapper and use TSRX fragments as the native expression form.

  Plain `<tsx>` is now treated as an ordinary element. Tooling now uses the
  `TsrxFragment` AST node for native fragments and updates formatting, linting,
  symbols, transforms, and generated docs around the simplified syntax.

- Updated dependencies
  [[`0ea87fb`](https://github.com/Ripple-TS/ripple/commit/0ea87fb3cbef21c3c00d63cc2a1f3c9f34d01c24)]:
  - @tsrx/core@0.1.20

## 0.1.19

### Patch Changes

- [#1181](https://github.com/Ripple-TS/ripple/pull/1181)
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Map style expression
  assignments (`const styles = <style>…</style>`) to their source range in Volar
  type-only output so hovering the `<style>` tags shows intellisense.

- [#1181](https://github.com/Ripple-TS/ripple/pull/1181)
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve template style
  blocks as embedded CSS regions in Volar type-only output.

- Updated dependencies
  [[`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc),
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)]:
  - @tsrx/core@0.1.19

## 0.1.18

### Patch Changes

- Updated dependencies
  [[`5c0b0ff`](https://github.com/Ripple-TS/ripple/commit/5c0b0ff031ddfb319bb048d627e2d2a2a49c1f1d)]:
  - @tsrx/core@0.1.18

## 0.1.17

### Patch Changes

- [#1177](https://github.com/Ripple-TS/ripple/pull/1177)
  [`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)
  Thanks [@trueadm](https://github.com/trueadm)! - Parse tags and bare fragments
  as native TSRX by default, remove `component` keyword parsing, and
  compile/format/lint function components that return native TSRX across the
  React, Preact, Solid, Vue, and Ripple targets. Ripple component compilation now
  only renders TSRX reachable from returned values and supports string and `null`
  component returns.

  Ripple now also preserves directly called PascalCase helpers as ordinary
  functions while still compiling renderable component functions used as
  components or render entries.

  The old explicit TSRX wrapper tag is no longer special; TSRX elements and
  fragments are the default expression syntax, and the tag name is treated like
  any ordinary element name.

  Ripple now exports a typed `Fragment` helper from its public runtimes and
  supports `innerHTML` on both host elements and `Fragment`. Ripple also treats
  `innerHTML` from element spreads as rendered content instead of serializing it
  as an `innerhtml` attribute.

  The `{html ...}` template directive has been removed. Use each target's native
  raw HTML prop instead, such as `innerHTML` for Ripple/Solid/Vue or
  `dangerouslySetInnerHTML` for React/Preact.

  The `{text ...}` template directive has also been removed. Text values now use
  ordinary `{expr}` containers, with explicit coercion written as JavaScript
  (`String(value)`, `value + ''`, or a typed string value). Ripple optimizes
  clearly string-shaped expressions and typed string props into text-node updates
  without requiring a TSRX-specific directive.

- [#1177](https://github.com/Ripple-TS/ripple/pull/1177)
  [`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)
  Thanks [@trueadm](https://github.com/trueadm)! - Compile native TSRX functions
  as value-producing functions and route component syntax through runtime
  component helpers.

- Updated dependencies
  [[`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)]:
  - @tsrx/core@0.1.17

## 0.1.16

### Patch Changes

- [#1175](https://github.com/Ripple-TS/ripple/pull/1175)
  [`d045396`](https://github.com/Ripple-TS/ripple/commit/d0453962cfe1df7a98a0981b0bf3e5729195a9ae)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Align prop getter generation
  for JSX-style TSRX expression fragments with native TSRX component templates.
  Reject native dynamic marker syntax on TSX attribute names and inside TSX
  fragments.
- Updated dependencies
  [[`d045396`](https://github.com/Ripple-TS/ripple/commit/d0453962cfe1df7a98a0981b0bf3e5729195a9ae)]:
  - @tsrx/core@0.1.16

## 0.1.15

### Patch Changes

- [#1172](https://github.com/Ripple-TS/ripple/pull/1172)
  [`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add verification-only Volar
  mappings for whole arrow functions.

- Updated dependencies
  [[`ea717f2`](https://github.com/Ripple-TS/ripple/commit/ea717f2ac20901aca59946c1cea8066c28a4220c),
  [`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/core@0.1.15

## 0.1.14

### Patch Changes

- [#1166](https://github.com/Ripple-TS/ripple/pull/1166)
  [`1dc0331`](https://github.com/Ripple-TS/ripple/commit/1dc0331f7b7296545ee459dc31a92057871cbb0d)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Replace all [0] and [1]
  compiled output with `.value` and direct `lazy` Throw runtime errors for direct
  `[0]` and `[1]` access on tracked and derived values. Fix type removal for
  non-tsx paths Remove the public `get` and `set` exports in favor of `.value`
  access. Ignore lazy writes past the tracked tuple length instead of creating
  numeric properties.

- [#1169](https://github.com/Ripple-TS/ripple/pull/1169)
  [`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Type host `ref={...}`
  attributes, named ref props, and generated ref keys so inline callbacks
  `{ref ...}` receive element-specific JSX types.

  Exclude `returnType` from the compiler types that use typeAnnotation instead due
  to the way `@sveltejs/acorn-typescript` parses them.

- Updated dependencies
  [[`1dc0331`](https://github.com/Ripple-TS/ripple/commit/1dc0331f7b7296545ee459dc31a92057871cbb0d),
  [`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/core@0.1.14

## 0.1.13

### Patch Changes

- Updated dependencies
  [[`95c2976`](https://github.com/Ripple-TS/ripple/commit/95c2976b9ec2c20c4160ad13b636c1ed03e863ef)]:
  - @tsrx/core@0.1.13

## 0.1.12

### Patch Changes

- [#1153](https://github.com/Ripple-TS/ripple/pull/1153)
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse nested `<tsrx>` islands
  inside `<tsx>` expression containers as native TSRX so setup declarations and
  references keep Volar mappings, and hydrate deeply nested `<tsx>`/`<tsrx>`
  expression values without skipping server markers.

- [#1153](https://github.com/Ripple-TS/ripple/pull/1153)
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Render calls to helper
  functions with nested `<tsx>` or `<tsrx>` returns as template expressions during
  SSR.

- [#1153](https://github.com/Ripple-TS/ripple/pull/1153)
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix to_ts output for nested
  `<tsrx>` islands inside `<tsx>` blocks.

  Type JSX expression values as `TSRXElement` so IntelliSense reports assigned
  TSX/TSRX fragments as renderable values instead of `void`.

  Fix TextMate highlighting for nested `<tsrx>` and `<tsx>` tags inside JSX
  expression containers.

- [#1153](https://github.com/Ripple-TS/ripple/pull/1153)
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Render nested `<tsx>` and
  `<tsrx>` expression values, including arrays returned from JSX-style
  expressions.

- Updated dependencies
  [[`2acbbea`](https://github.com/Ripple-TS/ripple/commit/2acbbea9253ac8f516fe0d3a7a38331490e6fd8b),
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)]:
  - @tsrx/core@0.1.12

## 0.1.11

### Patch Changes

- Updated dependencies
  [[`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a)]:
  - @tsrx/core@0.1.11

## 0.1.10

### Patch Changes

- Updated dependencies
  [[`8c064c8`](https://github.com/Ripple-TS/ripple/commit/8c064c888b60e4fcf88f6828e51792b3bba5797a)]:
  - @tsrx/core@0.1.10

## 0.1.9

### Patch Changes

- Updated dependencies
  [[`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)]:
  - @tsrx/core@0.1.9

## 0.1.8

### Patch Changes

- [`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Use esrap 2.2.8 instead of
  carrying a local 2.2.7 patch.

- Updated dependencies
  [[`b54fdfc`](https://github.com/Ripple-TS/ripple/commit/b54fdfc3ebfea29ac613307b76732c5bf5f49ab5),
  [`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/core@0.1.8

## 0.1.7

### Patch Changes

- Updated dependencies
  [[`2b1f746`](https://github.com/Ripple-TS/ripple/commit/2b1f7469ab31713140a5baf912a19fa8eedb9234),
  [`e4a04dd`](https://github.com/Ripple-TS/ripple/commit/e4a04ddb4bbc8e21a9c7c2c65b179d764b72e4fb)]:
  - @tsrx/core@0.1.7

## 0.1.6

### Patch Changes

- Updated dependencies
  [[`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)]:
  - @tsrx/core@0.1.6

## 0.1.5

### Patch Changes

- Updated dependencies
  [[`de27e18`](https://github.com/Ripple-TS/ripple/commit/de27e182d002ea736aee992acca4cbf9873a307d),
  [`59e1e32`](https://github.com/Ripple-TS/ripple/commit/59e1e328607598fe342abbba35f76e5fadb9ca5c),
  [`1256569`](https://github.com/Ripple-TS/ripple/commit/12565695efaa3a4ad429245807721ea671c2ecb5),
  [`1256569`](https://github.com/Ripple-TS/ripple/commit/12565695efaa3a4ad429245807721ea671c2ecb5),
  [`18b4aef`](https://github.com/Ripple-TS/ripple/commit/18b4aefa8127e56a9f1b3058da2d4d2172551579)]:
  - @tsrx/core@0.1.5

## 0.1.4

### Patch Changes

- Updated dependencies
  [[`3e84758`](https://github.com/Ripple-TS/ripple/commit/3e847588027d6254c3999a87c717e9d58fb55a26),
  [`3e84758`](https://github.com/Ripple-TS/ripple/commit/3e847588027d6254c3999a87c717e9d58fb55a26),
  [`509170b`](https://github.com/Ripple-TS/ripple/commit/509170ba3cecc611ba1798575c70555070665736)]:
  - @tsrx/core@0.1.4

## 0.1.3

### Patch Changes

- [#1102](https://github.com/Ripple-TS/ripple/pull/1102)
  [`c042672`](https://github.com/Ripple-TS/ripple/commit/c04267255d35945753ca8090006622c96fa0a14f)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow empty `pending {}` blocks
  in component try statements to render a null fallback.

- Updated dependencies
  [[`5a59d73`](https://github.com/Ripple-TS/ripple/commit/5a59d73daf60b2652c86ffad2a4eaf3d801e40d7),
  [`4f360f0`](https://github.com/Ripple-TS/ripple/commit/4f360f008edf61492cf85afa646c797c80a73f22),
  [`c042672`](https://github.com/Ripple-TS/ripple/commit/c04267255d35945753ca8090006622c96fa0a14f),
  [`a9d640f`](https://github.com/Ripple-TS/ripple/commit/a9d640f0728996b3f21b452ffe6040e54d82609c),
  [`5a59d73`](https://github.com/Ripple-TS/ripple/commit/5a59d73daf60b2652c86ffad2a4eaf3d801e40d7),
  [`2ae792c`](https://github.com/Ripple-TS/ripple/commit/2ae792cdca7d466e552a330ea965cefec2b1f5a5),
  [`96360f3`](https://github.com/Ripple-TS/ripple/commit/96360f36306180e67ce69e464dd545773e57e8b1)]:
  - @tsrx/core@0.1.3

## 0.1.2

### Patch Changes

- Updated dependencies
  [[`2010290`](https://github.com/Ripple-TS/ripple/commit/20102904d68951b47dce3958f88ddd1fc150e7a1)]:
  - @tsrx/core@0.1.2

## 0.1.1

### Patch Changes

- Updated dependencies
  [[`0fdf340`](https://github.com/Ripple-TS/ripple/commit/0fdf3408417a7565a00304b766e958b438b3c834)]:
  - @tsrx/core@0.1.1

## 0.1.0

### Minor Changes

- [#1088](https://github.com/Ripple-TS/ripple/pull/1088)
  [`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `<tsrx>...</tsrx>`
  expression fragments for inline native TSRX template values.

### Patch Changes

- Updated dependencies
  [[`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)]:
  - @tsrx/core@0.1.0

## 0.0.30

### Patch Changes

- [#1071](https://github.com/Ripple-TS/ripple/pull/1071)
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add named ref props with
  `prop_name={ref expr}` syntax and expose `isRefProp()` for runtime detection of
  named ref prop values.
- Updated dependencies
  [[`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)]:
  - @tsrx/core@0.0.28

## 0.0.29

### Patch Changes

- [#1064](https://github.com/Ripple-TS/ripple/pull/1064)
  [`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Reject component declarations
  with more than one parameter. Previously, JSX targets passed extra parameters
  straight through into the generated function and ripple silently dropped them.
  Multi-parameter components now error in regular compile and are surfaced as
  collected diagnostics in the Volar editor pipeline.

- [#1057](https://github.com/Ripple-TS/ripple/pull/1057)
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Enforces a stricter rule for
  components declared inside classes: they must be arrow-function class properties
  (including static), and class component foo() {} method-style declarations are
  no longer supported.

  Removes component method declarations support in favor of using as properties.

- [#1063](https://github.com/Ripple-TS/ripple/pull/1063)
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Standardizes compile api
  across all packages, including forcing types to adhere to the standard. Adds
  more debug compile options to the playgrounds.
- Updated dependencies
  [[`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6),
  [`29ac6d7`](https://github.com/Ripple-TS/ripple/commit/29ac6d757b376e4102c4c8c8d3d47f7ae3afdd00),
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b),
  [`cf60dba`](https://github.com/Ripple-TS/ripple/commit/cf60dbaf9c6be84d6e95f9c5d66b64d8927494c9),
  [`4cd0986`](https://github.com/Ripple-TS/ripple/commit/4cd0986201e960cd8544d0f789d17a217e93f954),
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)]:
  - @tsrx/core@0.0.27

## 0.0.28

### Patch Changes

- Updated dependencies
  [[`8125c73`](https://github.com/Ripple-TS/ripple/commit/8125c73b37e7b201dbb0a078e3583c022ceb7687)]:
  - @tsrx/core@0.0.26

## 0.0.27

### Patch Changes

- [#1047](https://github.com/Ripple-TS/ripple/pull/1047)
  [`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Support arrow syntax for
  anonymous component expressions and preserve anonymous component
  function-vs-arrow source form across TSRX and Ripple targets.

- [#1050](https://github.com/Ripple-TS/ripple/pull/1050)
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)
  Thanks [@trueadm](https://github.com/trueadm)! - Parse direct double-quoted text
  in bare if/else branches and backtick-delimited fragment text as renderable
  template text.

- Updated dependencies
  [[`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)]:
  - @tsrx/core@0.0.25

## 0.0.26

### Patch Changes

- [#1042](https://github.com/Ripple-TS/ripple/pull/1042)
  [`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)
  Thanks [@trueadm](https://github.com/trueadm)! - Align component loop
  control-flow validation across TSRX targets and allow `continue` to skip
  `for...of` iterations.

- Updated dependencies
  [[`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f),
  [`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)]:
  - @tsrx/core@0.0.24

## 0.0.25

### Patch Changes

- [#1035](https://github.com/Ripple-TS/ripple/pull/1035)
  [`5c6ee71`](https://github.com/Ripple-TS/ripple/commit/5c6ee71bfd4f5dc443c43eb34e631bb032606faf)
  Thanks [@trueadm](https://github.com/trueadm)! - Replace the removed
  `#style.class` syntax with the `{style "class"}` attribute value directive.

- [#1036](https://github.com/Ripple-TS/ripple/pull/1036)
  [`83b19fd`](https://github.com/Ripple-TS/ripple/commit/83b19fd67aa27eb10e93205dd88c61b13ffbc523)
  Thanks [@trueadm](https://github.com/trueadm)! - Replace Ripple `#server` blocks
  with proposal-aligned `module server` declarations and imports from `server`.
  Preserve Volar mappings for submodule import identifiers after Ripple lowers
  server imports.
- Updated dependencies
  [[`3b2eae2`](https://github.com/Ripple-TS/ripple/commit/3b2eae24dc955325a0379c4773631796865e0f38),
  [`5c6ee71`](https://github.com/Ripple-TS/ripple/commit/5c6ee71bfd4f5dc443c43eb34e631bb032606faf),
  [`83b19fd`](https://github.com/Ripple-TS/ripple/commit/83b19fd67aa27eb10e93205dd88c61b13ffbc523)]:
  - @tsrx/core@0.0.23

## 0.0.24

### Patch Changes

- [#1031](https://github.com/Ripple-TS/ripple/pull/1031)
  [`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve generic type
  arguments on JSX component tags (e.g. `<RenderProp<User>>`). They were being
  silently dropped during prettier formatting, during the tsrx → JSX compile
  output for React/Preact/Solid/Vue, and in Ripple's `to_ts` virtual-code output
  used by the language server for typechecking.

- Updated dependencies
  [[`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)]:
  - @tsrx/core@0.0.22

## 0.0.23

### Patch Changes

- Updated dependencies
  [[`76fd362`](https://github.com/Ripple-TS/ripple/commit/76fd3622f3e6432787fadb1a96337541424b25aa)]:
  - @tsrx/core@0.0.21

## 0.0.22

### Patch Changes

- [#1014](https://github.com/Ripple-TS/ripple/pull/1014)
  [`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)
  Thanks [@trueadm](https://github.com/trueadm)! - Add a `collect` compile option
  for collecting diagnostics and comments without enabling loose markup recovery.

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d),
  [`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/core@0.0.20

## 0.0.21

### Patch Changes

- Updated dependencies
  [[`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108)]:
  - @tsrx/core@0.0.19

## 0.0.20

### Patch Changes

- [#1007](https://github.com/Ripple-TS/ripple/pull/1007)
  [`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7)
  Thanks [@trueadm](https://github.com/trueadm)! - Keep double-quoted JavaScript
  strings inside TSRX expression containers using normal JavaScript string
  semantics while preserving direct double-quoted text child parsing.

- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7),
  [`bce43be`](https://github.com/Ripple-TS/ripple/commit/bce43be304812ca04dd8d196e2439f28ea392237)]:
  - @tsrx/core@0.0.18

## 0.0.19

### Patch Changes

- [#1002](https://github.com/Ripple-TS/ripple/pull/1002)
  [`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)
  Thanks [@trueadm](https://github.com/trueadm)! - Align direct double-quoted TSRX
  text children with quoted JSX attribute text by decoding character references
  and treating backslashes as literal text. Preserve the direct quoted form in the
  Prettier plugin and highlight it as JSX text in the TextMate grammar.

- Updated dependencies
  [[`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)]:
  - @tsrx/core@0.0.17

## 0.0.18

### Patch Changes

- Updated dependencies
  [[`f660969`](https://github.com/Ripple-TS/ripple/commit/f66096972bc8d2f03061e6018d03e40207761aaa)]:
  - @tsrx/core@0.0.16

## 0.0.17

### Patch Changes

- Updated dependencies
  [[`0ad85f1`](https://github.com/Ripple-TS/ripple/commit/0ad85f1107ce9bddb72cee44b908a34c5264c0b5),
  [`7684132`](https://github.com/Ripple-TS/ripple/commit/7684132ed71db6c550ecbe1c623975ddbed96be5)]:
  - @tsrx/core@0.0.15

## 0.0.16

### Patch Changes

- [#984](https://github.com/Ripple-TS/ripple/pull/984)
  [`fee8620`](https://github.com/Ripple-TS/ripple/commit/fee8620fa4e82a7c7e4adb3e434e9db552a3e157)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve component type
  parameters when lowering generic TSRX components to generated functions.

- [#976](https://github.com/Ripple-TS/ripple/pull/976)
  [`2fcacb4`](https://github.com/Ripple-TS/ripple/commit/2fcacb471d7780074f92b20c9b394f7650a941bb)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve optional markers on
  tuple members and TypeScript function parameters in generated TSX output.

- Updated dependencies
  [[`cf4f06e`](https://github.com/Ripple-TS/ripple/commit/cf4f06e8bcbb41f863d047dfaa6d9d17ed212163),
  [`fcd25aa`](https://github.com/Ripple-TS/ripple/commit/fcd25aa549db0d56ccbd596b657b856a5061e20f),
  [`30126c7`](https://github.com/Ripple-TS/ripple/commit/30126c753c3a08809bacd07c8cf2eca84e8f8cbb),
  [`b8cd7c4`](https://github.com/Ripple-TS/ripple/commit/b8cd7c4195505976995033a8e369502996f345ad),
  [`b8cd7c4`](https://github.com/Ripple-TS/ripple/commit/b8cd7c4195505976995033a8e369502996f345ad),
  [`3ddb1a9`](https://github.com/Ripple-TS/ripple/commit/3ddb1a92ffeb48a7d47c445b929b982a2b96e123),
  [`fee8620`](https://github.com/Ripple-TS/ripple/commit/fee8620fa4e82a7c7e4adb3e434e9db552a3e157),
  [`2fcacb4`](https://github.com/Ripple-TS/ripple/commit/2fcacb471d7780074f92b20c9b394f7650a941bb)]:
  - @tsrx/core@0.0.14

## 0.0.15

### Patch Changes

- Updated dependencies
  [[`a9f706d`](https://github.com/Ripple-TS/ripple/commit/a9f706d6626dc1a9e8505d9ea8f16989b2b024b3),
  [`3e07109`](https://github.com/Ripple-TS/ripple/commit/3e071098508449158fa11f2ae48c912d4d673b68),
  [`112cfd9`](https://github.com/Ripple-TS/ripple/commit/112cfd9fbfd4412efea543abc55deceb186cf351)]:
  - @tsrx/core@0.0.13

## 0.0.14

### Patch Changes

- Updated dependencies
  [[`ea56fa0`](https://github.com/Ripple-TS/ripple/commit/ea56fa021798afe8621699d11b7e1d9e675cbfb4)]:
  - @tsrx/core@0.0.12

## 0.0.13

### Patch Changes

- Updated dependencies
  [[`7529e1f`](https://github.com/Ripple-TS/ripple/commit/7529e1fe3f0870319bd3399501fd2eb43c516065)]:
  - @tsrx/core@0.0.11

## 0.0.12

### Patch Changes

- [`7f59ed8`](https://github.com/Ripple-TS/ripple/commit/7f59ed80d7b44c847fb9eb8bf00d4fe9835c3136)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Replace `node:crypto` usage
  in the compiler with a pure-JS implementation so Ripple can be compiled inside
  browser workers (e.g. the Monaco-based playground) where `crypto.createHash` is
  not available.

  The hashing utility is split into two functions:
  - `simple_hash` — fast non-cryptographic djb2 (base36). Used for CSS class-name
    prefixes and runtime `{html}` hydration markers where the input is user
    content and the output multiplies across the shipped bundle.
  - `strong_hash` — preimage-resistant SHA-256 prefix (pure-JS via
    `@noble/hashes`). Used everywhere a hash is derived from a server-only
    filesystem path (`#server` RPC ids, `track`/`trackAsync` ids, head-element
    hydration markers) so the hash can't be inverted to reveal the original path.

  The runtime `ripple` package no longer ships its own `hashing.js` — it
  re-exports `simple_hash`/`strong_hash` from `@tsrx/core`, and the compiler emits
  `_$_.simple_hash` (previously `_$_.hash`) for dynamic `{html}` hydration
  markers.

- Updated dependencies
  [[`7f59ed8`](https://github.com/Ripple-TS/ripple/commit/7f59ed80d7b44c847fb9eb8bf00d4fe9835c3136)]:
  - @tsrx/core@0.0.10

## 0.0.11

### Patch Changes

- [#931](https://github.com/Ripple-TS/ripple/pull/931)
  [`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix scoped CSS application
  for elements rendered inside `<tsx>...</tsx>` and bare `<>...</>` fragment
  shorthand so they receive the same hash-based classes as regular template
  elements.
- Updated dependencies
  [[`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a),
  [`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)]:
  - @tsrx/core@0.0.9

## 0.0.10

### Patch Changes

- [#919](https://github.com/Ripple-TS/ripple/pull/919)
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow bare `<>...</>` fragments
  everywhere TSRX accepts `<tsx>...</tsx>`, including template bodies and
  expression position. The shorthand now compiles across Ripple, React, Preact,
  and Solid targets, while the explicit `<tsx>...</tsx>` form remains supported.

- [#919](https://github.com/Ripple-TS/ripple/pull/919)
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)
  Thanks [@trueadm](https://github.com/trueadm)! - Disallow JSX fragment syntax in
  template bodies unless it appears inside `<tsx>...</tsx>`. Ripple, Preact,
  React, and Solid compilers now report a compile error instead of accepting or
  crashing on `<>...</>` in regular templates.

- Updated dependencies
  [[`4292598`](https://github.com/Ripple-TS/ripple/commit/42925982e88f48f0af6cc74deeaa3c17bc6657cf),
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)]:
  - @tsrx/core@0.0.8

## 0.0.9

### Patch Changes

- Updated dependencies
  [[`fab49f7`](https://github.com/Ripple-TS/ripple/commit/fab49f7da8ec13c981f1c7b3102703d0c349fc1e)]:
  - @tsrx/core@0.0.7

## 0.0.8

### Patch Changes

- [#886](https://github.com/Ripple-TS/ripple/pull/886)
  [`316cba1`](https://github.com/Ripple-TS/ripple/commit/316cba18614e5ef59dce15e0de6e720eb922955f)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add SSR-to-client
  serialization/hydration for trackAsync by emitting per-call JSON <script>
  envelopes (resolved payload + direct dependency hashes, or sanitized error
  message) and consuming/removing them during client hydration to avoid re-running
  the user async function. Add proper error handling routing to catch blocks with
  actual error messages in DEV and safe production error messages, all with
  correct hydration support

## 0.0.7

### Patch Changes

- Updated dependencies
  [[`e9da9cb`](https://github.com/Ripple-TS/ripple/commit/e9da9cbdd42c28f129ee643366c06f8779b8f931)]:
  - @tsrx/core@0.0.6

## 0.0.6

### Patch Changes

- [#894](https://github.com/Ripple-TS/ripple/pull/894)
  [`73ceaac`](https://github.com/Ripple-TS/ripple/commit/73ceaacd029fb634a62252abdda59ab5f2bec15d)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix a hydration edge case where
  sibling traversal after nested DOM children (such as <pre><code>{html
  ...}</code></pre> chains) could leave the hydrate pointer on the wrong node and
  throw a hydration error during client hydration. Added hydration regression
  coverage for the website-like code-block sibling pattern.

- Updated dependencies
  [[`d027c6c`](https://github.com/Ripple-TS/ripple/commit/d027c6c84fd3ba7c577c52b9fdade77e7ff886e0)]:
  - @tsrx/core@0.0.5

## 0.0.5

### Patch Changes

- Updated dependencies
  [[`7f98c10`](https://github.com/Ripple-TS/ripple/commit/7f98c1039f52a56135672b0f9b476af280c81f03)]:
  - @tsrx/core@0.0.4

## 0.0.4

### Patch Changes

- Updated dependencies
  [[`030ff45`](https://github.com/Ripple-TS/ripple/commit/030ff45bc3020cd1b6e1a914fc58af7c8a0e5af1)]:
  - @tsrx/core@0.0.3

## 0.0.3

### Patch Changes

- [`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix children prop precedence
  when invoking components so that template children always win over an explicit
  `children=` attribute, while still respecting JSX-like ordering between explicit
  props and spreads when no template children are present.

## 0.0.2

### Patch Changes

- [#866](https://github.com/Ripple-TS/ripple/pull/866)
  [`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)
  Thanks [@trueadm](https://github.com/trueadm)! - Extract compiler into
  `@tsrx/core` and `@tsrx/ripple` packages
  - `@tsrx/core`: Core compiler infrastructure — parser factory, scope management,
    utilities, constants, and type definitions
  - `@tsrx/ripple`: Ripple-specific compiler — RipplePlugin, analyze,
    client/server transforms
  - Remove compiler source code from `ripple` package (consumers should use
    `@tsrx/ripple`)
  - Migrate eslint-plugin type imports to `@tsrx/core/types/*`
  - Remove unused compiler dependencies from `ripple` package

- Updated dependencies
  [[`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)]:
  - @tsrx/core@0.0.2

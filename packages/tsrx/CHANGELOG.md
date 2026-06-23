# @tsrx/core

## 0.1.33

### Patch Changes

- [#1283](https://github.com/Ripple-TS/ripple/pull/1283)
  [`ba498cd`](https://github.com/Ripple-TS/ripple/commit/ba498cde76e9f83235ce91da825f403a28441bff)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Print empty fragements as is
  inside expressions {<></>} instead of {null}

- [#1290](https://github.com/Ripple-TS/ripple/pull/1290)
  [`313b351`](https://github.com/Ripple-TS/ripple/commit/313b3513e4a959dd80b546da41c798066c5ccb0f)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix a parser crash when a
  template literal is the first thing in a `@{ … }` code block: `let c = @{`123`}`
  (and `@{ `${x}` }`) threw "Unterminated template" while `@{ '123' }` parsed
  fine. The code block's opening brace reads the next token ahead, and a template
  literal's backtick pushes its own tokenizer context; the setup-statement parser
  then shadowed (or stranded, after a prior statement) that context, so the
  template body tokenized as ordinary code and never closed. The backtick is now
  detected so the template-literal context stays on top and the body parses
  correctly.

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

- [#1288](https://github.com/Ripple-TS/ripple/pull/1288)
  [`bbe6e74`](https://github.com/Ripple-TS/ripple/commit/bbe6e7422c690558f0dfcb3abe5452d4f4cdde91)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep an empty expression
  container fragment in expression position: `let c = <>{}</>` (and
  `<>{/* comment */}</>`) now stays `<></>` instead of collapsing to a bare empty
  expression (`let c = ;`), which was a syntax error. Applies to the React,
  Preact, Solid, and Vue to_ts targets (Ripple already produced `<></>`).

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

- [#1298](https://github.com/Ripple-TS/ripple/pull/1298)
  [`2b65285`](https://github.com/Ripple-TS/ripple/commit/2b65285bfcd4c6a0aa93d7fa0b25082e6ec74e1f)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Apply lazy `&{ … }` /
  `&[ … ]` destructuring inside nested `@{ … }` code blocks and `@if` / `@for` /
  `@switch` / `@try` directive bodies (React, Preact, Solid, and Vue production
  output), instead of leaving the lazy declaration as a plain destructure while
  its references go unrewritten.

  These scopes lower to compiler-generated function boundaries — scoped IIFEs,
  `.map(...)` callbacks, and `<Show>` / `<For>` / `<Match>` render closures — that
  did not exist when `has_lazy_descendants` was first stamped, so the lazy
  transform's fast-path skipped them. The descendant flag is now re-derived over
  the fully lowered tree before the transform runs, so a `let &{ name } = props`
  declared in a nested block or directive body is rewritten to
  `let __lazy0 = props` + `__lazy0.name` exactly as it is in a flat component
  body. A `@switch` case body's lazy bindings are now collected too (the shared
  switch block scope), so a reference like `{value}` becomes `{__lazy0.value}`
  rather than a half-transformed `let __lazy0 = props` with a dangling `value`.

  Also rewrite a lazy binding used as a JSX element/component name to a member
  expression (`function Comp(&{ Item }) @{ <Item></Item> }` →
  `function Comp(__lazy0) { return <__lazy0.Item></__lazy0.Item>; }`). The bound
  name is no longer a local once the param/declaration is replaced with the
  generated `__lazy0` source, so `<Item>` had been leaking a reference to an
  undefined identifier; it now reads the component off the lazy source like every
  other reference does.

  An untyped lazy object param no longer gets a synthesized `{ … : any }` type.
  The source specified no type, so the generated param is left implicitly `any`
  (`function Comp(__lazy0)`) instead of carrying a fabricated object shape; a
  param with an author-provided type still keeps it
  (`function Comp(__lazy0: Props)`).

  Type-only (virtual TSX) output is unchanged: it never runs the lazy transform,
  so the param keeps printing as a plain destructure (`{ Item }`, untyped) and
  `<Item>` keeps referencing that in-scope binding, which preserves identity-style
  source mappings for editor features.

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

- [#1281](https://github.com/Ripple-TS/ripple/pull/1281)
  [`b887deb`](https://github.com/Ripple-TS/ripple/commit/b887debf5f47e63d73184ac218ec8b3542a5e21c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix a parser stack overflow
  on a text-then-element sibling that follows newline-separated sibling elements
  (e.g. `<pre><b>2</b>\n<b>3</b>1<b>4</b></pre>`). The newline between two
  siblings leaves a stale `jsxText` token anchored on the next `<`; recovering
  from it used to clear _every_ JSX children context — including the parent
  element's own — so the later `text<tag>` sibling tokenized its `<` as a
  relational operator that `parseTemplateBody` has no branch for, recursing
  forever. The recovery now keeps one children context per still-open ancestor
  when the `<` opens a child/sibling tag, and only clears the full run when it
  opens a closing `</tag>`.

- [#1284](https://github.com/Ripple-TS/ripple/pull/1284)
  [`3668c5f`](https://github.com/Ripple-TS/ripple/commit/3668c5fe9cdaca4862707d653d23af94780f42af)
  Thanks [@leonidaz](https://github.com/leonidaz)! - fix(parser): keep significant
  whitespace before a `@{ … }` code block

  The native template body skipped leading whitespace when repositioning onto a
  `@{ … }` code block, so `<>   @{<b>123</b>}   </>` lost its leading edge space
  (only the trailing one survived). The whitespace is now emitted as a text child,
  matching the equivalent plain-element case; layout indentation (whitespace
  containing a newline) is still dropped.

## 0.1.32

### Patch Changes

- [#1277](https://github.com/Ripple-TS/ripple/pull/1277)
  [`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix parsing of sibling
  fragments/elements separated by template text. A `<>` or `<tag>` opening that
  follows template text (e.g. `<> <></> 2 <></> </>`) arrives as a relational `<`
  token; the JSX re-entry fallback now pushes the same tokenizer contexts a real
  `jsxTagStart` would, so the terminating `>` — including the lone `>` of a
  nameless fragment — is read as `jsxTagEnd` instead of a relational operator.
  Also preserve an inline space that separates two sibling elements on the same
  line (`<> <></>  <></>x </>`) as significant JSX text; only layout whitespace
  spanning a newline is still collapsed.

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

## 0.1.31

### Patch Changes

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

## 0.1.30

### Patch Changes

- [`b104604`](https://github.com/Ripple-TS/ripple/commit/b10460473fec0ee68b4963cbc2a3d9d5bb3bc633)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix descendant and sibling
  selectors being wrongly pruned as unused in the shared JSX targets (react,
  preact, solid, vue).

  Selector pruning for free-standing `<style>` blocks runs before the transform
  walker has stamped ancestor paths onto template nodes, so combinator matching
  (`.card h2`, `.card > ul`) found no ancestors and marked every such selector
  unused. Element collection for pruning now records each element's ancestor chain
  itself, so descendant matching works the same as in the Ripple target.

## 0.1.29

### Patch Changes

- [#1257](https://github.com/Ripple-TS/ripple/pull/1257)
  [`67de047`](https://github.com/Ripple-TS/ripple/commit/67de047d103f39673b25910e1a97760278820999)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Lower TSRX-only nodes inside
  expression-position `@{ … }` code blocks. Setup statements of a code block used
  as an expression (e.g. `const Test = @{ … }`) were carried into the generated
  scoped IIFE verbatim without re-visiting them, so a style expression
  (`const styles = <style> … </style>`) or a nested `@{ … }` block inside the
  setup reached the printer as a raw `JSXStyleElement` / `JSXCodeBlock` node and
  failed with "Not implemented: JSXStyleElement". The lowered scope is now
  re-visited the same way function-body code blocks are, so style expressions
  compile to their class maps (with the CSS emitted) and nested blocks lower into
  their own scopes.

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

## 0.1.28

### Patch Changes

- [#1255](https://github.com/Ripple-TS/ripple/pull/1255)
  [`f001849`](https://github.com/Ripple-TS/ripple/commit/f00184940979a77cbf6873a811caaaa436feab46)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Always parse `@{ … }` in
  template text position as a `JSXCodeBlock`. A code block preceded by text on the
  same line (e.g. `Hello @{props.username}`) was split into JSX text ending in a
  literal `@` plus a `{ … }` expression container, because the template raw-text
  scan only stopped at `<`, `{`, `}`, and control-flow directives. The scan now
  also stops at a `@{` code-block start, so inline blocks after text parse the
  same as blocks at the start of a body. A lone `@` not directly followed by `{`
  remains plain text.

- [#1254](https://github.com/Ripple-TS/ripple/pull/1254)
  [`4af2591`](https://github.com/Ripple-TS/ripple/commit/4af259139d118a27d177531aa6a21435a3f3a015)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix `@{ … }` code blocks in
  template children position for the shared JSX transform (react, preact, solid,
  vue). Nesting deeper than two levels leaked a raw code block into the statement
  stream — triggering spurious `_tsrx_child_*` captures and an IIFE whose render
  output was discarded (dropped in react/preact, rendered out of position in
  solid) — and flattened blocks merged lexical scopes, so shadowed declarations
  produced invalid output. Each block is now its own scope and the lowering pays
  only for what the block uses: template-only blocks merge statically into the
  parent, code-only blocks become a plain `{ … }` statement block, blocks with
  both setup code and render output become a scoped IIFE child, and nested chains
  fold into a single closure with nested plain blocks. Empty chains compile to
  nothing at any depth.

- [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep native template nodes in
  JSX-child shape inside synthetic fragments on JSX-emitting targets (react,
  preact, solid, vue). A fragment nested in an expression container could collapse
  to a bare expression placed directly in a fragment children list
  (`<>{a} <>{<>{b}</>}</></>` compiled to `<>{a}b</>`), which JSX reads as literal
  text — in both production output and the TS/Volar virtual code.

- [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse template text that
  touches a following tag (`<>hello<span>…`) as text plus a tag. The tokenizer
  treated a `<` directly after a text run ending in an identifier character as the
  start of a TypeScript type-argument list (`hello<T>`), so the tag failed to
  parse with "Unexpected token `>`".

- [#1256](https://github.com/Ripple-TS/ripple/pull/1256)
  [`f1a4c10`](https://github.com/Ripple-TS/ripple/commit/f1a4c10d2ad8ed604375f36f7ae3b653fe95ed1a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Recognize trailing `//` line
  comments in template text after a sibling on the same line. A `//` was only a
  comment when nothing but whitespace preceded it on its line, so
  `@{ … }  // note` (or an element/expression container followed by a trailing
  comment) treated the comment as text — and crashed with `Unexpected token` when
  the comment contained `<`. A `//` preceded only by whitespace since the start of
  its text run (right after a code block, element, or expression container) now
  starts a comment. `//` after real text on the same line is still literal, so
  `https://…` URLs stay text.

## 0.1.27

### Patch Changes

- [#1244](https://github.com/Ripple-TS/ripple/pull/1244)
  [`60a78c9`](https://github.com/Ripple-TS/ripple/commit/60a78c9def09eed6d706c42bc751d2d051d1d57f)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Strip `/* … */` block
  comments from template text on all targets. The template raw-text scanner only
  recognized line comments, so block comments in text position leaked into
  compiled output (production templates, server output, and to_ts virtual code)
  and, in one position, were both recorded as a comment and kept as text. Block
  comments are now removed from `JSXText` and recorded as comments everywhere, and
  the Prettier plugin prints them back (including before closing tags/fragments
  and in comment-only bodies) instead of relying on the leaked text.

## 0.1.26

### Patch Changes

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

- [#1241](https://github.com/Ripple-TS/ripple/pull/1241)
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Lower dynamic tags
  (`<{expr}>`) for Solid and Vue production output to scoped component bindings
  instead of the `Dynamic` helper component. Solid binds
  `const TsrxDynamic_N = _tsrx_dynamic(() => expr)` (aliasing `dynamic` from
  `@solidjs/web`); Vue aliases the tag inside an import-free expression-child IIFE
  so vue-jsx-vapor's render block keeps it reactive. Declarations are placed in
  the scope that owns the expression (e.g. inside loop callbacks), and the
  type-only transform keeps the `<TsrxDynamic is={expr}>` shape with source
  mappings for both tag positions.

## 0.1.25

### Patch Changes

- [`d14ec84`](https://github.com/Ripple-TS/ripple/commit/d14ec84f26233e514be9e59ffc94e61db5089587)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve whitespace between a
  control-flow directive's closing `}` and the following template text. A bare
  `else` (or any sibling text) after an `@if` block such as `@if (x) { … } else`
  now keeps the leading space instead of dropping it, matching how text after a
  plain element is handled.

- [`921fb9c`](https://github.com/Ripple-TS/ripple/commit/921fb9ce6485db41527b631f5236b7abbac74986)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix a parser crash ("Invalid
  array length") when a control-flow directive (`@if`/`@for`/`@switch`/`@try`) is
  followed by same-line trailing text that runs straight into the closing tag,
  e.g. `<>@if (a) { … } done</>`. The manual JSX-closing-tag re-entry now restores
  the two tokenizer contexts a real `jsxTagStart` would have pushed, so the
  closing tag no longer underflows the context stack.

- [#1233](https://github.com/Ripple-TS/ripple/pull/1233)
  [`1693c9e`](https://github.com/Ripple-TS/ripple/commit/1693c9e6daf1421e71171fe3c50e37adfc858b69)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove generated React and
  Preact hook helper extraction so hooks remain in authored order.

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

## 0.1.23

### Patch Changes

- [`9eb4819`](https://github.com/Ripple-TS/ripple/commit/9eb4819cede6da7e93cbcd2bdf284bcb42d40464)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow bare `else` text after a
  TSRX `@if` block while continuing to reject missing-`@` continuation clauses,
  and remove `finally` parsing from TSRX `@try` control flow.

- [`88a254c`](https://github.com/Ripple-TS/ripple/commit/88a254c69953a5ace33bc10047f11052ec598672)
  Thanks [@leonidaz](https://github.com/leonidaz)! - For Ripple, emit
  `@for @empty` fallback bodies in client `to_ts` output. Mapping of the node for
  all targets.

- [`ba3a7f6`](https://github.com/Ripple-TS/ripple/commit/ba3a7f6485ea163e60cc0750a8e8b06b50728009)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow TSRX `@{}` blocks and
  `@if`/`@for`/`@switch`/`@try` directives as dangling expression statements.

- [#1211](https://github.com/Ripple-TS/ripple/pull/1211)
  [`ac6f358`](https://github.com/Ripple-TS/ripple/commit/ac6f3582ca0b2814004439c882d6aa735c8afe50)
  Thanks [@trueadm](https://github.com/trueadm)! - Add diagnostics, lint autofix,
  and MCP advice for function bodies that forget `@{...}` before TSRX template
  output.

- [`78ffa8d`](https://github.com/Ripple-TS/ripple/commit/78ffa8d90fd01e85bf34e5c6adef0e51caae8da7)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Lower bare
  `@if`/`@for`/`@switch`/`@try` control-flow directives that sit directly in a
  call/`new` argument position
  (`func(@if (status === 'active') { … } @else { … })`). For the React, Preact,
  Solid, and Vue targets these previously leaked an untransformed
  `JSXIfExpression`/`JSXForExpression`/`JSXSwitchExpression`/`JSXTryExpression`
  straight to the printer and crashed with "Not implemented: JSX…Expression". The
  argument is now wrapped in a native TSRX fragment before transform, so it flows
  through the same render machinery as an expression-bodied arrow, `return`, or
  assignment output (a `@{ … }` code-block argument already lowered to an IIFE and
  is unchanged).

- [`16560cb`](https://github.com/Ripple-TS/ripple/commit/16560cb466430bdbe8749d9491bc79e69e58d02c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Lower bare
  `@if`/`@for`/`@switch`/`@try` control-flow directives that sit directly in an
  expression position — an expression-bodied arrow
  (`const M = (props) => @switch (x) { … }`), a `return @switch (x) { … }`, or
  assignment to a variable (`const view = @switch (x) { … }`,
  `view = @switch (x) { … }`). For the React, Preact, Solid, and Vue targets these
  previously leaked an untransformed
  `JSXSwitchExpression`/`JSXIfExpression`/`JSXForExpression`/`JSXTryExpression`
  straight to the printer and crashed with "Not implemented: JSX…Expression". The
  directive is now wrapped in a native TSRX fragment before transform, so it flows
  through the same render machinery as a component-body output and each platform
  emits its existing lowering (an IIFE+`switch` for React/Preact/Vue,
  `<Switch>`/`<Match>` for Solid).

- [`4be6e54`](https://github.com/Ripple-TS/ripple/commit/4be6e54bbfee20927adca473648a94aa173d7d77)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse `@{ … }` code blocks
  and `@if`/`@for`/`@switch`/`@try` control-flow directives inside an element
  nested in a `{ … }` expression container (e.g. `{<div>@if (x) { … }</div>}`,
  including in `.map()` callbacks). These previously crashed with "RangeError:
  Invalid array length": the directive parser strips JSX tokenizer contexts so its
  body parses as JS, and inside an expression container it also stripped the
  container's and enclosing element's contexts, underflowing the context stack
  when the surrounding markup closed. The directive filter now preserves every
  context below the innermost expression-container baseline, matching the bare
  `function … @{ … }` form.

- [`2b67f83`](https://github.com/Ripple-TS/ripple/commit/2b67f83d7ed7eab7a39bc33524fcf73f737d977e)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse ternaries whose
  branches are JSX elements or fragments with children inside a `{ … }` expression
  container (e.g. `{cond ? <div>a</div> : <span>b</span>}`, including nested
  ternaries, fragment branches, and ternaries in attribute values or `.map()`
  callbacks). A JSX branch left the tokenizer at `exprAllowed === false`, so the
  `<` after the `:` was not recognized as a tag start and parsing failed with
  "Unexpected token". Expression position is now restored after a JSX ternary
  branch so the alternate parses as JSX too.

- [`9918c52`](https://github.com/Ripple-TS/ripple/commit/9918c52e954f2b8e1a994892e7c555e8277f2d59)
  Thanks [@trueadm](https://github.com/trueadm)! - Keep ordinary JavaScript
  control-flow blocks from implicitly rendering bare TSRX templates while
  preserving Solid terminal branch lowering.

- [`e8493be`](https://github.com/Ripple-TS/ripple/commit/e8493be0b3489f402105297251e1919c103c2360)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve leading whitespace
  in JSX text children of elements nested inside `{ … }` expression containers.
  The JSX-expression reader skipped leading whitespace before anchoring the
  JSXText token, so `{<textarea>   a</textarea>}` lost its indentation while the
  bare `<textarea>   a</textarea>` kept it. Both paths now capture text
  identically, so every target (Ripple, React, Preact, Solid, Vue, including
  `typeOnly`/`to_ts` output) emits consistent JSX text.

- [`c424675`](https://github.com/Ripple-TS/ripple/commit/c424675102a9edd4f1e356fb6db30124a9c2d885)
  Thanks [@trueadm](https://github.com/trueadm)! - Extract hook-bearing plain `if`
  return branches in React and Preact TSRX component bodies into helper
  components.

## 0.1.22

### Patch Changes

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix line-tracking desync when a
  code-block setup statement following a render node is mis-read as JSX text.
  Re-reading the statement now rewinds the line counter along with the position,
  so node `loc` lines stay correct and source-map mapping no longer crashes
  ("Location line ... out of bounds") for blocks without a trailing newline.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow a trailing `;` after the
  render node of a `@{ }` code block or directive body (e.g. `<>…</>;`). The stray
  semicolon is a meaningless empty statement and is now skipped during parsing
  instead of being captured as a statement after the render output. This
  previously produced a "statements cannot follow the rendered output" diagnostic
  and, because the render node was then mis-bucketed as a body statement, could
  crash the transformer with "Not implemented: JSXStyleElement" when the output
  contained a `<style>` element. Prettier still strips the semicolon on format.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Map preserved TypeScript pragma
  comments to their original source ranges in Volar TypeScript output.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Emit `return null` for
  `continue` inside JSX template `@for` loop callbacks.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Preserve scoped CSS classes for
  dynamic TSRX elements when selectors use tag names.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow empty `<style></style>`
  blocks inside TSRX fragments.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Support fenced script-only TSRX
  control-flow directive bodies.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `@empty { ... }` fallbacks
  for TSRX `@for` loops, require prefixed template continuation clauses such as
  `@else`, `@empty`, `@pending`, `@catch`, `@case`, and `@default`, and reject
  direct `continue`, `break`, and `return` statements inside `@for` loop bodies
  and `@if` template branches.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Move native TSRX element
  parsing toward standard JSX AST nodes, add a dedicated `JSXStyleElement` node,
  and cover `---` template fence edge cases.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix parsing module-scope style
  expressions followed by regular JavaScript statements.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix native template parsing
  when script-section functions return fragments before a template fence.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Preserve spaces between inline
  JSX text and expression children in the parser and formatter.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow JSX and shared ref helper
  types to accept arrays of ref functions.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the stale
  `ScriptContent` AST node typing and dead transform handlers.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix parsing of a `@{ … }`
  code-block body that follows a function return-type annotation, e.g.
  `function App(): JSX.Element @{}`. The return type was parsed inside
  acorn-typescript while still in type-tokenizer mode, so the trailing `@` threw
  "Unexpected character '@'" before the code block could be recognized. The return
  type is now parsed before the body is inspected, and `@` is tokenized in type
  mode, so typed functions, methods, anonymous function expressions, and generic
  signatures all accept a `@{ … }` body.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Prevent TSRX parser hangs when
  JSX switch cases contain elements followed by break statements, and preserve
  dynamic element lowering through Ripple normalization.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix TSRX parser handling for
  generic function expressions in template setup and parenthesized conditional JSX
  spread attributes.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Keep TSRX template replay
  locations aligned so generated TypeScript source maps stay within the source
  document.

## 0.1.21

### Patch Changes

- [#1198](https://github.com/Ripple-TS/ripple/pull/1198)
  [`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the unused namespaced
  TSX island feature and React bridge package.

- [#1189](https://github.com/Ripple-TS/ripple/pull/1189)
  [`e00f596`](https://github.com/Ripple-TS/ripple/commit/e00f5961d5668c054435c8a366ef2a6da6e4a381)
  Thanks [@trueadm](https://github.com/trueadm)! - Restore reactive Solid
  control-flow lowering for native TSRX component bodies.

## 0.1.20

### Patch Changes

- [#1185](https://github.com/Ripple-TS/ripple/pull/1185)
  [`0ea87fb`](https://github.com/Ripple-TS/ripple/commit/0ea87fb3cbef21c3c00d63cc2a1f3c9f34d01c24)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the reserved `<tsx>`
  expression wrapper and use TSRX fragments as the native expression form.

  Plain `<tsx>` is now treated as an ordinary element. Tooling now uses the
  `TsrxFragment` AST node for native fragments and updates formatting, linting,
  symbols, transforms, and generated docs around the simplified syntax.

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

## 0.1.18

### Patch Changes

- [`5c0b0ff`](https://github.com/Ripple-TS/ripple/commit/5c0b0ff031ddfb319bb048d627e2d2a2a49c1f1d)
  Thanks [@trueadm](https://github.com/trueadm)! - Add support for reusable style
  element expressions and update React/Preact target behavior.

  Style elements can now be assigned to variables and used as class maps, while
  inline style blocks inside returned TSRX stay scoped to that fragment. React and
  Preact also preserve authored class attributes and handle conditional hooks from
  function component bodies with the new function-based TSRX model.

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

## 0.1.16

### Patch Changes

- [#1175](https://github.com/Ripple-TS/ripple/pull/1175)
  [`d045396`](https://github.com/Ripple-TS/ripple/commit/d0453962cfe1df7a98a0981b0bf3e5729195a9ae)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Align prop getter generation
  for JSX-style TSRX expression fragments with native TSRX component templates.
  Reject native dynamic marker syntax on TSX attribute names and inside TSX
  fragments.

## 0.1.15

### Patch Changes

- [#1173](https://github.com/Ripple-TS/ripple/pull/1173)
  [`ea717f2`](https://github.com/Ripple-TS/ripple/commit/ea717f2ac20901aca59946c1cea8066c28a4220c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve comments inside
  destructured typed parameters and type literals during formatting.

- [#1172](https://github.com/Ripple-TS/ripple/pull/1172)
  [`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add verification-only Volar
  mappings for whole arrow functions.

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

## 0.1.13

### Patch Changes

- [#1162](https://github.com/Ripple-TS/ripple/pull/1162)
  [`95c2976`](https://github.com/Ripple-TS/ripple/commit/95c2976b9ec2c20c4160ad13b636c1ed03e863ef)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Allow native TSRX shorthand
  attributes inside `<tsrx>` blocks nested under TSX.

## 0.1.12

### Patch Changes

- [#1156](https://github.com/Ripple-TS/ripple/pull/1156)
  [`2acbbea`](https://github.com/Ripple-TS/ripple/commit/2acbbea9253ac8f516fe0d3a7a38331490e6fd8b)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Transform nested `<tsrx>`
  templates inside TSX expressions instead of preserving invalid `<tsrx>` JSX tags
  in framework output.

- [#1153](https://github.com/Ripple-TS/ripple/pull/1153)
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse nested `<tsrx>` islands
  inside `<tsx>` expression containers as native TSRX so setup declarations and
  references keep Volar mappings, and hydrate deeply nested `<tsx>`/`<tsrx>`
  expression values without skipping server markers.

## 0.1.11

### Patch Changes

- [#1145](https://github.com/Ripple-TS/ripple/pull/1145)
  [`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add Vue Vapor support for
  TSRX `try/pending` by lowering pending blocks to Vue Suspense slots.

## 0.1.10

### Patch Changes

- [#1141](https://github.com/Ripple-TS/ripple/pull/1141)
  [`8c064c8`](https://github.com/Ripple-TS/ripple/commit/8c064c888b60e4fcf88f6828e51792b3bba5797a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Improve JSX event handler
  typings to infer specific DOM event types. Improve all JSX types for much
  improved typescript support. Mark self-closing JSX tokens as completion-capable
  so empty attribute positions can surface editor completions. Fix no intellisense
  on dom attributes when <style> blocks were present Share scoped CSS selector
  metadata across TSRX targets so class-name definitions work outside Ripple too.
  CMD+click now jumps to class definitions for all tsrx platforms.

## 0.1.9

### Patch Changes

- [#1135](https://github.com/Ripple-TS/ripple/pull/1135)
  [`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Support sole-child
  `{html ...}` raw HTML lowering for React, Preact, Solid and Vue targets, while
  keeping Ripple's existing child raw HTML behavior unchanged.

## 0.1.8

### Patch Changes

- [`b54fdfc`](https://github.com/Ripple-TS/ripple/commit/b54fdfc3ebfea29ac613307b76732c5bf5f49ab5)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse semicolonless `<tsrx>`
  returns inside component callback props.

- [`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Use esrap 2.2.8 instead of
  carrying a local 2.2.7 patch.

## 0.1.7

### Patch Changes

- [#1126](https://github.com/Ripple-TS/ripple/pull/1126)
  [`2b1f746`](https://github.com/Ripple-TS/ripple/commit/2b1f7469ab31713140a5baf912a19fa8eedb9234)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep runtime helper imports
  on namespaced runtime subpaths so production app bundles do not pull in
  compiler-only modules.

- [#1123](https://github.com/Ripple-TS/ripple/pull/1123)
  [`e4a04dd`](https://github.com/Ripple-TS/ripple/commit/e4a04ddb4bbc8e21a9c7c2c65b179d764b72e4fb)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Nested lazy destructuring
  support for all tsrx targets. Ripple already fully supported it.

## 0.1.6

### Patch Changes

- [`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Republish version with the
  new publish.yaml workflow

## 0.1.5

### Patch Changes

- [#1110](https://github.com/Ripple-TS/ripple/pull/1110)
  [`de27e18`](https://github.com/Ripple-TS/ripple/commit/de27e182d002ea736aee992acca4cbf9873a307d)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Drop the
  continuation/tail-helper lift for hook-bearing `if`, `switch`, `try`, and
  `for-of` blocks in React and Preact output. The pattern existed to forward
  post-hook mutations through to statements after the control-flow construct, but
  the hook-callback-outer-mutation and hook-result-outer-assignment validations
  make those mutations unreachable. The hook-bearing branch is still wrapped in
  its own `StatementBodyHook` helper to satisfy Rules of Hooks; trailing
  statements now stay in the parent component instead of being lifted into a tail
  helper. For-of helpers no longer thread an `_tsrx_isLast_*` prop or emit an
  empty-source fallback. Output is smaller and easier to read with no behavior
  change for valid programs.

- [`59e1e32`](https://github.com/Ripple-TS/ripple/commit/59e1e328607598fe342abbba35f76e5fadb9ca5c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix parsing for
  statement-bodied `<tsrx>` templates used directly as self-closing JSX component
  attribute values.

- [#1116](https://github.com/Ripple-TS/ripple/pull/1116)
  [`1256569`](https://github.com/Ripple-TS/ripple/commit/12565695efaa3a4ad429245807721ea671c2ecb5)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Compile `for ... of` in React
  and Preact components through a new `map_iterable` runtime helper instead of an
  inline `Array.isArray(src) ? src : Array.from(src)` normalization followed by
  `.map(...)`. Both the non-hook and hook-bearing lowerings now emit a single
  `map_iterable(source, (item, i) => ...)` call that accepts any `Iterable` —
  `Set`, `Map`, generators, and other iterators — without copying arrays. The
  helper is imported from a new target-namespaced subpath: `@tsrx/react/runtime`
  for React output and `@tsrx/preact/runtime` for Preact output, both of which
  re-export from `@tsrx/core/runtime`, so end-user projects only need the target
  package installed. Loop-scoped TS types in editor-tooling (non-module-scoped
  helper) output reference the new `IterationValue<T>` helper so destructured
  `Map` entries and other non-array sources type-check correctly.

- [#1116](https://github.com/Ripple-TS/ripple/pull/1116)
  [`1256569`](https://github.com/Ripple-TS/ripple/commit/12565695efaa3a4ad429245807721ea671c2ecb5)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Allow native TSRX template
  expression containers to recover from a trailing semicolon before the closing
  brace while reporting an editor diagnostic.

- [#1112](https://github.com/Ripple-TS/ripple/pull/1112)
  [`18b4aef`](https://github.com/Ripple-TS/ripple/commit/18b4aefa8127e56a9f1b3058da2d4d2172551579)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Support JavaScript `switch`
  fall-through semantics in component templates across the React, Preact, Solid,
  and Vue targets. When a `case` body has no `break` (or terminal `return`), each
  entry case now renders its own body plus every downstream body it would have
  fallen into — matching JS spec and the existing Ripple runtime behavior.

  All four targets reuse the same `create_hook_safe_helper` lift that hook-bearing
  case bodies already go through, orchestrated by a shared `plan_switch_lift`
  planner exported from `@tsrx/core`. Any case body that appears in more than one
  arm after fall-through analysis is hoisted into its own `StatementBodyHook`
  helper component, and each upstream arm chains into the next helper at the end
  of its body. Each case body therefore appears exactly once in the generated
  module regardless of how many arms reach it, keeping bundle size linear in case
  count and source mappings 1:1 for editor IntelliSense. Cases that terminate with
  `break` (or aren't reached via fall-through) stay inline as before.
  - **React, Preact, Vue** keep the JS `switch` and emit case arms that
    `return <Helper/>` for lifted bodies; inline arms append `<NextHelper/>` as
    the chain entry point.
  - **Solid** lowers each entry case to a `<Match>` whose body is the lifted
    helper element, or for inline arms a fragment of the inline JSX plus a chain
    `<NextHelper/>`.

  Vue's and Solid's client transforms now hoist all `StatementBodyHook` helpers —
  not just the fall-through ones — to module scope (Vue wraps each in
  `defineVaporComponent`). Every control flow that already went through the lift
  on React (hook-bearing `if`, `switch`, `try`, and `for-of` bodies) now produces
  a single top-level helper instead of a per-render lazy initializer.
  `compile_to_volar_mappings` opts back out via
  `moduleScopedHookComponents: false` so Volar's virtual TSX keeps helpers local —
  closure-captured bindings stay resolvable against the component body for type
  checking.

  Create map helper functions for for-of loops to be used in the future transforms

## 0.1.4

### Patch Changes

- [#1104](https://github.com/Ripple-TS/ripple/pull/1104)
  [`3e84758`](https://github.com/Ripple-TS/ripple/commit/3e847588027d6254c3999a87c717e9d58fb55a26)
  Thanks [@trueadm](https://github.com/trueadm)! - Tighten hook outer-binding
  validator around `for…of`:
  - A non-declaration target (`for (x of items)`) was being treated as a local
    declaration, hiding later hook-result assignments to the same outer binding.
  - `let`/`const` declared by a for-of (`for (const x of items)`) was likewise
    being added to the _enclosing_ block's shadowed set, even though the binding
    is scoped to the loop in JavaScript. This let after-loop assignments to a
    same-named outer binding (e.g.,
    `for (const x of items) { … } [x] = useState(0)`) escape detection.
    Loop-declared names are now scoped to the body sub-tree only.
  - The for-of's own iteration assignment was not inspected at all, so iterating a
    hook-derived value into an outer binding (e.g., `for (x of useState(0))` or
    `for ([a, b] of [useState(0)])`) silently lost the rebind in the emitted code.

  All three shapes now report the same diagnostic as a direct hook-result
  assignment to an outer binding.

- [#1104](https://github.com/Ripple-TS/ripple/pull/1104)
  [`3e84758`](https://github.com/Ripple-TS/ripple/commit/3e847588027d6254c3999a87c717e9d58fb55a26)
  Thanks [@trueadm](https://github.com/trueadm)! - Constrain React and Preact hook
  isolation so hook results cannot cross generated hook component boundaries,
  reject hook callbacks that mutate parent-scope bindings across those boundaries,
  and keep hook-bearing `<tsrx>` expressions in regular functions behind stable
  helper components.

- [#1105](https://github.com/Ripple-TS/ripple/pull/1105)
  [`509170b`](https://github.com/Ripple-TS/ripple/commit/509170ba3cecc611ba1798575c70555070665736)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix parsing native TSRX
  statements before later JavaScript statements inside JSX attribute callbacks.

## 0.1.3

### Patch Changes

- [#1103](https://github.com/Ripple-TS/ripple/pull/1103)
  [`5a59d73`](https://github.com/Ripple-TS/ripple/commit/5a59d73daf60b2652c86ffad2a4eaf3d801e40d7)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse statement-position
  `<tsrx>` templates inside nested functions in JSX attribute objects.

- [#1099](https://github.com/Ripple-TS/ripple/pull/1099)
  [`4f360f0`](https://github.com/Ripple-TS/ripple/commit/4f360f008edf61492cf85afa646c797c80a73f22)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep explicit return values
  in expression-position `<tsrx>` templates out of render control-flow lowering.

- [#1102](https://github.com/Ripple-TS/ripple/pull/1102)
  [`c042672`](https://github.com/Ripple-TS/ripple/commit/c04267255d35945753ca8090006622c96fa0a14f)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow empty `pending {}` blocks
  in component try statements to render a null fallback.

- [#1098](https://github.com/Ripple-TS/ripple/pull/1098)
  [`a9d640f`](https://github.com/Ripple-TS/ripple/commit/a9d640f0728996b3f21b452ffe6040e54d82609c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep special fragment return
  values inside component-local functions attached to their return statements.

- [#1103](https://github.com/Ripple-TS/ripple/pull/1103)
  [`5a59d73`](https://github.com/Ripple-TS/ripple/commit/5a59d73daf60b2652c86ffad2a4eaf3d801e40d7)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parser fix for fragment
  expression values inside JSX attribute objects/arrays. Previously the leaked
  `tc_expr, b_stat` token contexts after a fragment caused the next entry's `<` to
  be tokenized as a TS relational operator instead of `jsxTagStart`. Affected
  shapes:
  - `params={{ list: [<>A</>, <>B</>] }}` (multi-fragment array as object
    property)
  - `params={{ a: <>X</>, b: ... }}` (fragment as object property followed by
    another property)
  - `params={{ list: [<><span>A</span></>, <><span>B</span></>] }}` (same shapes
    with fragments containing child elements)

- [#1101](https://github.com/Ripple-TS/ripple/pull/1101)
  [`2ae792c`](https://github.com/Ripple-TS/ripple/commit/2ae792cdca7d466e552a330ea965cefec2b1f5a5)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve JSX parser state for
  semicolon-free native TSRX returns inside callback props.

- [#1095](https://github.com/Ripple-TS/ripple/pull/1095)
  [`96360f3`](https://github.com/Ripple-TS/ripple/commit/96360f36306180e67ce69e464dd545773e57e8b1)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parser fix for <tsrx> -
  cleans up the pending token context for }, ), ], plus the callback-return case:
  parenthesized: content={(<tsrx>...</tsrx>)} passed as a call arg:
  content={wrap(<tsrx>...</tsrx>)} used as an object property:
  content={{ child: <tsrx>...</tsrx> }}

## 0.1.2

### Patch Changes

- [#1092](https://github.com/Ripple-TS/ripple/pull/1092)
  [`2010290`](https://github.com/Ripple-TS/ripple/commit/20102904d68951b47dce3958f88ddd1fc150e7a1)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix parsing inline `<tsrx>`
  template fragments inside JSX attribute expression values.

## 0.1.1

### Patch Changes

- [`0fdf340`](https://github.com/Ripple-TS/ripple/commit/0fdf3408417a7565a00304b766e958b438b3c834)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep sibling children in
  `<tsrx>`, `<tsx>`, and shorthand `<>` fragments on separate formatted lines and
  avoid stale JSX tokenizer state at EOF after compact `<tsrx>` expressions.

## 0.1.0

### Minor Changes

- [#1088](https://github.com/Ripple-TS/ripple/pull/1088)
  [`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `<tsrx>...</tsrx>`
  expression fragments for inline native TSRX template values.

## 0.0.28

### Patch Changes

- [#1071](https://github.com/Ripple-TS/ripple/pull/1071)
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add named ref props with
  `prop_name={ref expr}` syntax and expose `isRefProp()` for runtime detection of
  named ref prop values.

- [#1071](https://github.com/Ripple-TS/ripple/pull/1071)
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Import ref helpers only when
  their generated calls are emitted.

- [#1071](https://github.com/Ripple-TS/ripple/pull/1071)
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Declare normalized host
  spread refs emitted from TSX expression blocks.

## 0.0.27

### Patch Changes

- [#1064](https://github.com/Ripple-TS/ripple/pull/1064)
  [`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Reject component declarations
  with more than one parameter. Previously, JSX targets passed extra parameters
  straight through into the generated function and ripple silently dropped them.
  Multi-parameter components now error in regular compile and are surfaced as
  collected diagnostics in the Volar editor pipeline.

- [#1061](https://github.com/Ripple-TS/ripple/pull/1061)
  [`29ac6d7`](https://github.com/Ripple-TS/ripple/commit/29ac6d757b376e4102c4c8c8d3d47f7ae3afdd00)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix lone expression children
  inside fragment shorthand so they render from component, branch, and loop
  bodies.

- [#1057](https://github.com/Ripple-TS/ripple/pull/1057)
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Enforces a stricter rule for
  components declared inside classes: they must be arrow-function class properties
  (including static), and class component foo() {} method-style declarations are
  no longer supported.

  Removes component method declarations support in favor of using as properties.

- [#1054](https://github.com/Ripple-TS/ripple/pull/1054)
  [`cf60dba`](https://github.com/Ripple-TS/ripple/commit/cf60dbaf9c6be84d6e95f9c5d66b64d8927494c9)
  Thanks [@trueadm](https://github.com/trueadm)! - Emit React hook-isolation
  branch helpers as module-scope components without synthetic `any` prop
  annotations, while preserving lexical helper prop types for editor tooling.

- [#1066](https://github.com/Ripple-TS/ripple/pull/1066)
  [`4cd0986`](https://github.com/Ripple-TS/ripple/commit/4cd0986201e960cd8544d0f789d17a217e93f954)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Introduces a typeOnly flag to
  transformers to compile for either production or editor support.

  Lazy transformations for typeOnly are not skipped, only the & is removed to make
  it look like a regular destructure.

- [#1063](https://github.com/Ripple-TS/ripple/pull/1063)
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Standardizes compile api
  across all packages, including forcing types to adhere to the standard. Adds
  more debug compile options to the playgrounds.

## 0.0.26

### Patch Changes

- [#1055](https://github.com/Ripple-TS/ripple/pull/1055)
  [`8125c73`](https://github.com/Ripple-TS/ripple/commit/8125c73b37e7b201dbb0a078e3583c022ceb7687)
  Thanks [@trueadm](https://github.com/trueadm)! - Capture repeated static JSX
  before multiple React and Preact early-return guards to avoid duplicated output.

## 0.0.25

### Patch Changes

- [#1047](https://github.com/Ripple-TS/ripple/pull/1047)
  [`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Support arrow syntax for
  anonymous component expressions and preserve anonymous component
  function-vs-arrow source form across TSRX and Ripple targets.

- [#1047](https://github.com/Ripple-TS/ripple/pull/1047)
  [`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Removes duplicate utils,
  moves most utils to @tsrx/core, include their tests.

  Fixes some types

- [#1050](https://github.com/Ripple-TS/ripple/pull/1050)
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)
  Thanks [@trueadm](https://github.com/trueadm)! - Parse direct double-quoted text
  in bare if/else branches and backtick-delimited fragment text as renderable
  template text.

## 0.0.24

### Patch Changes

- [#1042](https://github.com/Ripple-TS/ripple/pull/1042)
  [`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)
  Thanks [@trueadm](https://github.com/trueadm)! - Align component loop
  control-flow validation across TSRX targets and allow `continue` to skip
  `for...of` iterations.

- [#1042](https://github.com/Ripple-TS/ripple/pull/1042)
  [`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix parsing for text-only
  `<>...</>` fragment initializers before TSRX expression children.

## 0.0.23

### Patch Changes

- [#1040](https://github.com/Ripple-TS/ripple/pull/1040)
  [`3b2eae2`](https://github.com/Ripple-TS/ripple/commit/3b2eae24dc955325a0379c4773631796865e0f38)
  Thanks [@trueadm](https://github.com/trueadm)! - Parse indented direct
  double-quoted TSRX text children as text nodes.

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

## 0.0.22

### Patch Changes

- [#1031](https://github.com/Ripple-TS/ripple/pull/1031)
  [`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve generic type
  arguments on JSX component tags (e.g. `<RenderProp<User>>`). They were being
  silently dropped during prettier formatting, during the tsrx → JSX compile
  output for React/Preact/Solid/Vue, and in Ripple's `to_ts` virtual-code output
  used by the language server for typechecking.

## 0.0.21

### Patch Changes

- [#1025](https://github.com/Ripple-TS/ripple/pull/1025)
  [`76fd362`](https://github.com/Ripple-TS/ripple/commit/76fd3622f3e6432787fadb1a96337541424b25aa)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fixes a bug where for all
  control statements: for, if, switch, try/pending/catch where using hooks inside
  to change values, like useState, would not be reflected in the subsequent code.
  The fix involved creating continuation hooks and calling them at the end of the
  control flow block - it's an oversimplification.

  Fixes the for loop by hoisting the generated statement body hooks and types to
  the outside of the loop.

  Refactors a bunch, but not all, manually created AST nodes into using ast
  builder functions.

## 0.0.20

### Patch Changes

- [#1014](https://github.com/Ripple-TS/ripple/pull/1014)
  [`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)
  Thanks [@trueadm](https://github.com/trueadm)! - Add a `collect` compile option
  for collecting diagnostics and comments without enabling loose markup recovery.

- [#1014](https://github.com/Ripple-TS/ripple/pull/1014)
  [`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)
  Thanks [@trueadm](https://github.com/trueadm)! - Add diagnostic codes to
  selected compiler errors and expose them through MCP compile and analyze
  results.

## 0.0.19

### Patch Changes

- [#1009](https://github.com/Ripple-TS/ripple/pull/1009)
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Stop emitting a duplicate
  source mapping for the synthesized attribute name when shorthand JSX attributes
  (`<X {count} />`) are expanded to longhand (`<X count={count} />`). The
  generated `count=` does not exist in the source, so it should not carry a source
  mapping; previously editors showed duplicate hover/intellisense popups on the
  same `{count}` span.

- [#1009](https://github.com/Ripple-TS/ripple/pull/1009)
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Collect transform-time errors
  instead of throwing in loose mode for the JSX targets (React, Preact, Solid,
  Vue). Recoverable validation failures (component `await` without `"use server"`,
  `<tsx:kind>` mismatches, multiple `ref={...}` attributes, malformed `try`
  blocks, fragment-as-element, `for await...of`) now push onto `result.errors` so
  the typescript-plugin and other editor tooling can surface them as diagnostics
  on top of a still-valid virtual TSX, mirroring how `@tsrx/ripple` already
  behaves.

- [#1009](https://github.com/Ripple-TS/ripple/pull/1009)
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add type declarations for the
  `./merge-refs` and `./error-boundary` subpath exports of `@tsrx/react`,
  `@tsrx/preact`, and `@tsrx/vue`, and for `@tsrx/core/runtime/merge-refs`.
  Previously these subpaths only declared a `default` export, so under
  `node16`/`nodenext`/`bundler` resolution TypeScript could not pick up types for
  `import { mergeRefs } from '@tsrx/react/merge-refs'` or the `TsrxErrorBoundary`
  re-exports.

## 0.0.18

### Patch Changes

- [#1007](https://github.com/Ripple-TS/ripple/pull/1007)
  [`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7)
  Thanks [@trueadm](https://github.com/trueadm)! - Keep double-quoted JavaScript
  strings inside TSRX expression containers using normal JavaScript string
  semantics while preserving direct double-quoted text child parsing.

- [#994](https://github.com/Ripple-TS/ripple/pull/994)
  [`bce43be`](https://github.com/Ripple-TS/ripple/commit/bce43be304812ca04dd8d196e2439f28ea392237)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Compile-time merge for
  multiple ref expressions, plus a diagnostic for duplicate `ref={...}`
  attributes.

  **New rule**: an element may have at most one TSX-style `ref={...}` attribute.
  Multiple `ref={...}` on the same element is now a compile error — they would
  otherwise produce duplicate JSX props (last-wins at runtime, can't be typed
  cleanly). The error suggests the supported alternative.

  **Multiple `{ref expr}` keyword-form refs are still supported and merge into one
  ref**:
  - `@tsrx/react`, `@tsrx/preact`, and `@tsrx/vue` emit
    `ref={mergeRefs(a, b, ...)}`, importing the shared `mergeRefs` helper from
    `@tsrx/react/merge-refs`, `@tsrx/preact/merge-refs`, and
    `@tsrx/vue/merge-refs` respectively. The helper supports function refs,
    React-style `{ current }` ref objects, and Vue-style `{ value }` ref objects
    (e.g. from `ref()` / `useTemplateRef()`), and composes React 19 cleanup return
    values.
  - `@tsrx/solid` emits `ref={[a, b, ...]}`, which Solid's runtime iterates
    natively.

  A single `ref={...}` may be combined with any number of `{ref expr}` on the same
  element — they all merge together. Single-ref elements (either syntax) emit
  unchanged with no helper import.

  `@tsrx/vue` previously merged multiple `{ref expr}` into an inline arrow
  callback that only worked for function refs. Vue now uses the shared `mergeRefs`
  helper, which fixes Vue ref-object handling (`ref()` / `useTemplateRef()`) and
  the previously-broken combo case (`<el ref={a} {ref b} />`).

## 0.0.17

### Patch Changes

- [#1002](https://github.com/Ripple-TS/ripple/pull/1002)
  [`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)
  Thanks [@trueadm](https://github.com/trueadm)! - Align direct double-quoted TSRX
  text children with quoted JSX attribute text by decoding character references
  and treating backslashes as literal text. Preserve the direct quoted form in the
  Prettier plugin and highlight it as JSX text in the TextMate grammar.

## 0.0.16

### Patch Changes

- [#949](https://github.com/Ripple-TS/ripple/pull/949)
  [`f660969`](https://github.com/Ripple-TS/ripple/commit/f66096972bc8d2f03061e6018d03e40207761aaa)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix Vue early-return lowering
  so continuation-local refs stay stable across parent updates.

  Also make `if (cond) return;` early returns in Vue components reactive after
  mount. Previously the early return was emitted as a setup-time `if` block, which
  only evaluated `cond` once when `setup()` ran and never again — so flipping the
  condition after mount didn't toggle the continuation.

  The lowering now picks one of two paths based on the continuation:
  - **Pure JSX continuation** — inlined as a render-time ternary
    (`cond ? null : <continuation/>`). Cheapest path, no extra component.
  - **Continuation with setup-time statements** (`provide`, `watch`,
    `watchEffect`, declarations, plain function calls, etc.) — moved into a
    `StatementBodyHook` helper component whose setup runs only when the helper
    mounts. This keeps those statements scoped to the continuation's lifecycle so
    e.g. `provide` is only visible to descendants while the continuation is
    active.

  React, Preact, and Solid lowering is unchanged: their bodies re-run on every
  render, so the existing setup-time `if` already behaves reactively.

## 0.0.15

### Patch Changes

- [#987](https://github.com/Ripple-TS/ripple/pull/987)
  [`0ad85f1`](https://github.com/Ripple-TS/ripple/commit/0ad85f1107ce9bddb72cee44b908a34c5264c0b5)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow direct double-quoted
  static text children in TSRX templates.

- [`7684132`](https://github.com/Ripple-TS/ripple/commit/7684132ed71db6c550ecbe1c623975ddbed96be5)
  Thanks [@aleclarson](https://github.com/aleclarson)! - Fix Volar source mappings
  for switch statements and sparse generic spans.

## 0.0.14

### Patch Changes

- [#985](https://github.com/Ripple-TS/ripple/pull/985)
  [`cf4f06e`](https://github.com/Ripple-TS/ripple/commit/cf4f06e8bcbb41f863d047dfaa6d9d17ed212163)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Allow empty `<tsx></tsx>` and
  `<></>` fragments. The parser previously failed with "Unterminated regular
  expression" because `exprAllowed` leaked out of the template-body loop and
  caused the closing tag's `/` to be tokenized as a regex literal.

- [#982](https://github.com/Ripple-TS/ripple/pull/982)
  [`fcd25aa`](https://github.com/Ripple-TS/ripple/commit/fcd25aa549db0d56ccbd596b657b856a5061e20f)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Reject return statements with
  values in component bodies for React, Preact, and Solid TSRX targets.

- [#971](https://github.com/Ripple-TS/ripple/pull/971)
  [`30126c7`](https://github.com/Ripple-TS/ripple/commit/30126c753c3a08809bacd07c8cf2eca84e8f8cbb)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Extract early-return
  continuations into typed cached helpers and type generated hook-helper props
  from branch-local aliases.

- [#986](https://github.com/Ripple-TS/ripple/pull/986)
  [`b8cd7c4`](https://github.com/Ripple-TS/ripple/commit/b8cd7c4195505976995033a8e369502996f345ad)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Improve lazy destructuring
  editor support for TSX targets, including typed virtual params, hover display
  rewrites, and loose-mode diagnostics for duplicate lazy parameter names.

- [#986](https://github.com/Ripple-TS/ripple/pull/986)
  [`b8cd7c4`](https://github.com/Ripple-TS/ripple/commit/b8cd7c4195505976995033a8e369502996f345ad)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Improve editor support for
  lazy object params by emitting object-shaped virtual TSX annotations for untyped
  params and preserving source mappings for lazy property reads.

- [#983](https://github.com/Ripple-TS/ripple/pull/983)
  [`3ddb1a9`](https://github.com/Ripple-TS/ripple/commit/3ddb1a92ffeb48a7d47c445b929b982a2b96e123)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse JavaScript statement
  blocks normally inside functions declared within component bodies.

- [#984](https://github.com/Ripple-TS/ripple/pull/984)
  [`fee8620`](https://github.com/Ripple-TS/ripple/commit/fee8620fa4e82a7c7e4adb3e434e9db552a3e157)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve component type
  parameters when lowering generic TSRX components to generated functions.

- [#976](https://github.com/Ripple-TS/ripple/pull/976)
  [`2fcacb4`](https://github.com/Ripple-TS/ripple/commit/2fcacb471d7780074f92b20c9b394f7650a941bb)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve optional markers on
  tuple members and TypeScript function parameters in generated TSX output.

## 0.0.13

### Patch Changes

- [`a9f706d`](https://github.com/Ripple-TS/ripple/commit/a9f706d6626dc1a9e8505d9ea8f16989b2b024b3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix Volar source mappings for
  extracted JSX hook helpers so component-scope declarations keep their inferred
  editor types.

- [#961](https://github.com/Ripple-TS/ripple/pull/961)
  [`3e07109`](https://github.com/Ripple-TS/ripple/commit/3e071098508449158fa11f2ae48c912d4d673b68)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix ArrayPattern source map
  visitor, various type fixes for tests: ripple, vite-plugin-react,
  vite-plugin-solid

- [#963](https://github.com/Ripple-TS/ripple/pull/963)
  [`112cfd9`](https://github.com/Ripple-TS/ripple/commit/112cfd9fbfd4412efea543abc55deceb186cf351)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve JSX spread
  attributes inside explicit `<tsx>` blocks.

## 0.0.12

### Patch Changes

- [#945](https://github.com/Ripple-TS/ripple/pull/945)
  [`ea56fa0`](https://github.com/Ripple-TS/ripple/commit/ea56fa021798afe8621699d11b7e1d9e675cbfb4)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fixes ForOfStatement source
  maps

## 0.0.11

### Patch Changes

- [#938](https://github.com/Ripple-TS/ripple/pull/938)
  [`7529e1f`](https://github.com/Ripple-TS/ripple/commit/7529e1fe3f0870319bd3399501fd2eb43c516065)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix source-map and Volar
  mapping coverage for one-line early-return `if` statements in shared JSX
  transforms, including plain functions and class-like method bodies.

## 0.0.10

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

## 0.0.9

### Patch Changes

- [#931](https://github.com/Ripple-TS/ripple/pull/931)
  [`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Extract JSX-emitting targets
  into a shared `createJsxTransform` factory in `@tsrx/core`; React, Preact, and
  Solid now plug in via a `JsxPlatform` descriptor so source-mapping fixes
  propagate to all three targets.
  - `@tsrx/core` adds the `createJsxTransform` factory, `JsxPlatform` /
    `JsxPlatformHooks` / `JsxTransformResult` types, and a shared test harness at
    `@tsrx/core/test-harness/source-mappings`. The source-map segments walker now
    handles `TSTypePredicate` and uses strict mapping lookups throughout.
  - `compile_to_volar_mappings` no longer crashes on common AST shapes across all
    three targets: `NewExpression`, `ReturnStatement`, `ForStatement` /
    `ForInStatement`, `TemplateLiteral`, `TaggedTemplateExpression`,
    `AwaitExpression`, computed `MemberExpression`, empty / non-empty
    `ObjectExpression`, class methods (including async, get / set, static) and
    object method shorthand, TS generics, type predicates (`x is T` and
    `asserts x is T`), as-expressions, union / array type annotations,
    self-closing JSX, element attribute spread, and `JSXExpressionContainer`
    inside `<tsx>` blocks.
  - `<tsx>` / `<>` single-child unwrapping is now JSX-context-aware:
    `return <tsx>{'x'}</tsx>` compiles to `return 'x';` rather than invalid
    `return {'x'};`, while `<b><>{111}</></b>` still preserves the inner `{111}`
    container.
  - Class methods no longer crash source-map collection (every function-like node
    gets `metadata` defaulted).

- [#931](https://github.com/Ripple-TS/ripple/pull/931)
  [`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix scoped CSS application
  for elements rendered inside `<tsx>...</tsx>` and bare `<>...</>` fragment
  shorthand so they receive the same hash-based classes as regular template
  elements.

## 0.0.8

### Patch Changes

- [#923](https://github.com/Ripple-TS/ripple/pull/923)
  [`4292598`](https://github.com/Ripple-TS/ripple/commit/42925982e88f48f0af6cc74deeaa3c17bc6657cf)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - fix:
  preserve Volar mappings for explicit call type arguments

- [#919](https://github.com/Ripple-TS/ripple/pull/919)
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow bare `<>...</>` fragments
  everywhere TSRX accepts `<tsx>...</tsx>`, including template bodies and
  expression position. The shorthand now compiles across Ripple, React, Preact,
  and Solid targets, while the explicit `<tsx>...</tsx>` form remains supported.

## 0.0.7

### Patch Changes

- [#899](https://github.com/Ripple-TS/ripple/pull/899)
  [`fab49f7`](https://github.com/Ripple-TS/ripple/commit/fab49f7da8ec13c981f1c7b3102703d0c349fc1e)
  Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Lift the JSX
  hoist-safety predicates (`isStaticLiteral`, `isHoistSafeExpression`,
  `isHoistSafeJsxChild`, `isHoistSafeJsxAttribute`, `isHoistSafeJsxNode`) into
  `@tsrx/core`. `@tsrx/react` and `@tsrx/preact` now share a single
  implementation, so future targets (and bug fixes) no longer need to duplicate
  the logic.

## 0.0.6

### Patch Changes

- [#906](https://github.com/Ripple-TS/ripple/pull/906)
  [`e9da9cb`](https://github.com/Ripple-TS/ripple/commit/e9da9cbdd42c28f129ee643366c06f8779b8f931)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix parser handling of
  line-start `<` comparisons inside template statement element children so they
  are not misparsed as JSX tags.

## 0.0.5

### Patch Changes

- [#893](https://github.com/Ripple-TS/ripple/pull/893)
  [`d027c6c`](https://github.com/Ripple-TS/ripple/commit/d027c6c84fd3ba7c577c52b9fdade77e7ff886e0)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix parser crash when a JS
  statement inside an element template body has no trailing whitespace before the
  closing tag (e.g. `<ul>var a = "123"</ul>`). The tokenizer previously misread
  `</` as a less-than operator followed by a regexp.

## 0.0.4

### Patch Changes

- [`7f98c10`](https://github.com/Ripple-TS/ripple/commit/7f98c1039f52a56135672b0f9b476af280c81f03)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Test CI release

## 0.0.3

### Patch Changes

- [`030ff45`](https://github.com/Ripple-TS/ripple/commit/030ff45bc3020cd1b6e1a914fc58af7c8a0e5af1)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Test auto publishing on CI

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

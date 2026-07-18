# ripple

## 0.3.99

### Patch Changes

- Updated dependencies
  [[`5f5726d`](https://github.com/Ripple-TS/ripple/commit/5f5726d164926f480454143895bf035c9c30929b)]:
  - @tsrx/core@0.1.41
  - @tsrx/ripple@0.1.42

## 0.3.98

## 0.3.97

### Patch Changes

- Updated dependencies
  [[`586c6df`](https://github.com/Ripple-TS/ripple/commit/586c6df1dfe52f098d6b48fd94414f69d5e2020d)]:
  - @tsrx/core@0.1.40
  - @tsrx/ripple@0.1.41

## 0.3.96

### Patch Changes

- Updated dependencies
  [[`09efc09`](https://github.com/Ripple-TS/ripple/commit/09efc09d5149b8ffe9b6334c48ea6b2b4a1795dc)]:
  - @tsrx/core@0.1.39
  - @tsrx/ripple@0.1.40

## 0.3.95

## 0.3.94

### Patch Changes

- Updated dependencies
  [[`78502e4`](https://github.com/Ripple-TS/ripple/commit/78502e46929df2165d288dbb2483f48e9254ef35)]:
  - @tsrx/core@0.1.38
  - @tsrx/ripple@0.1.39

## 0.3.93

### Patch Changes

- [`9db5a49`](https://github.com/Ripple-TS/ripple/commit/9db5a49e45c2eb3bb4f6b46c65c0aaf9016633ad)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Rename the `ripple/server`
  helper exports to camelCase: `create_ssr_stream` is now `createStream` and
  `get_css_for_hashes` is now `getCss` (returning the CSS text for the scoped
  style hashes collected by `render()`). The old snake_case exports are removed;
  update imports accordingly. The vite plugin consumes the new names internally.

## 0.3.92

### Patch Changes

- [#1326](https://github.com/Ripple-TS/ripple/pull/1326)
  [`fea49bf`](https://github.com/Ripple-TS/ripple/commit/fea49bfb4410a05e0c915dfa39acdaba7f542737)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Streaming SSR:
  `render(App, { stream })` now streams progressively. The synchronous shell (with
  pending fallbacks for suspended `@try` boundaries and all CSS registered so far)
  is flushed immediately; each boundary's content streams out of order as a framed
  chunk once its async work settles, including per-chunk CSS, trackAsync envelopes
  and `<head>` content. A tiny inline runtime swaps chunks into their slots before
  hydration, and hydrated boundaries activate streamed chunks in place afterwards
  — claiming the streamed DOM without re-rendering. Catch-only async boundaries
  stream an empty slot and resolve to their body or server-rendered catch; errors
  whose catch region is already on the wire hand off to the client boundary via an
  error envelope. `render` also gains a `streamTemplate` option for document
  scaffolding, and the vite plugin streams render-route responses when
  `ssr.streaming` is enabled in ripple.config.ts (falling back to buffered SSR
  when index.html lacks the `<!--ssr-head-->`/`<!--ssr-body-->` markers).

## 0.3.91

### Patch Changes

- Updated dependencies
  [[`a109586`](https://github.com/Ripple-TS/ripple/commit/a109586774227b4026ffbd813a956e231edb1005)]:
  - @tsrx/core@0.1.37
  - @tsrx/ripple@0.1.38

## 0.3.90

### Patch Changes

- [#1324](https://github.com/Ripple-TS/ripple/pull/1324)
  [`1925074`](https://github.com/Ripple-TS/ripple/commit/1925074254de0e61c8578cba136c50ea8f89cd35)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Minor adjustments from
  @tsrx/ripple moving to the parser ast vs its own version

- Updated dependencies
  [[`1925074`](https://github.com/Ripple-TS/ripple/commit/1925074254de0e61c8578cba136c50ea8f89cd35),
  [`1925074`](https://github.com/Ripple-TS/ripple/commit/1925074254de0e61c8578cba136c50ea8f89cd35)]:
  - @tsrx/core@0.1.36
  - @tsrx/ripple@0.1.37

## 0.3.89

### Patch Changes

- Updated dependencies
  [[`51eed86`](https://github.com/Ripple-TS/ripple/commit/51eed869b7ea26b5554893c9f8dd363f2d2121bc)]:
  - @tsrx/core@0.1.35
  - @tsrx/ripple@0.1.36

## 0.3.88

## 0.3.87

### Patch Changes

- Updated dependencies
  [[`cc95ffa`](https://github.com/Ripple-TS/ripple/commit/cc95ffaef3f3d3cd252176ea94308f89739f0212),
  [`6f78b7f`](https://github.com/Ripple-TS/ripple/commit/6f78b7ff5a5e1f9873a839b709f38e9506545a63)]:
  - @tsrx/core@0.1.34
  - @tsrx/ripple@0.1.35

## 0.3.86

### Patch Changes

- [#1310](https://github.com/Ripple-TS/ripple/pull/1310)
  [`4ebd58d`](https://github.com/Ripple-TS/ripple/commit/4ebd58dfe853c1ed945072822eaba8a7a9e19a6c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix
  `Cannot use 'in' operator to search for 'parent' in null` thrown from `append()`
  when reordering or inserting into a keyed `@for` whose item body is a single
  control-flow / component root (e.g. `@for (...; key ...) { <Card {item} /> }`
  where `Card`'s own body is a single `@if`/`@for`/component). The 0.3.85
  wrapper-anchor optimization leaves such an item block's `s.start` null because
  its DOM is rendered through a descendant block, and keyed reconciliation read
  `s.start` directly as the insertion anchor. Reconciliation now resolves the real
  first/last DOM node by descending child blocks, so no `<!>` comment marker is
  reintroduced and the optimization's reduced DOM-mutation cost is preserved. The
  same resolution is applied to `@switch` case reordering.
- Updated dependencies
  [[`e4e6d7b`](https://github.com/Ripple-TS/ripple/commit/e4e6d7b854786ad19a2c86276ea7e0ffb062e61a)]:
  - @tsrx/ripple@0.1.34

## 0.3.85

### Patch Changes

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

- [#1307](https://github.com/Ripple-TS/ripple/pull/1307)
  [`f55466b`](https://github.com/Ripple-TS/ripple/commit/f55466bde65d0cff00c0c4525af9d68ae794ffd2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Scope the client flush
  traversal to the updated subtree. Previously every flush walked the whole root
  block tree to find dirty subscribers, so a deeply-scoped update (e.g. mutating
  state read by only a small subtree) paid a cost proportional to the entire tree
  rather than the affected branch. `flush_updates` now descends only along the
  routing path to each directly-scheduled block and fully scans just that block's
  subtree, where its subscribers live. A tracked read from outside its owner's
  subtree (e.g. smuggled across sibling subtrees via a module-level variable) is
  detected in `register_dependency` and transparently falls back to the original
  full-tree scan, so behavior is unchanged.

- Updated dependencies
  [[`ba498cd`](https://github.com/Ripple-TS/ripple/commit/ba498cde76e9f83235ce91da825f403a28441bff),
  [`313b351`](https://github.com/Ripple-TS/ripple/commit/313b3513e4a959dd80b546da41c798066c5ccb0f),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`bbe6e74`](https://github.com/Ripple-TS/ripple/commit/bbe6e7422c690558f0dfcb3abe5452d4f4cdde91),
  [`0e9f523`](https://github.com/Ripple-TS/ripple/commit/0e9f52358a615c2fc7759544e96c43dccb533c86),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`2b65285`](https://github.com/Ripple-TS/ripple/commit/2b65285bfcd4c6a0aa93d7fa0b25082e6ec74e1f),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`f55466b`](https://github.com/Ripple-TS/ripple/commit/f55466bde65d0cff00c0c4525af9d68ae794ffd2),
  [`b887deb`](https://github.com/Ripple-TS/ripple/commit/b887debf5f47e63d73184ac218ec8b3542a5e21c),
  [`3668c5f`](https://github.com/Ripple-TS/ripple/commit/3668c5fe9cdaca4862707d653d23af94780f42af),
  [`bbc3843`](https://github.com/Ripple-TS/ripple/commit/bbc384387e33c538234be36c07cc4b30ef6ce136)]:
  - @tsrx/ripple@0.1.33
  - @tsrx/core@0.1.33

## 0.3.84

### Patch Changes

- [`a5d1860`](https://github.com/Ripple-TS/ripple/commit/a5d18603beac4b15e99f9d23f4d0b18b67ffe413)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Adds snapshot() api for
  non-reactive shallow copies of RippleArray and RippleObject
- Updated dependencies
  [[`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432),
  [`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432)]:
  - @tsrx/core@0.1.32
  - @tsrx/ripple@0.1.32

## 0.3.83

### Patch Changes

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
  [[`3d93339`](https://github.com/Ripple-TS/ripple/commit/3d93339e851818b547c43c29c8965700c069b037),
  [`5646eb4`](https://github.com/Ripple-TS/ripple/commit/5646eb4e4c101b34100acf30ea57ad4065a47720),
  [`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e),
  [`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e)]:
  - @tsrx/ripple@0.1.31
  - @tsrx/core@0.1.31

## 0.3.82

### Patch Changes

- [`67f3794`](https://github.com/Ripple-TS/ripple/commit/67f3794d2f1ffd55dd23a47327d925d9a76a4171)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Accept a component function
  as the `children` prop in `mount()` and `hydrate()`. Compiled component call
  sites normalize `children` via `normalize_children`, but props passed through
  the mount options skipped that step, so a plain component function would be
  rendered as text. The same normalization is now applied to `options.props`,
  which lets bootstrap code hydrate a layout with its page as `children` without
  reaching into runtime internals.
- Updated dependencies
  [[`b104604`](https://github.com/Ripple-TS/ripple/commit/b10460473fec0ee68b4963cbc2a3d9d5bb3bc633)]:
  - @tsrx/core@0.1.30
  - @tsrx/ripple@0.1.30

## 0.3.81

### Patch Changes

- Updated dependencies
  [[`67de047`](https://github.com/Ripple-TS/ripple/commit/67de047d103f39673b25910e1a97760278820999),
  [`3b6fb73`](https://github.com/Ripple-TS/ripple/commit/3b6fb73170d4ad6a383befdda951ce0da4fcbb46),
  [`1c645c8`](https://github.com/Ripple-TS/ripple/commit/1c645c8f854df23bb1271b3402d1885616b525cd),
  [`b1256fd`](https://github.com/Ripple-TS/ripple/commit/b1256fdb5bf279ee7dd20bf1a71dcfccc47e279c)]:
  - @tsrx/core@0.1.29
  - @tsrx/ripple@0.1.29

## 0.3.80

### Patch Changes

- Updated dependencies
  [[`f001849`](https://github.com/Ripple-TS/ripple/commit/f00184940979a77cbf6873a811caaaa436feab46),
  [`4af2591`](https://github.com/Ripple-TS/ripple/commit/4af259139d118a27d177531aa6a21435a3f3a015),
  [`4af2591`](https://github.com/Ripple-TS/ripple/commit/4af259139d118a27d177531aa6a21435a3f3a015),
  [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482),
  [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482),
  [`f1a4c10`](https://github.com/Ripple-TS/ripple/commit/f1a4c10d2ad8ed604375f36f7ae3b653fe95ed1a),
  [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482)]:
  - @tsrx/core@0.1.28
  - @tsrx/ripple@0.1.28

## 0.3.79

### Patch Changes

- Updated dependencies
  [[`60a78c9`](https://github.com/Ripple-TS/ripple/commit/60a78c9def09eed6d706c42bc751d2d051d1d57f)]:
  - @tsrx/core@0.1.27
  - @tsrx/ripple@0.1.27

## 0.3.78

### Patch Changes

- [#1240](https://github.com/Ripple-TS/ripple/pull/1240)
  [`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Render `<{expr}>` dynamic
  tags directly through `_$_.composite` in the client production output instead of
  lowering to the `Dynamic` helper component, and fix hydration of dynamic string
  tags claiming the SSR-rendered element.

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
  [`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9)]:
  - @tsrx/ripple@0.1.26
  - @tsrx/core@0.1.26

## 0.3.77

### Patch Changes

- Updated dependencies
  [[`d14ec84`](https://github.com/Ripple-TS/ripple/commit/d14ec84f26233e514be9e59ffc94e61db5089587),
  [`921fb9c`](https://github.com/Ripple-TS/ripple/commit/921fb9ce6485db41527b631f5236b7abbac74986),
  [`1693c9e`](https://github.com/Ripple-TS/ripple/commit/1693c9e6daf1421e71171fe3c50e37adfc858b69)]:
  - @tsrx/core@0.1.25
  - @tsrx/ripple@0.1.25

## 0.3.76

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
  - @tsrx/ripple@0.1.24

## 0.3.75

### Patch Changes

- Updated dependencies
  [[`9eb4819`](https://github.com/Ripple-TS/ripple/commit/9eb4819cede6da7e93cbcd2bdf284bcb42d40464),
  [`88a254c`](https://github.com/Ripple-TS/ripple/commit/88a254c69953a5ace33bc10047f11052ec598672),
  [`ba3a7f6`](https://github.com/Ripple-TS/ripple/commit/ba3a7f6485ea163e60cc0750a8e8b06b50728009),
  [`ac6f358`](https://github.com/Ripple-TS/ripple/commit/ac6f3582ca0b2814004439c882d6aa735c8afe50),
  [`4c5f992`](https://github.com/Ripple-TS/ripple/commit/4c5f992b9a11e1f26abee476a6add89f959169bc),
  [`78ffa8d`](https://github.com/Ripple-TS/ripple/commit/78ffa8d90fd01e85bf34e5c6adef0e51caae8da7),
  [`16560cb`](https://github.com/Ripple-TS/ripple/commit/16560cb466430bdbe8749d9491bc79e69e58d02c),
  [`186b3b2`](https://github.com/Ripple-TS/ripple/commit/186b3b2557761ff06c9056bf2e0b7ab8c7692477),
  [`4be6e54`](https://github.com/Ripple-TS/ripple/commit/4be6e54bbfee20927adca473648a94aa173d7d77),
  [`2b67f83`](https://github.com/Ripple-TS/ripple/commit/2b67f83d7ed7eab7a39bc33524fcf73f737d977e),
  [`9918c52`](https://github.com/Ripple-TS/ripple/commit/9918c52e954f2b8e1a994892e7c555e8277f2d59),
  [`e8493be`](https://github.com/Ripple-TS/ripple/commit/e8493be0b3489f402105297251e1919c103c2360),
  [`c424675`](https://github.com/Ripple-TS/ripple/commit/c424675102a9edd4f1e356fb6db30124a9c2d885)]:
  - @tsrx/core@0.1.23
  - @tsrx/ripple@0.1.23

## 0.3.74

### Patch Changes

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Expose Ripple's `RefValue` type
  from the shared TSRX ref runtime declarations.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `@empty { ... }` fallbacks
  for TSRX `@for` loops, require prefixed template continuation clauses such as
  `@else`, `@empty`, `@pending`, `@catch`, `@case`, and `@default`, and reject
  direct `continue`, `break`, and `return` statements inside `@for` loop bodies
  and `@if` template branches.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow JSX and shared ref helper
  types to accept arrays of ref functions.

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
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)]:
  - @tsrx/ripple@0.1.22
  - @tsrx/core@0.1.22

## 0.3.73

### Patch Changes

- [#1198](https://github.com/Ripple-TS/ripple/pull/1198)
  [`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the unused namespaced
  TSX island feature and React bridge package.

- Updated dependencies
  [[`e738e11`](https://github.com/Ripple-TS/ripple/commit/e738e1153694f56f35cfcab8982d897d7199d85a),
  [`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21),
  [`e00f596`](https://github.com/Ripple-TS/ripple/commit/e00f5961d5668c054435c8a366ef2a6da6e4a381)]:
  - @tsrx/ripple@0.1.21
  - @tsrx/core@0.1.21

## 0.3.72

### Patch Changes

- Updated dependencies
  [[`0ea87fb`](https://github.com/Ripple-TS/ripple/commit/0ea87fb3cbef21c3c00d63cc2a1f3c9f34d01c24)]:
  - @tsrx/core@0.1.20
  - @tsrx/ripple@0.1.20

## 0.3.71

### Patch Changes

- Updated dependencies
  [[`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc),
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)]:
  - @tsrx/core@0.1.19
  - @tsrx/ripple@0.1.19

## 0.3.70

### Patch Changes

- Updated dependencies
  [[`5c0b0ff`](https://github.com/Ripple-TS/ripple/commit/5c0b0ff031ddfb319bb048d627e2d2a2a49c1f1d)]:
  - @tsrx/core@0.1.18
  - @tsrx/ripple@0.1.18

## 0.3.69

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
  [[`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549),
  [`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)]:
  - @tsrx/core@0.1.17
  - @tsrx/ripple@0.1.17

## 0.3.68

### Patch Changes

- Updated dependencies
  [[`d045396`](https://github.com/Ripple-TS/ripple/commit/d0453962cfe1df7a98a0981b0bf3e5729195a9ae)]:
  - @tsrx/ripple@0.1.16
  - @tsrx/core@0.1.16

## 0.3.67

### Patch Changes

- Updated dependencies
  [[`ea717f2`](https://github.com/Ripple-TS/ripple/commit/ea717f2ac20901aca59946c1cea8066c28a4220c),
  [`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/core@0.1.15
  - @tsrx/ripple@0.1.15

## 0.3.66

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

- [#1168](https://github.com/Ripple-TS/ripple/pull/1168)
  [`146cbf5`](https://github.com/Ripple-TS/ripple/commit/146cbf58120aad05161d503118a47bdc566ba869)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add global root pending/catch
  boundary support and allow Ripple config routes to reference named entry
  exports.

  Refactor vite-plugin to keep code generation in one place, produce cache as
  necessary and generate actual files for inspection.

- Updated dependencies
  [[`1dc0331`](https://github.com/Ripple-TS/ripple/commit/1dc0331f7b7296545ee459dc31a92057871cbb0d),
  [`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/ripple@0.1.14
  - @tsrx/core@0.1.14

## 0.3.65

### Patch Changes

- Updated dependencies
  [[`95c2976`](https://github.com/Ripple-TS/ripple/commit/95c2976b9ec2c20c4160ad13b636c1ed03e863ef)]:
  - @tsrx/core@0.1.13
  - @tsrx/ripple@0.1.13

## 0.3.64

## 0.3.63

### Patch Changes

- [#1153](https://github.com/Ripple-TS/ripple/pull/1153)
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Parse nested `<tsrx>` islands
  inside `<tsx>` expression containers as native TSRX so setup declarations and
  references keep Volar mappings, and hydrate deeply nested `<tsx>`/`<tsrx>`
  expression values without skipping server markers.

- [#1153](https://github.com/Ripple-TS/ripple/pull/1153)
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Avoid duplicating plain text
  when hydrating mixed TSRX collection values.

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
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04),
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04),
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04),
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)]:
  - @tsrx/core@0.1.12
  - @tsrx/ripple@0.1.12

## 0.3.62

### Patch Changes

- [#1144](https://github.com/Ripple-TS/ripple/pull/1144)
  [`0e8baf2`](https://github.com/Ripple-TS/ripple/commit/0e8baf278e4105ae019929138956938cd5189035)
  Thanks [@aleclarson](https://github.com/aleclarson)! - Remove the stale self
  peer dependency from the Ripple runtime package.

## 0.3.61

### Patch Changes

- Updated dependencies
  [[`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a)]:
  - @tsrx/core@0.1.11
  - ripple@0.3.61
  - @tsrx/ripple@0.1.11

## 0.3.60

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
- Updated dependencies
  [[`8c064c8`](https://github.com/Ripple-TS/ripple/commit/8c064c888b60e4fcf88f6828e51792b3bba5797a)]:
  - @tsrx/core@0.1.10
  - ripple@0.3.60
  - @tsrx/ripple@0.1.10

## 0.3.59

### Patch Changes

- Updated dependencies
  [[`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)]:
  - @tsrx/core@0.1.9
  - ripple@0.3.59
  - @tsrx/ripple@0.1.9

## 0.3.58

### Patch Changes

- [#1130](https://github.com/Ripple-TS/ripple/pull/1130)
  [`0a5f39b`](https://github.com/Ripple-TS/ripple/commit/0a5f39b6e13807dfd3dc1228f40d7bb02b933373)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix client cleanup for
  HMR-wrapped roots that do not own their DOM range directly.

- Updated dependencies
  [[`b54fdfc`](https://github.com/Ripple-TS/ripple/commit/b54fdfc3ebfea29ac613307b76732c5bf5f49ab5),
  [`0a5f39b`](https://github.com/Ripple-TS/ripple/commit/0a5f39b6e13807dfd3dc1228f40d7bb02b933373),
  [`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/core@0.1.8
  - ripple@0.3.58
  - @tsrx/ripple@0.1.8

## 0.3.57

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
- Updated dependencies
  [[`2b1f746`](https://github.com/Ripple-TS/ripple/commit/2b1f7469ab31713140a5baf912a19fa8eedb9234),
  [`e4a04dd`](https://github.com/Ripple-TS/ripple/commit/e4a04ddb4bbc8e21a9c7c2c65b179d764b72e4fb)]:
  - @tsrx/core@0.1.7
  - ripple@0.3.57
  - @tsrx/ripple@0.1.7

## 0.3.56

### Patch Changes

- Updated dependencies
  [[`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)]:
  - @tsrx/core@0.1.6
  - ripple@0.3.56
  - @tsrx/ripple@0.1.6

## 0.3.55

### Patch Changes

- Updated dependencies
  [[`de27e18`](https://github.com/Ripple-TS/ripple/commit/de27e182d002ea736aee992acca4cbf9873a307d),
  [`59e1e32`](https://github.com/Ripple-TS/ripple/commit/59e1e328607598fe342abbba35f76e5fadb9ca5c),
  [`1256569`](https://github.com/Ripple-TS/ripple/commit/12565695efaa3a4ad429245807721ea671c2ecb5),
  [`1256569`](https://github.com/Ripple-TS/ripple/commit/12565695efaa3a4ad429245807721ea671c2ecb5),
  [`18b4aef`](https://github.com/Ripple-TS/ripple/commit/18b4aefa8127e56a9f1b3058da2d4d2172551579)]:
  - @tsrx/core@0.1.5
  - ripple@0.3.55
  - @tsrx/ripple@0.1.5

## 0.3.54

### Patch Changes

- Updated dependencies
  [[`3e84758`](https://github.com/Ripple-TS/ripple/commit/3e847588027d6254c3999a87c717e9d58fb55a26),
  [`3e84758`](https://github.com/Ripple-TS/ripple/commit/3e847588027d6254c3999a87c717e9d58fb55a26),
  [`509170b`](https://github.com/Ripple-TS/ripple/commit/509170ba3cecc611ba1798575c70555070665736)]:
  - @tsrx/core@0.1.4
  - ripple@0.3.54
  - @tsrx/ripple@0.1.4

## 0.3.53

### Patch Changes

- Updated dependencies
  [[`5a59d73`](https://github.com/Ripple-TS/ripple/commit/5a59d73daf60b2652c86ffad2a4eaf3d801e40d7),
  [`4f360f0`](https://github.com/Ripple-TS/ripple/commit/4f360f008edf61492cf85afa646c797c80a73f22),
  [`c042672`](https://github.com/Ripple-TS/ripple/commit/c04267255d35945753ca8090006622c96fa0a14f),
  [`a9d640f`](https://github.com/Ripple-TS/ripple/commit/a9d640f0728996b3f21b452ffe6040e54d82609c),
  [`5a59d73`](https://github.com/Ripple-TS/ripple/commit/5a59d73daf60b2652c86ffad2a4eaf3d801e40d7),
  [`2ae792c`](https://github.com/Ripple-TS/ripple/commit/2ae792cdca7d466e552a330ea965cefec2b1f5a5),
  [`96360f3`](https://github.com/Ripple-TS/ripple/commit/96360f36306180e67ce69e464dd545773e57e8b1)]:
  - @tsrx/core@0.1.3
  - @tsrx/ripple@0.1.3
  - ripple@0.3.53

## 0.3.52

### Patch Changes

- Updated dependencies
  [[`2010290`](https://github.com/Ripple-TS/ripple/commit/20102904d68951b47dce3958f88ddd1fc150e7a1)]:
  - @tsrx/core@0.1.2
  - ripple@0.3.52
  - @tsrx/ripple@0.1.2

## 0.3.51

### Patch Changes

- [`f1b1f94`](https://github.com/Ripple-TS/ripple/commit/f1b1f9475553cbe3632a5cc9794a8f54615c29f2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Patch packages currently
  versioned at 0.3.50 to fix the bump that caused major 1.0.0 release with a minor
  changeset.

- Updated dependencies
  [[`0fdf340`](https://github.com/Ripple-TS/ripple/commit/0fdf3408417a7565a00304b766e958b438b3c834),
  [`f1b1f94`](https://github.com/Ripple-TS/ripple/commit/f1b1f9475553cbe3632a5cc9794a8f54615c29f2)]:
  - @tsrx/core@0.1.1
  - ripple@0.3.51
  - @tsrx/ripple@0.1.1

## 0.3.50

### Patch Changes

- Updated dependencies
  [[`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)]:
  - @tsrx/core@0.1.0
  - @tsrx/ripple@0.1.0
  - ripple@0.3.50

## 0.3.49

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
  - ripple@0.3.49
  - @tsrx/core@0.0.28
  - @tsrx/ripple@0.0.30

## 0.3.48

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.48

## 0.3.47

### Patch Changes

- [#1063](https://github.com/Ripple-TS/ripple/pull/1063)
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Standardizes compile api
  across all packages, including forcing types to adhere to the standard. Adds
  more debug compile options to the playgrounds.
- Updated dependencies
  [[`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6),
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b),
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)]:
  - @tsrx/ripple@0.0.29
  - ripple@0.3.47

## 0.3.46

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.46
  - @tsrx/ripple@0.0.28

## 0.3.45

### Patch Changes

- [#1047](https://github.com/Ripple-TS/ripple/pull/1047)
  [`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Removes duplicate utils,
  moves most utils to @tsrx/core, include their tests.

  Fixes some types

- Updated dependencies
  [[`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)]:
  - @tsrx/ripple@0.0.27
  - ripple@0.3.45

## 0.3.44

### Patch Changes

- Updated dependencies
  [[`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)]:
  - @tsrx/ripple@0.0.26
  - ripple@0.3.44

## 0.3.43

### Patch Changes

- Updated dependencies
  [[`5c6ee71`](https://github.com/Ripple-TS/ripple/commit/5c6ee71bfd4f5dc443c43eb34e631bb032606faf),
  [`83b19fd`](https://github.com/Ripple-TS/ripple/commit/83b19fd67aa27eb10e93205dd88c61b13ffbc523)]:
  - @tsrx/ripple@0.0.25
  - ripple@0.3.43

## 0.3.42

### Patch Changes

- Updated dependencies
  [[`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)]:
  - @tsrx/ripple@0.0.24
  - ripple@0.3.42

## 0.3.41

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.41
  - @tsrx/ripple@0.0.23

## 0.3.40

### Patch Changes

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/ripple@0.0.22
  - ripple@0.3.40

## 0.3.39

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.39
  - @tsrx/ripple@0.0.21

## 0.3.38

### Patch Changes

- [#1007](https://github.com/Ripple-TS/ripple/pull/1007)
  [`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7)
  Thanks [@trueadm](https://github.com/trueadm)! - Keep double-quoted JavaScript
  strings inside TSRX expression containers using normal JavaScript string
  semantics while preserving direct double-quoted text child parsing.

- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7)]:
  - @tsrx/ripple@0.0.20
  - ripple@0.3.38

## 0.3.37

### Patch Changes

- [#1002](https://github.com/Ripple-TS/ripple/pull/1002)
  [`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)
  Thanks [@trueadm](https://github.com/trueadm)! - Align direct double-quoted TSRX
  text children with quoted JSX attribute text by decoding character references
  and treating backslashes as literal text. Preserve the direct quoted form in the
  Prettier plugin and highlight it as JSX text in the TextMate grammar.

- Updated dependencies
  [[`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)]:
  - @tsrx/ripple@0.0.19
  - ripple@0.3.37

## 0.3.36

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.36
  - @tsrx/ripple@0.0.18

## 0.3.35

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.35
  - @tsrx/ripple@0.0.17

## 0.3.34

### Patch Changes

- Updated dependencies
  [[`fee8620`](https://github.com/Ripple-TS/ripple/commit/fee8620fa4e82a7c7e4adb3e434e9db552a3e157),
  [`2fcacb4`](https://github.com/Ripple-TS/ripple/commit/2fcacb471d7780074f92b20c9b394f7650a941bb)]:
  - @tsrx/ripple@0.0.16
  - ripple@0.3.34

## 0.3.33

### Patch Changes

- [#961](https://github.com/Ripple-TS/ripple/pull/961)
  [`3e07109`](https://github.com/Ripple-TS/ripple/commit/3e071098508449158fa11f2ae48c912d4d673b68)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix ArrayPattern source map
  visitor, various type fixes for tests: ripple, vite-plugin-react,
  vite-plugin-solid
- Updated dependencies
  [[`3e07109`](https://github.com/Ripple-TS/ripple/commit/3e071098508449158fa11f2ae48c912d4d673b68)]:
  - ripple@0.3.33
  - @tsrx/ripple@0.0.15

## 0.3.32

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.32
  - @tsrx/ripple@0.0.14

## 0.3.31

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.31
  - @tsrx/ripple@0.0.13

## 0.3.30

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
  - @tsrx/ripple@0.0.12
  - ripple@0.3.30

## 0.3.29

### Patch Changes

- Updated dependencies
  [[`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)]:
  - @tsrx/ripple@0.0.11
  - ripple@0.3.29

## 0.3.28

### Patch Changes

- Updated dependencies
  [[`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8),
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)]:
  - @tsrx/ripple@0.0.10
  - ripple@0.3.28

## 0.3.27

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.27

## 0.3.26

### Patch Changes

- [`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Correct package versions.

- Updated dependencies
  [[`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)]:
  - ripple@0.3.26
  - @tsrx/ripple@0.0.9

## 1.0.1

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
- Updated dependencies
  [[`316cba1`](https://github.com/Ripple-TS/ripple/commit/316cba18614e5ef59dce15e0de6e720eb922955f)]:
  - ripple@1.0.1
  - @tsrx/ripple@0.0.8

## 1.0.0

### Patch Changes

- Updated dependencies []:
  - ripple@1.0.0
  - @tsrx/ripple@0.0.7

## 0.3.25

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.25

## 0.3.24

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.24

## 0.3.23

### Patch Changes

- Updated dependencies
  [[`73ceaac`](https://github.com/Ripple-TS/ripple/commit/73ceaacd029fb634a62252abdda59ab5f2bec15d)]:
  - @tsrx/ripple@0.0.6
  - ripple@0.3.23

## 0.3.22

### Patch Changes

- [`bc8a6ed`](https://github.com/Ripple-TS/ripple/commit/bc8a6ed53d451da90cb6eb6ff9ec564f6f0cabe8)
  Thanks [@trueadm](https://github.com/trueadm)! - Restore the `ripple/compiler`
  subpath export. The compiler was moved into `@tsrx/ripple` during the
  Ripple/TSRX split, which accidentally dropped `ripple/compiler` from the
  published `exports` map — breaking downstream tooling that imports the compiler
  by the public path, including `livecodes` and any playground served through
  `esm.sh`. The path now re-exports the `@tsrx/ripple` API (`compile`, `parse`,
  `compile_to_volar_mappings`, and the shared types), and `@tsrx/ripple` is
  promoted to a runtime dependency so the re-export resolves for installed
  consumers.
- Updated dependencies
  [[`bc8a6ed`](https://github.com/Ripple-TS/ripple/commit/bc8a6ed53d451da90cb6eb6ff9ec564f6f0cabe8)]:
  - ripple@0.3.22

## 0.3.21

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.21

## 0.3.20

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.20

## 0.3.19

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.19

## 0.3.18

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.18

## 0.3.17

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.17

## 0.3.16

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.16

## 0.3.15

### Patch Changes

- [`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix children prop precedence
  when invoking components so that template children always win over an explicit
  `children=` attribute, while still respecting JSX-like ordering between explicit
  props and spreads when no template children are present.

- Updated dependencies
  [[`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)]:
  - ripple@0.3.15

## 0.3.14

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
  - ripple@0.3.14

## 0.3.13

### Patch Changes

- [#842](https://github.com/Ripple-TS/ripple/pull/842)
  [`4eb4d68`](https://github.com/Ripple-TS/ripple/commit/4eb4d6851573d771d65f1e85b1b442ad3cdc53d2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - fix(server): inject SSR web
  stream sinks instead of creating node streams

- [#862](https://github.com/Ripple-TS/ripple/pull/862)
  [`48af856`](https://github.com/Ripple-TS/ripple/commit/48af85678d5e1b32bb1c5e3fbb2fb07498bc88a3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add a release changeset for
  the async tracking work introduced in commit
  `4eb4d6851573d771d65f1e85b1b442ad3cdc53d2`.

  This ships async tracking as a first-class feature in Ripple:
  - remove and prohibit direct component-level `await`; async component flows now
    require using `trackAsync()` (with `trackPending()` for pending state checks)
  - add `trackAsync()` and `trackPending()` support so async values can be read
    through Ripple's reactive runtime using tracked async values
  - update compiler/runtime behavior for `try`/`catch`/`pending` boundaries so
    async pending and error states can render and recover correctly in client and
    SSR paths
  - align `@ripple-ts/compat-react` async boundary behavior with the new Ripple
    async tracking semantics
  - update editor/tooling integration to match the new async syntax/runtime shape

- [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `.rsrx` support across
  Ripple tooling and rename the repository's tracked `.ripple` modules to `.rsrx`.
- Updated dependencies
  [[`4eb4d68`](https://github.com/Ripple-TS/ripple/commit/4eb4d6851573d771d65f1e85b1b442ad3cdc53d2),
  [`48af856`](https://github.com/Ripple-TS/ripple/commit/48af85678d5e1b32bb1c5e3fbb2fb07498bc88a3),
  [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)]:
  - ripple@0.3.13

## 0.3.12

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.12

## 0.3.11

### Patch Changes

- [#853](https://github.com/Ripple-TS/ripple/pull/853)
  [`6792c70`](https://github.com/Ripple-TS/ripple/commit/6792c700db30ec0c25077bf8892753f18eddc5cc)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! -
  fix(compiler): add `throw` statement support in `if` blocks

- [#858](https://github.com/Ripple-TS/ripple/pull/858)
  [`f2624a6`](https://github.com/Ripple-TS/ripple/commit/f2624a6596479480c47317ea3030863214a6e2b3)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - fix: scoped
  styles apply correctly when child content is rendered through a parent component

- [#840](https://github.com/Ripple-TS/ripple/pull/840)
  [`13323dd`](https://github.com/Ripple-TS/ripple/commit/13323dddbcb68e1e8e373142884a7c54fbb76cd7)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the `compat` option from
  `mount()` and `hydrate()`, and stop exporting the old public compat types from
  `ripple`. Compat integrations are now expected to be provided by the Vite plugin
  via `ripple.config.ts`, while direct runtime tests can seed the generated global
  compat registry.

  Also add the `reactCompat()` config-facing helper from `@ripple-ts/compat-react`
  for use in `ripple.config.ts`.

- Updated dependencies
  [[`6792c70`](https://github.com/Ripple-TS/ripple/commit/6792c700db30ec0c25077bf8892753f18eddc5cc),
  [`f2624a6`](https://github.com/Ripple-TS/ripple/commit/f2624a6596479480c47317ea3030863214a6e2b3),
  [`13323dd`](https://github.com/Ripple-TS/ripple/commit/13323dddbcb68e1e8e373142884a7c54fbb76cd7)]:
  - ripple@0.3.11

## 0.3.10

### Patch Changes

- [`aef1253`](https://github.com/Ripple-TS/ripple/commit/aef1253dd79c067a8358172d502dc21d8a9a9085)
  Thanks [@trueadm](https://github.com/trueadm)! - Replace `<children />` with
  `{children}` expression syntax for rendering component children

- Updated dependencies
  [[`aef1253`](https://github.com/Ripple-TS/ripple/commit/aef1253dd79c067a8358172d502dc21d8a9a9085)]:
  - ripple@0.3.10

## 0.3.9

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.9

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.8

## 0.3.7

### Patch Changes

- [#832](https://github.com/Ripple-TS/ripple/pull/832)
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix lazy array rest
  destructuring for tracked and array-like values by routing rest extraction
  through a shared `array_slice` helper instead of calling `.slice()` directly on
  the source.

- [#832](https://github.com/Ripple-TS/ripple/pull/832)
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow tracked tuple `.length`
  member access in compiler analysis and simplify tracked direct-access validation
  into a single combined condition.

- [#832](https://github.com/Ripple-TS/ripple/pull/832)
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix `to_ts` output for lazy
  array destructuring so it keeps direct destructuring syntax for `track()` and
  `trackSplit()` instead of expanding through an intermediate `lazy` variable.

- [#832](https://github.com/Ripple-TS/ripple/pull/832)
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117)
  Thanks [@trueadm](https://github.com/trueadm)! - Replace tracked `get()`/`set()`
  APIs with a `value` getter/setter across runtime, types, analyzer tracked-access
  rules, and lazy destructuring tests.

- Updated dependencies
  [[`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117)]:
  - ripple@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.6

## 0.3.5

### Patch Changes

- [#827](https://github.com/Ripple-TS/ripple/pull/827)
  [`218a72c`](https://github.com/Ripple-TS/ripple/commit/218a72c3e663910636eec1d065c58afe30813c84)
  Thanks [@trueadm](https://github.com/trueadm)! - fix(compiler): handle
  UpdateExpression on lazy bindings with default values

  Update expressions (`++`/`--`) on lazy destructured bindings with default values
  now work correctly. For postfix operations (`count++`), an IIFE captures the
  fallback value before incrementing. Also added `fallback` function to server
  runtime.

- Updated dependencies
  [[`218a72c`](https://github.com/Ripple-TS/ripple/commit/218a72c3e663910636eec1d065c58afe30813c84)]:
  - ripple@0.3.5

## 0.3.4

### Patch Changes

- [`92982cd`](https://github.com/Ripple-TS/ripple/commit/92982cd7b918d0afee9334c74765573b30c8a645)
  Thanks [@trueadm](https://github.com/trueadm)! - feat(compiler): add lazy
  destructuring syntax (`&{...}` and `&[...]`)

  Lazy destructuring defers property/index access until the binding is read,
  preserving reactivity for destructured props. Works with default values,
  compound assignment operators, and update expressions.

- [#814](https://github.com/Ripple-TS/ripple/pull/814)
  [`747ae1f`](https://github.com/Ripple-TS/ripple/commit/747ae1fc7948e994eeb521f3ed78711c9dd3e802)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! -
  fix(compiler): strip TypeScript class syntax from JS output

  This fixes compiler output for `.ripple` classes by stripping TypeScript-only
  `implements` clauses and `extends` type arguments from emitted JavaScript.

- [#820](https://github.com/Ripple-TS/ripple/pull/820)
  [`abe1caa`](https://github.com/Ripple-TS/ripple/commit/abe1caa6ab636722099a6ecd4cafbf117d208ec2)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - fix: sync
  `<select>` `bindValue` with typed and dynamic options

- [#817](https://github.com/Ripple-TS/ripple/pull/817)
  [`046d0ba`](https://github.com/Ripple-TS/ripple/commit/046d0baf190d161c3b851799080d11eb4f95e094)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! -
  fix(compiler): preserve class `extends` generics in volar output

- [`79a920e`](https://github.com/Ripple-TS/ripple/commit/79a920e30f0f35f2ec07ff8d52dc709f8bb74c77)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove `#ripple` namespace
  syntax in favor of direct imports from `'ripple'`

  The `#ripple` namespace (`#ripple.track()`, `#ripple.effect()`,
  `#ripple.array()`, etc.) has been removed. All reactive APIs are now accessed
  via standard imports:

  ```ripple
  import {
    track,
    effect,
    untrack,
    Context,
    RippleArray,
    RippleObject,
  } from 'ripple';
  ```

  - `#ripple.track(value)` → `track(value)`
  - `#ripple.effect(fn)` → `effect(fn)`
  - `#ripple.untrack(fn)` → `untrack(fn)`
  - `#ripple.context(value)` → `new Context(value)`
  - `#ripple[1, 2, 3]` → `new RippleArray(1, 2, 3)`
  - `#ripple{ key: value }` → `new RippleObject({ key: value })`
  - `#ripple.style` → `#style`
  - `#ripple.server` → `#server`

- [#824](https://github.com/Ripple-TS/ripple/pull/824)
  [`83807a4`](https://github.com/Ripple-TS/ripple/commit/83807a412603ff49c398f9365b011fd4b4a5f8bf)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! -
  fix(parser): avoid hanging on unclosed tsx compat tags

- Updated dependencies
  [[`92982cd`](https://github.com/Ripple-TS/ripple/commit/92982cd7b918d0afee9334c74765573b30c8a645),
  [`747ae1f`](https://github.com/Ripple-TS/ripple/commit/747ae1fc7948e994eeb521f3ed78711c9dd3e802),
  [`abe1caa`](https://github.com/Ripple-TS/ripple/commit/abe1caa6ab636722099a6ecd4cafbf117d208ec2),
  [`046d0ba`](https://github.com/Ripple-TS/ripple/commit/046d0baf190d161c3b851799080d11eb4f95e094),
  [`79a920e`](https://github.com/Ripple-TS/ripple/commit/79a920e30f0f35f2ec07ff8d52dc709f8bb74c77),
  [`83807a4`](https://github.com/Ripple-TS/ripple/commit/83807a412603ff49c398f9365b011fd4b4a5f8bf)]:
  - ripple@0.3.4

## 0.3.3

### Patch Changes

- [#804](https://github.com/Ripple-TS/ripple/pull/804)
  [`cd1073f`](https://github.com/Ripple-TS/ripple/commit/cd1073f7cc8085c8b200ada4faf77b2c35b10c6c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Editor support for
  #ripple.server

- Updated dependencies
  [[`cd1073f`](https://github.com/Ripple-TS/ripple/commit/cd1073f7cc8085c8b200ada4faf77b2c35b10c6c)]:
  - ripple@0.3.3

## 0.3.2

### Patch Changes

- [#802](https://github.com/Ripple-TS/ripple/pull/802)
  [`42524c9`](https://github.com/Ripple-TS/ripple/commit/42524c9551b1950d7f7a0336ce396fc312b6fe51)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Editor support for
  #ripple.style

- Updated dependencies
  [[`42524c9`](https://github.com/Ripple-TS/ripple/commit/42524c9551b1950d7f7a0336ce396fc312b6fe51)]:
  - ripple@0.3.2

## 0.3.1

### Patch Changes

- [#799](https://github.com/Ripple-TS/ripple/pull/799)
  [`87c2078`](https://github.com/Ripple-TS/ripple/commit/87c20780f6f6f7339cf94b9a9d08e028533df0a2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix imports for removed
  functions

- Updated dependencies
  [[`87c2078`](https://github.com/Ripple-TS/ripple/commit/87c20780f6f6f7339cf94b9a9d08e028533df0a2)]:
  - ripple@0.3.1

## 0.3.0

### Minor Changes

- [#779](https://github.com/Ripple-TS/ripple/pull/779)
  [`74a10cc`](https://github.com/Ripple-TS/ripple/commit/74a10cc5701962cd7c72b144d59b35ecb76263a3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Introduces #ripple namespace
  for creating ripple reactive entities without imports, such as array, object,
  map, set, date, url, urlSearchParams, mediaQuery. Adds track, untrack,
  trackSplit, effect, context, server, style to the namespace. Deprecates #[] and
  #{} in favor of #ripple[] and #ripple{}. Renames types and actual reactive
  imports for TrackedX entities, such as TrackedArray, TrackedObject, etc. into
  RippleArray, RippleObjec, etc.

### Patch Changes

- [#786](https://github.com/Ripple-TS/ripple/pull/786)
  [`61271cb`](https://github.com/Ripple-TS/ripple/commit/61271cb1c4777f2ab9093c6c89a5ad771ec98b7d)
  Thanks [@anubra266](https://github.com/anubra266)! - fix: preserve generic type
  arguments in interface extends clauses for `compile_to_volar_mappings`

- [#772](https://github.com/Ripple-TS/ripple/pull/772)
  [`21dd402`](https://github.com/Ripple-TS/ripple/commit/21dd4029d7e027a0706cb133b09530a722feb73d)
  Thanks [@anubra266](https://github.com/anubra266)! - Fix ref handling for
  dynamic elements with reactive spread props to avoid read-only/proxy symbol
  errors and prevent unnecessary ref teardown/recreation.

- [#774](https://github.com/Ripple-TS/ripple/pull/774)
  [`c2dbefe`](https://github.com/Ripple-TS/ripple/commit/c2dbefe5645c0c4f6e0ff4dc00d9c4de81616667)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fixes
  language server type support for nested component call inside a parent
  components that become props and should not be marked as unused by typescript
- Updated dependencies
  [[`61271cb`](https://github.com/Ripple-TS/ripple/commit/61271cb1c4777f2ab9093c6c89a5ad771ec98b7d),
  [`21dd402`](https://github.com/Ripple-TS/ripple/commit/21dd4029d7e027a0706cb133b09530a722feb73d),
  [`c2dbefe`](https://github.com/Ripple-TS/ripple/commit/c2dbefe5645c0c4f6e0ff4dc00d9c4de81616667),
  [`74a10cc`](https://github.com/Ripple-TS/ripple/commit/74a10cc5701962cd7c72b144d59b35ecb76263a3)]:
  - ripple@0.3.0

## 0.2.216

### Patch Changes

- [#757](https://github.com/Ripple-TS/ripple/pull/757)
  [`9fb507d`](https://github.com/Ripple-TS/ripple/commit/9fb507d76af6fd6a5c636af1976d1e03d3e869ac)
  Thanks [@leonidaz](https://github.com/leonidaz)! - fixes compiler error that was
  generating async functions for call expressions inside if conditions when inside
  async context

- [#751](https://github.com/Ripple-TS/ripple/pull/751)
  [`e1de4bb`](https://github.com/Ripple-TS/ripple/commit/e1de4bb9df75342a693cda24d0999a423db05ec4)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix
  HMR "zoom" issue when a Ripple file is changed in the dev server.

  When a layout component contained children with nested `if`/`for` blocks,
  hydration would leave `hydrate_node` pointing deep inside the layout's root
  element (e.g. a HYDRATION_END comment inside `<main>`). The `append()`
  function's `parentNode === dom` check only handled direct children, so it missed
  grandchild/deeper positions and incorrectly updated the branch block's `s.end`
  to that deep internal node.

  This caused two problems on HMR re-render:
  1. `remove_block_dom(s.start, s.end)` removed wrong elements (the deep node was
     treated as a sibling boundary, causing removal of unrelated content including
     the root HYDRATION_END comment).
  2. `target = hydrate_node` (set after the initial render) became `null` or
     pointed outside the component's region, so new content was inserted at the
     wrong DOM location — producing a layout that appeared "zoomed" because it
     rendered outside its CSS container context.

  The fix changes the `parentNode === dom` check to `dom.contains(hydrate_node)`,
  consistent with the `anchor === dom` branch that already used `dom.contains()`.
  This correctly resets `hydrate_node` to `dom`'s sibling level regardless of how
  deeply nested it was inside `dom`.

- [#764](https://github.com/Ripple-TS/ripple/pull/764)
  [`95ea864`](https://github.com/Ripple-TS/ripple/commit/95ea8645b2cb27e2610a4ace4c8fb238c92d441a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fixes syntax color
  highlighting for `pending`

- Updated dependencies
  [[`9fb507d`](https://github.com/Ripple-TS/ripple/commit/9fb507d76af6fd6a5c636af1976d1e03d3e869ac),
  [`e1de4bb`](https://github.com/Ripple-TS/ripple/commit/e1de4bb9df75342a693cda24d0999a423db05ec4),
  [`95ea864`](https://github.com/Ripple-TS/ripple/commit/95ea8645b2cb27e2610a4ace4c8fb238c92d441a)]:
  - ripple@0.2.216

## 0.2.215

### Patch Changes

- [#742](https://github.com/Ripple-TS/ripple/pull/742)
  [`a9ecda4`](https://github.com/Ripple-TS/ripple/commit/a9ecda4e3f29e3b934d9f5ee80d55c059ba36ebe)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix
  catch block not executing when used with pending block in try statements.
  Previously, errors thrown inside async components within
  `try { ... } pending { ... } catch { ... }` blocks were lost as unhandled
  promise rejections. Now errors are properly caught and the catch block is
  rendered. Also fixes the server-side rendering to not include pending content in
  the final output when the async operation resolves or errors.

- [#744](https://github.com/Ripple-TS/ripple/pull/744)
  [`6653c5c`](https://github.com/Ripple-TS/ripple/commit/6653c5cebfbd4dce129906a25686ef9c63dc592a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix compiler analysis
  incorrectly marking untrackable nodes as tracked. `MemberExpression` now only
  enables tracking when the member or its property is actually marked as
  `tracked`, and unconditional tracking side-effects were removed from
  `CallExpression` and `NewExpression` visitors.

  Also fixes the client transform for `TrackedExpression` in TypeScript mode to
  emit a `['#v']` member access (marked as `tracked`) instead of the runtime
  `_$_.get(...)` call, aligning TSX output with tracked-access semantics.

- [#733](https://github.com/Ripple-TS/ripple/pull/733)
  [`307dcf3`](https://github.com/Ripple-TS/ripple/commit/307dcf30f27dae987a19a59508cc2593c839eda3)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix client HMR updates when a
  wrapped component has not mounted yet. The runtime now avoids calling `set()` on
  an undefined tracked source and keeps wrapper HMR state synchronized across
  update chains.
- Updated dependencies
  [[`a9ecda4`](https://github.com/Ripple-TS/ripple/commit/a9ecda4e3f29e3b934d9f5ee80d55c059ba36ebe),
  [`6653c5c`](https://github.com/Ripple-TS/ripple/commit/6653c5cebfbd4dce129906a25686ef9c63dc592a),
  [`307dcf3`](https://github.com/Ripple-TS/ripple/commit/307dcf30f27dae987a19a59508cc2593c839eda3)]:
  - ripple@0.2.215

## 0.2.214

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.214

## 0.2.213

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.213

## 0.2.212

### Patch Changes

- Fix hydration error when component is last sibling - added `hydrate_advance()`
  to safely advance hydration position at end of component content without
  throwing when no next sibling exists

- Updated dependencies []:
  - ripple@0.2.212

## 0.2.211

### Patch Changes

- [#694](https://github.com/Ripple-TS/ripple/pull/694)
  [`fa285f4`](https://github.com/Ripple-TS/ripple/commit/fa285f441ab8d748c3dfea6adb463e3ca6d614b5)
  Thanks [@trueadm](https://github.com/trueadm)! - Add a compiler validation error
  for rendering `children` through text interpolation (for example `{children}` or
  `{props.children}`) and direct users to render children as a component
  (`<@children />`) instead.
- Updated dependencies
  [[`fa285f4`](https://github.com/Ripple-TS/ripple/commit/fa285f441ab8d748c3dfea6adb463e3ca6d614b5)]:
  - ripple@0.2.211

## 0.2.210

### Patch Changes

- Fix npm OIDC publishing workflow

- Updated dependencies []:
  - ripple@0.2.210

## 0.2.209

### Patch Changes

- [#682](https://github.com/Ripple-TS/ripple/pull/682)
  [`96a5614`](https://github.com/Ripple-TS/ripple/commit/96a56141de8aa667a64bf53ad06f63292e38b1d9)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add
  invalid HTML nesting error detection during SSR in dev mode

  During SSR, if the HTML is malformed (e.g., `<button>` elements nested inside
  other `<button>` elements), the browser tries to repair the HTML, making
  hydration impossible. This change adds runtime validation of HTML nesting during
  SSR to detect these cases and provide clear error messages.
  - Added `push_element` and `pop_element` functions to the server runtime that
    track the element stack during SSR
  - Added comprehensive HTML nesting validation rules based on the HTML spec
  - The server compiler now emits `push_element`/`pop_element` calls when the
    `dev` option is enabled
  - Added `dev` option to `CompileOptions`
  - The Vite plugin now automatically enables dev mode during `vite dev` (serve
    command)

- [#683](https://github.com/Ripple-TS/ripple/pull/683)
  [`ae3aa98`](https://github.com/Ripple-TS/ripple/commit/ae3aa981515f81e62a699497e624dd0c2e3d2c91)
  Thanks [@WebEferen](https://github.com/WebEferen)! - Fix SSR hydration output
  for early-return guarded content by emitting hydration block markers around
  return-guarded regions, and add hydration/server coverage for early return
  scenarios.
- Updated dependencies
  [[`96a5614`](https://github.com/Ripple-TS/ripple/commit/96a56141de8aa667a64bf53ad06f63292e38b1d9),
  [`ae3aa98`](https://github.com/Ripple-TS/ripple/commit/ae3aa981515f81e62a699497e624dd0c2e3d2c91)]:
  - ripple@0.2.209

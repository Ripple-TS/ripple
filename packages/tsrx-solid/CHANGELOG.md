# @tsrx/solid

## 0.1.37

### Patch Changes

- Updated dependencies
  [[`a109586`](https://github.com/Ripple-TS/ripple/commit/a109586774227b4026ffbd813a956e231edb1005)]:
  - @tsrx/core@0.1.37

## 0.1.36

### Patch Changes

- [#1324](https://github.com/Ripple-TS/ripple/pull/1324)
  [`1925074`](https://github.com/Ripple-TS/ripple/commit/1925074254de0e61c8578cba136c50ea8f89cd35)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Minor adjustments from
  @tsrx/ripple moving to the parser ast vs its own version

- Updated dependencies
  [[`1925074`](https://github.com/Ripple-TS/ripple/commit/1925074254de0e61c8578cba136c50ea8f89cd35)]:
  - @tsrx/core@0.1.36

## 0.1.35

### Patch Changes

- Updated dependencies
  [[`51eed86`](https://github.com/Ripple-TS/ripple/commit/51eed869b7ea26b5554893c9f8dd363f2d2121bc)]:
  - @tsrx/core@0.1.35

## 0.1.34

### Patch Changes

- Updated dependencies
  [[`cc95ffa`](https://github.com/Ripple-TS/ripple/commit/cc95ffaef3f3d3cd252176ea94308f89739f0212)]:
  - @tsrx/core@0.1.34

## 0.1.33

### Patch Changes

- [#1288](https://github.com/Ripple-TS/ripple/pull/1288)
  [`bbe6e74`](https://github.com/Ripple-TS/ripple/commit/bbe6e7422c690558f0dfcb3abe5452d4f4cdde91)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep an empty expression
  container fragment in expression position: `let c = <>{}</>` (and
  `<>{/* comment */}</>`) now stays `<></>` instead of collapsing to a bare empty
  expression (`let c = ;`), which was a syntax error. Applies to the React,
  Preact, Solid, and Vue to_ts targets (Ripple already produced `<></>`).

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

- Updated dependencies
  [[`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432),
  [`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432)]:
  - @tsrx/core@0.1.32

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

- [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep native template nodes in
  JSX-child shape inside synthetic fragments on JSX-emitting targets (react,
  preact, solid, vue). A fragment nested in an expression container could collapse
  to a bare expression placed directly in a fragment children list
  (`<>{a} <>{<>{b}</>}</></>` compiled to `<>{a}b</>`), which JSX reads as literal
  text — in both production output and the TS/Volar virtual code.
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

- [#1229](https://github.com/Ripple-TS/ripple/pull/1229)
  [`6fd49c9`](https://github.com/Ripple-TS/ripple/commit/6fd49c9dd737e889844e254763f66e13ea4a7241)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Adapt Solid `@for` and
  `@catch` lowering to Solid 2 beta callback shapes so loop rows, index-keyed
  loops, and caught errors follow Solid's current runtime behavior.

- Updated dependencies
  [[`6fd49c9`](https://github.com/Ripple-TS/ripple/commit/6fd49c9dd737e889844e254763f66e13ea4a7241)]:
  - @tsrx/core@0.1.24

## 0.1.23

### Patch Changes

- [`9918c52`](https://github.com/Ripple-TS/ripple/commit/9918c52e954f2b8e1a994892e7c555e8277f2d59)
  Thanks [@trueadm](https://github.com/trueadm)! - Keep ordinary JavaScript
  control-flow blocks from implicitly rendering bare TSRX templates while
  preserving Solid terminal branch lowering.

- [`461e1fb`](https://github.com/Ripple-TS/ripple/commit/461e1fb4526f15f6effb645a4291df9a758aa599)
  Thanks [@trueadm](https://github.com/trueadm)! - Lower plain component-body `if`
  returns with trailing TSRX output to `<Show fallback>`.

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
  Thanks [@trueadm](https://github.com/trueadm)! - Add `@empty { ... }` fallbacks
  for TSRX `@for` loops, require prefixed template continuation clauses such as
  `@else`, `@empty`, `@pending`, `@catch`, `@case`, and `@default`, and reject
  direct `continue`, `break`, and `return` statements inside `@for` loop bodies
  and `@if` template branches.

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

- [#1198](https://github.com/Ripple-TS/ripple/pull/1198)
  [`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the unused namespaced
  TSX island feature and React bridge package.

- [#1189](https://github.com/Ripple-TS/ripple/pull/1189)
  [`e00f596`](https://github.com/Ripple-TS/ripple/commit/e00f5961d5668c054435c8a366ef2a6da6e4a381)
  Thanks [@trueadm](https://github.com/trueadm)! - Restore reactive Solid
  control-flow lowering for native TSRX component bodies.

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

- Updated dependencies
  [[`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)]:
  - @tsrx/core@0.1.17

## 0.1.16

### Patch Changes

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

- [#1135](https://github.com/Ripple-TS/ripple/pull/1135)
  [`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Support sole-child
  `{html ...}` raw HTML lowering for React, Preact, Solid and Vue targets, while
  keeping Ripple's existing child raw HTML behavior unchanged.

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

- [`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Republish version with the
  new publish.yaml workflow

- Updated dependencies
  [[`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)]:
  - @tsrx/core@0.1.6

## 0.1.5

### Patch Changes

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

- [#1099](https://github.com/Ripple-TS/ripple/pull/1099)
  [`4f360f0`](https://github.com/Ripple-TS/ripple/commit/4f360f008edf61492cf85afa646c797c80a73f22)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Keep explicit return values
  in expression-position `<tsrx>` templates out of render control-flow lowering.

- [#1101](https://github.com/Ripple-TS/ripple/pull/1101)
  [`2ae792c`](https://github.com/Ripple-TS/ripple/commit/2ae792cdca7d466e552a330ea965cefec2b1f5a5)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve JSX parser state for
  semicolon-free native TSRX returns inside callback props.

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

- Updated dependencies
  [[`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)]:
  - @tsrx/core@0.0.28

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
- Updated dependencies
  [[`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6),
  [`29ac6d7`](https://github.com/Ripple-TS/ripple/commit/29ac6d757b376e4102c4c8c8d3d47f7ae3afdd00),
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b),
  [`cf60dba`](https://github.com/Ripple-TS/ripple/commit/cf60dbaf9c6be84d6e95f9c5d66b64d8927494c9),
  [`4cd0986`](https://github.com/Ripple-TS/ripple/commit/4cd0986201e960cd8544d0f789d17a217e93f954),
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)]:
  - @tsrx/core@0.0.27

## 0.0.26

### Patch Changes

- [#1055](https://github.com/Ripple-TS/ripple/pull/1055)
  [`8125c73`](https://github.com/Ripple-TS/ripple/commit/8125c73b37e7b201dbb0a078e3583c022ceb7687)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix sequential early-return
  guards so later JSX is nested under each remaining Solid continuation.

- Updated dependencies
  [[`8125c73`](https://github.com/Ripple-TS/ripple/commit/8125c73b37e7b201dbb0a078e3583c022ceb7687)]:
  - @tsrx/core@0.0.26

## 0.0.25

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

## 0.0.24

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

## 0.0.23

### Patch Changes

- Updated dependencies
  [[`3b2eae2`](https://github.com/Ripple-TS/ripple/commit/3b2eae24dc955325a0379c4773631796865e0f38),
  [`5c6ee71`](https://github.com/Ripple-TS/ripple/commit/5c6ee71bfd4f5dc443c43eb34e631bb032606faf),
  [`83b19fd`](https://github.com/Ripple-TS/ripple/commit/83b19fd67aa27eb10e93205dd88c61b13ffbc523)]:
  - @tsrx/core@0.0.23

## 0.0.22

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

## 0.0.21

### Patch Changes

- Updated dependencies
  [[`76fd362`](https://github.com/Ripple-TS/ripple/commit/76fd3622f3e6432787fadb1a96337541424b25aa)]:
  - @tsrx/core@0.0.21

## 0.0.20

### Patch Changes

- [#1014](https://github.com/Ripple-TS/ripple/pull/1014)
  [`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)
  Thanks [@trueadm](https://github.com/trueadm)! - Add a `collect` compile option
  for collecting diagnostics and comments without enabling loose markup recovery.

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d),
  [`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/core@0.0.20

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
- Updated dependencies
  [[`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108)]:
  - @tsrx/core@0.0.19

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

- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7),
  [`bce43be`](https://github.com/Ripple-TS/ripple/commit/bce43be304812ca04dd8d196e2439f28ea392237)]:
  - @tsrx/core@0.0.18

## 0.0.17

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

## 0.0.16

### Patch Changes

- Updated dependencies
  [[`f660969`](https://github.com/Ripple-TS/ripple/commit/f66096972bc8d2f03061e6018d03e40207761aaa)]:
  - @tsrx/core@0.0.16

## 0.0.15

### Patch Changes

- Updated dependencies
  [[`0ad85f1`](https://github.com/Ripple-TS/ripple/commit/0ad85f1107ce9bddb72cee44b908a34c5264c0b5),
  [`7684132`](https://github.com/Ripple-TS/ripple/commit/7684132ed71db6c550ecbe1c623975ddbed96be5)]:
  - @tsrx/core@0.0.15

## 0.0.14

### Patch Changes

- [#982](https://github.com/Ripple-TS/ripple/pull/982)
  [`fcd25aa`](https://github.com/Ripple-TS/ripple/commit/fcd25aa549db0d56ccbd596b657b856a5061e20f)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Reject return statements with
  values in component bodies for React, Preact, and Solid TSRX targets.

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

- [#984](https://github.com/Ripple-TS/ripple/pull/984)
  [`fee8620`](https://github.com/Ripple-TS/ripple/commit/fee8620fa4e82a7c7e4adb3e434e9db552a3e157)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Preserve component type
  parameters when lowering generic TSRX components to generated functions.

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

## 0.0.13

### Patch Changes

- [`a9f706d`](https://github.com/Ripple-TS/ripple/commit/a9f706d6626dc1a9e8505d9ea8f16989b2b024b3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix Volar source mappings for
  extracted JSX hook helpers so component-scope declarations keep their inferred
  editor types.

- [`52ded23`](https://github.com/Ripple-TS/ripple/commit/52ded234b486acb3543b811be44864bd6596b4da)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Return `null` from
  statement-only element child IIFEs so generated Solid TSX type-checks.

- Updated dependencies
  [[`a9f706d`](https://github.com/Ripple-TS/ripple/commit/a9f706d6626dc1a9e8505d9ea8f16989b2b024b3),
  [`3e07109`](https://github.com/Ripple-TS/ripple/commit/3e071098508449158fa11f2ae48c912d4d673b68),
  [`112cfd9`](https://github.com/Ripple-TS/ripple/commit/112cfd9fbfd4412efea543abc55deceb186cf351)]:
  - @tsrx/core@0.0.13

## 0.0.12

### Patch Changes

- Updated dependencies
  [[`ea56fa0`](https://github.com/Ripple-TS/ripple/commit/ea56fa021798afe8621699d11b7e1d9e675cbfb4)]:
  - @tsrx/core@0.0.12

## 0.0.11

### Patch Changes

- [#938](https://github.com/Ripple-TS/ripple/pull/938)
  [`7529e1f`](https://github.com/Ripple-TS/ripple/commit/7529e1fe3f0870319bd3399501fd2eb43c516065)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix source-map and Volar
  mapping coverage for one-line early-return `if` statements in shared JSX
  transforms, including plain functions and class-like method bodies.

- Updated dependencies
  [[`7529e1f`](https://github.com/Ripple-TS/ripple/commit/7529e1fe3f0870319bd3399501fd2eb43c516065)]:
  - @tsrx/core@0.0.11

## 0.0.10

### Patch Changes

- Updated dependencies
  [[`7f59ed8`](https://github.com/Ripple-TS/ripple/commit/7f59ed80d7b44c847fb9eb8bf00d4fe9835c3136)]:
  - @tsrx/core@0.0.10

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
- Updated dependencies
  [[`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a),
  [`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)]:
  - @tsrx/core@0.0.9

## 0.0.8

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

## 0.0.7

### Patch Changes

- Updated dependencies
  [[`fab49f7`](https://github.com/Ripple-TS/ripple/commit/fab49f7da8ec13c981f1c7b3102703d0c349fc1e)]:
  - @tsrx/core@0.0.7

## 0.0.6

### Patch Changes

- [#901](https://github.com/Ripple-TS/ripple/pull/901)
  [`1856b0f`](https://github.com/Ripple-TS/ripple/commit/1856b0f2df681b501253ebb8d8314b84fceb822b)
  Thanks [@JoviDeCroock](https://github.com/JoviDeCroock)! - Preserve source order
  when non-JSX statements are interleaved with JSX children. Previously all
  statements ran before any JSX was constructed, so mutations between siblings
  (e.g. `<b>{"hi" + a}</b>; a = "two"; <b>{"hi" + a}</b>`) were observed by every
  sibling; each JSX child is now captured at its textual position.

- Updated dependencies
  [[`e9da9cb`](https://github.com/Ripple-TS/ripple/commit/e9da9cbdd42c28f129ee643366c06f8779b8f931)]:
  - @tsrx/core@0.0.6

## 0.0.5

### Patch Changes

- Updated dependencies
  [[`d027c6c`](https://github.com/Ripple-TS/ripple/commit/d027c6c84fd3ba7c577c52b9fdade77e7ff886e0)]:
  - @tsrx/core@0.0.5

## 0.0.4

### Patch Changes

- [#888](https://github.com/Ripple-TS/ripple/pull/888)
  [`bfe6fd3`](https://github.com/Ripple-TS/ripple/commit/bfe6fd30155ce2c308a624744ade8a87c15858d7)
  Thanks [@trueadm](https://github.com/trueadm)! - Wrap element children that mix
  JSX with plain statements (`VariableDeclaration`, `ExpressionStatement`,
  `DebuggerStatement`, etc.) in an IIFE so the statements execute as JS during
  render and keep their locals scoped to the enclosing element. Previously those
  statements were emitted directly as JSX children, which made them render as
  literal text rather than run — e.g. mid-template
  `const [state, setState] = createSignal()` or `console.log(...)` between JSX
  siblings printed their source instead of executing. Matches the React target's
  existing behaviour.

## 0.0.3

### Patch Changes

- [#888](https://github.com/Ripple-TS/ripple/pull/888)
  [`ad99739`](https://github.com/Ripple-TS/ripple/commit/ad99739f65202850ff0013515121cfd3a1758b82)
  Thanks [@trueadm](https://github.com/trueadm)! - Wrap element children that mix
  JSX with plain statements (`VariableDeclaration`, `ExpressionStatement`,
  `DebuggerStatement`, etc.) in an IIFE so the statements execute as JS during
  render and keep their locals scoped to the enclosing element. Previously those
  statements were emitted directly as JSX children, which made them render as
  literal text rather than run — e.g. mid-template
  `const [state, setState] = createSignal()` or `console.log(...)` between JSX
  siblings printed their source instead of executing. Matches the React target's
  existing behaviour.

## 0.0.2

### Patch Changes

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - Target Solid 2.0 beta. The
  Solid transform now emits `<Errored>` / `<Loading>` instead of `<ErrorBoundary>`
  / `<Suspense>` (renamed in Solid 2.0 core). The Vite plugin re-anchors virtual
  `.tsrx.tsx` ids when the host bundler strips the workspace root (e.g. Vitest
  test entries). A new `tsrx-solid-runtime` Vitest project runs Solid components
  end-to-end in jsdom, mirroring the existing React runtime test matrix.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - `{html expr}` now compiles on
  the Solid target to an `innerHTML={expr}` attribute on the parent element,
  matching Solid's native raw-HTML primitive. Only one `{html ...}` is permitted
  per element, and it cannot share the element with sibling children — both cases
  produce a helpful compile-time error.

  On the React target, `{html ...}` now raises an explicit compile-time error
  pointing at `dangerouslySetInnerHTML`. Previously it failed with a generic
  astring "Not implemented: Html" message.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - Drop `{html expr}` support on
  the Solid target. It used to lower to a Solid `innerHTML={...}` attribute, but
  `innerHTML` is element-level (it replaces all children and has no meaning on
  composite components) so the implicit lowering from a child container was
  error-prone. Compiling `{html ...}` with `@tsrx/solid` is now a compile-time
  error that points users at `innerHTML={...}` as an explicit element attribute.
  This matches the `@tsrx/react` behaviour; only Ripple has a first-class
  `{html ...}` primitive.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - Support `{ref expr}` on
  composite components and allow multiple `{ref ...}` attributes on the same
  element. On DOM elements, `{ref expr}` now compiles to `ref={expr}` directly,
  leveraging Solid's JSX transform for both variable assignment
  (`let el; {ref el}`) and callback invocation (`{ref fn}`). On composite
  components, the ref is passed through as a regular prop, so spreading
  `{...props}` onto a DOM element inside the child wires it through automatically
  via Solid's spread runtime. Multiple refs on the same target compile to a
  `ref={[a, b, ...]}` array so every callback fires.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - When `{text expr}` is the sole
  child of a host (DOM) element, hoist it to a `textContent={expr}` attribute on
  the parent. Solid writes `textContent` as a direct DOM property, which skips the
  `insert()`-based text-node binding it would otherwise emit for a child
  expression. The optimization only applies to host elements (composite components
  don't have a DOM `textContent`) and bails out if the user has already set
  `textContent` explicitly or if there are sibling children (since `textContent`
  replaces all other content).

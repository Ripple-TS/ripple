# @tsrx/solid

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

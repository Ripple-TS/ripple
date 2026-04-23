# @tsrx/core

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
  line-start `<` comparisons inside statement-based element children so they are
  not misparsed as JSX tags.

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

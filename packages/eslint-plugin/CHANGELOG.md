# @tsrx/eslint-plugin

## 0.3.91

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.91

## 0.3.90

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.90

## 0.3.89

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.89

## 0.3.88

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.88

## 0.3.87

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.87

## 0.3.86

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.86

## 0.3.85

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.85

## 0.3.84

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.84

## 0.3.83

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.83

## 0.3.82

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.82

## 0.3.81

### Patch Changes

- Updated dependencies
  [[`b1256fd`](https://github.com/Ripple-TS/ripple/commit/b1256fdb5bf279ee7dd20bf1a71dcfccc47e279c)]:
  - @tsrx/eslint-parser@0.3.81

## 0.3.80

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.80

## 0.3.79

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.79

## 0.3.78

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.78

## 0.3.77

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.77

## 0.3.76

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.76

## 0.3.75

### Patch Changes

- [#1211](https://github.com/Ripple-TS/ripple/pull/1211)
  [`ac6f358`](https://github.com/Ripple-TS/ripple/commit/ac6f3582ca0b2814004439c882d6aa735c8afe50)
  Thanks [@trueadm](https://github.com/trueadm)! - Add diagnostics, lint autofix,
  and MCP advice for function bodies that forget `@{...}` before TSRX template
  output.

- Updated dependencies
  [[`ac6f358`](https://github.com/Ripple-TS/ripple/commit/ac6f3582ca0b2814004439c882d6aa735c8afe50)]:
  - @tsrx/eslint-parser@0.3.75

## 0.3.74

### Patch Changes

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Update ESLint traversal and
  rules for JSX code blocks and current TSRX template output rules.

- [#1199](https://github.com/Ripple-TS/ripple/pull/1199)
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)
  Thanks [@trueadm](https://github.com/trueadm)! - Update language tooling for
  TSRX template fences, JSX control-flow directives, and JSX-shaped AST nodes.

- Updated dependencies
  [[`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)]:
  - @tsrx/eslint-parser@0.3.74

## 0.3.73

### Patch Changes

- Updated dependencies
  [[`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)]:
  - @tsrx/eslint-parser@0.3.73

## 0.3.72

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
  - @tsrx/eslint-parser@0.3.72

## 0.3.71

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.71

## 0.3.70

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.70

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

- Updated dependencies
  [[`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)]:
  - @tsrx/eslint-parser@0.3.69

## 0.3.68

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.68

## 0.3.67

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.67

## 0.3.66

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.66

## 0.3.65

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.65

## 0.3.64

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.64

## 0.3.63

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.63

## 0.3.62

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.62

## 0.3.61

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.61

## 0.3.60

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.60

## 0.3.59

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.59

## 0.3.58

### Patch Changes

- Updated dependencies
  [[`aaa33db`](https://github.com/Ripple-TS/ripple/commit/aaa33dbdfdc7bef2d813bbe87689d9cdb2bae9ae)]:
  - @tsrx/eslint-parser@0.3.58

## 0.3.57

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.57

## 0.3.56

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.56

## 0.3.55

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.55

## 0.3.54

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.54

## 0.3.53

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.53

## 0.3.52

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.52

## 0.3.51

### Patch Changes

- [`f1b1f94`](https://github.com/Ripple-TS/ripple/commit/f1b1f9475553cbe3632a5cc9794a8f54615c29f2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Patch packages currently
  versioned at 0.3.50 to fix the bump that caused major 1.0.0 release with a minor
  changeset.

- Updated dependencies
  [[`f1b1f94`](https://github.com/Ripple-TS/ripple/commit/f1b1f9475553cbe3632a5cc9794a8f54615c29f2)]:
  - @tsrx/eslint-parser@0.3.51

## 0.3.50

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.50

## 0.3.49

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.49

## 0.3.48

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.48

## 0.3.47

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.47

## 0.3.46

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.46

## 0.3.45

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.45

## 0.3.44

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.44

## 0.3.43

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.43

## 0.3.42

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.42

## 0.3.41

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.41

## 0.3.40

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.40

## 0.3.39

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.39

## 0.3.38

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.38

## 0.3.37

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.37

## 0.3.36

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.36

## 0.3.35

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.35

## 0.3.34

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.34

## 0.3.33

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.33

## 0.3.32

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.32

## 0.3.31

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.31

## 0.3.30

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.30

## 0.3.29

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.29

## 0.3.28

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.28

## 0.3.27

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@0.3.27

## 0.3.26

### Patch Changes

- [`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Correct package versions.

- Updated dependencies
  [[`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)]:
  - @tsrx/eslint-parser@0.3.26

## 1.0.1

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@1.0.1

## 1.0.0

### Patch Changes

- Updated dependencies []:
  - @tsrx/eslint-parser@1.0.0

## 0.3.25

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.25

## 0.3.24

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.24

## 0.3.23

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.23

## 0.3.22

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.22

## 0.3.21

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.21

## 0.3.20

### Patch Changes

- [#879](https://github.com/Ripple-TS/ripple/pull/879)
  [`7ff7cfa`](https://github.com/Ripple-TS/ripple/commit/7ff7cfad33b2c31f742d410d7e2450066b735d92)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - chore: drop
  Node 20 support

- Updated dependencies
  [[`7ff7cfa`](https://github.com/Ripple-TS/ripple/commit/7ff7cfad33b2c31f742d410d7e2450066b735d92)]:
  - @ripple-ts/eslint-parser@0.3.20

## 0.3.19

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.19

## 0.3.18

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.18

## 0.3.17

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.17

## 0.3.16

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.16

## 0.3.15

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.15

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

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.14

## 0.3.13

### Patch Changes

- [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `.rsrx` support across
  Ripple tooling and rename the repository's tracked `.ripple` modules to `.rsrx`.
- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.13

## 0.3.12

### Patch Changes

- [#859](https://github.com/Ripple-TS/ripple/pull/859)
  [`cdd31ba`](https://github.com/Ripple-TS/ripple/commit/cdd31ba4c07ce504b01d56533e19a6ba37879f5a)
  Thanks [@trueadm](https://github.com/trueadm)! - Add first-phase `.tsrx` support
  across the core Ripple tooling so Vite, Rollup, TypeScript, the language server,
  Prettier, ESLint, and editor integrations accept both `.ripple` and `.tsrx`
  files.

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.12

## 0.3.11

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.11

## 0.3.10

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.10

## 0.3.9

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.9

## 0.3.8

### Patch Changes

- [#834](https://github.com/Ripple-TS/ripple/pull/834)
  [`0b0447d`](https://github.com/Ripple-TS/ripple/commit/0b0447d3713efe7365f48a9dda6b5e6bf6452b02)
  Thanks [@trueadm](https://github.com/trueadm)! - Replace
  `no-introspect-in-modules` rule with `no-lazy-destructuring-in-modules` to match
  the new `&[]`/`&{}` lazy destructuring syntax

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.5

## 0.3.4

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.3.1

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

- Updated dependencies
  [[`74a10cc`](https://github.com/Ripple-TS/ripple/commit/74a10cc5701962cd7c72b144d59b35ecb76263a3)]:
  - @ripple-ts/eslint-parser@0.3.0

## 0.2.216

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.2.216

## 0.2.215

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.2.215

## 0.2.214

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.2.214

## 0.2.213

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.2.213

## 0.2.212

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.2.212

## 0.2.211

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.2.211

## 0.2.210

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.2.210

## 0.2.209

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/eslint-parser@0.2.209

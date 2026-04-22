# @tsrx/prettier-plugin

## 0.3.28

### Patch Changes

- Updated dependencies
  [[`4292598`](https://github.com/Ripple-TS/ripple/commit/42925982e88f48f0af6cc74deeaa3c17bc6657cf),
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8),
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)]:
  - @tsrx/core@0.0.8
  - @tsrx/ripple@0.0.10

## 0.3.27

### Patch Changes

- [#922](https://github.com/Ripple-TS/ripple/pull/922)
  [`0364a03`](https://github.com/Ripple-TS/ripple/commit/0364a03766ad6810d256c0be1f1c93bcbbab3c67)
  Thanks [@trueadm](https://github.com/trueadm)! - Prefer breaking all JSX
  attributes onto separate lines instead of breaking expression values inline when
  an attribute value would cause a line break (e.g. multiline objects, ternaries).
  This makes element hierarchy easier to identify at a glance.

## 0.3.26

### Patch Changes

- [`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Correct package versions.

- Updated dependencies
  [[`fab49f7`](https://github.com/Ripple-TS/ripple/commit/fab49f7da8ec13c981f1c7b3102703d0c349fc1e)]:
  - @tsrx/core@0.0.7
  - @tsrx/ripple@0.0.9

## 1.0.1

### Patch Changes

- Updated dependencies
  [[`316cba1`](https://github.com/Ripple-TS/ripple/commit/316cba18614e5ef59dce15e0de6e720eb922955f)]:
  - @tsrx/ripple@0.0.8

## 1.0.0

### Patch Changes

- [#913](https://github.com/Ripple-TS/ripple/pull/913)
  [`ac6dbe7`](https://github.com/Ripple-TS/ripple/commit/ac6dbe70e9575c39f5ed9df12abe4600cef48aa3)
  Thanks [@trueadm](https://github.com/trueadm)! - Rename the Prettier plugin
  package to `@tsrx/prettier-plugin` and update local consumers and editor
  guidance to use the new package name.

- Updated dependencies
  [[`e9da9cb`](https://github.com/Ripple-TS/ripple/commit/e9da9cbdd42c28f129ee643366c06f8779b8f931)]:
  - @tsrx/core@0.0.6
  - @tsrx/ripple@0.0.7

## 0.3.25

## 0.3.24

## 0.3.23

### Patch Changes

- Updated dependencies
  [[`d027c6c`](https://github.com/Ripple-TS/ripple/commit/d027c6c84fd3ba7c577c52b9fdade77e7ff886e0),
  [`73ceaac`](https://github.com/Ripple-TS/ripple/commit/73ceaacd029fb634a62252abdda59ab5f2bec15d)]:
  - @tsrx/core@0.0.5
  - @tsrx/ripple@0.0.6

## 0.3.22

## 0.3.21

## 0.3.20

## 0.3.19

## 0.3.18

## 0.3.17

### Patch Changes

- Updated dependencies
  [[`7f98c10`](https://github.com/Ripple-TS/ripple/commit/7f98c1039f52a56135672b0f9b476af280c81f03)]:
  - @tsrx/core@0.0.4
  - @tsrx/ripple@0.0.5

## 0.3.16

### Patch Changes

- Updated dependencies
  [[`030ff45`](https://github.com/Ripple-TS/ripple/commit/030ff45bc3020cd1b6e1a914fc58af7c8a0e5af1)]:
  - @tsrx/core@0.0.3
  - @tsrx/ripple@0.0.4

## 0.3.15

### Patch Changes

- Updated dependencies
  [[`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)]:
  - @tsrx/ripple@0.0.3

## 0.3.14

### Patch Changes

- Updated dependencies
  [[`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)]:
  - @tsrx/core@0.0.2
  - @tsrx/ripple@0.0.2

## 0.3.13

### Patch Changes

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

## 0.3.12

### Patch Changes

- [#859](https://github.com/Ripple-TS/ripple/pull/859)
  [`cdd31ba`](https://github.com/Ripple-TS/ripple/commit/cdd31ba4c07ce504b01d56533e19a6ba37879f5a)
  Thanks [@trueadm](https://github.com/trueadm)! - Add first-phase `.tsrx` support
  across the core Ripple tooling so Vite, Rollup, TypeScript, the language server,
  Prettier, ESLint, and editor integrations accept both `.ripple` and `.tsrx`
  files.

## 0.3.11

## 0.3.10

## 0.3.9

## 0.3.8

## 0.3.7

### Patch Changes

- [#832](https://github.com/Ripple-TS/ripple/pull/832)
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix formatting of TypeScript
  interface call signatures with conditional types (including `infer`) so Prettier
  preserves them instead of emitting unknown-node placeholders.

## 0.3.6

## 0.3.5

## 0.3.4

### Patch Changes

- [`92982cd`](https://github.com/Ripple-TS/ripple/commit/92982cd7b918d0afee9334c74765573b30c8a645)
  Thanks [@trueadm](https://github.com/trueadm)! - feat(compiler): add lazy
  destructuring syntax (`&{...}` and `&[...]`)

  Lazy destructuring defers property/index access until the binding is read,
  preserving reactivity for destructured props. Works with default values,
  compound assignment operators, and update expressions.

## 0.3.3

## 0.3.2

## 0.3.1

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

- [#784](https://github.com/Ripple-TS/ripple/pull/784)
  [`d38c8f2`](https://github.com/Ripple-TS/ripple/commit/d38c8f21201c8bb50293d12da2df233353b9837b)
  Thanks [@anubra266](https://github.com/anubra266)! - fix: preserve parentheses
  around IIFE callee in prettier plugin

## 0.2.216

## 0.2.215

## 0.2.214

## 0.2.213

## 0.2.212

## 0.2.211

## 0.2.210

## 0.2.209

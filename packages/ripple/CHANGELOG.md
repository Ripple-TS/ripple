# ripple

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

# @ripple-ts/vite-plugin

## 0.3.15

### Patch Changes

- Updated dependencies
  [[`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)]:
  - @tsrx/ripple@0.0.3
  - @ripple-ts/adapter@0.3.15

## 0.3.14

### Patch Changes

- Updated dependencies
  [[`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)]:
  - @tsrx/ripple@0.0.2
  - @ripple-ts/adapter@0.3.14

## 0.3.13

### Patch Changes

- [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `.rsrx` support across
  Ripple tooling and rename the repository's tracked `.ripple` modules to `.rsrx`.
- Updated dependencies []:
  - @ripple-ts/adapter@0.3.13

## 0.3.12

### Patch Changes

- [#859](https://github.com/Ripple-TS/ripple/pull/859)
  [`cdd31ba`](https://github.com/Ripple-TS/ripple/commit/cdd31ba4c07ce504b01d56533e19a6ba37879f5a)
  Thanks [@trueadm](https://github.com/trueadm)! - Add first-phase `.tsrx` support
  across the core Ripple tooling so Vite, Rollup, TypeScript, the language server,
  Prettier, ESLint, and editor integrations accept both `.ripple` and `.tsrx`
  files.

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.12

## 0.3.11

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.11

## 0.3.10

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.10

## 0.3.9

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.9

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.7

## 0.3.6

### Patch Changes

- [#819](https://github.com/Ripple-TS/ripple/pull/819)
  [`472c4c4`](https://github.com/Ripple-TS/ripple/commit/472c4c4b80a69ed22a258a3f3c03c4ca2d20a95b)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix HMR update causing
  component styling to disappear

  When editing a component's scoped CSS, the CSS hash changes but the virtual CSS
  module was not being invalidated or included in the HMR update. This caused the
  browser to keep stale CSS selectors that no longer matched the component's new
  hash-scoped class names, making all styling disappear until a full dev server
  restart.

  The fix eagerly re-compiles the `.ripple` file in the `hotUpdate` hook to update
  the CSS cache, then invalidates and includes the virtual CSS module in the HMR
  update so the browser receives fresh CSS in sync with the re-rendered component.

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.5

## 0.3.4

### Patch Changes

- [#807](https://github.com/Ripple-TS/ripple/pull/807)
  [`56cdf54`](https://github.com/Ripple-TS/ripple/commit/56cdf54afb1b96e49faa273c18e0489ad70897b2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Upgrade to Vite 8

- [`2956743`](https://github.com/Ripple-TS/ripple/commit/2956743ccbf8ebad6ae9fde27fb8809634fa3a91)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Split the production subpath
  declarations into a dedicated type file so the exported types resolve cleanly
  without self-import workarounds.

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.0

## 0.2.216

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.2.216

## 0.2.215

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.2.215

## 0.2.214

### Patch Changes

- [#730](https://github.com/Ripple-TS/ripple/pull/730)
  [`6efde20`](https://github.com/Ripple-TS/ripple/commit/6efde20a7fe1e29b27ac98823362cba2001340fa)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Force patch version bump for
  vite-plugin package.

- Updated dependencies []:
  - @ripple-ts/adapter@0.2.214

## 0.2.213

## 0.2.212

## 0.2.211

## 0.2.210

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

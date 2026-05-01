# @ripple-ts/vite-plugin

## 0.3.41

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.23
  - @ripple-ts/adapter@0.3.41

## 0.3.40

### Patch Changes

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/ripple@0.0.22
  - @ripple-ts/adapter@0.3.40

## 0.3.39

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.21
  - @ripple-ts/adapter@0.3.39

## 0.3.38

### Patch Changes

- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7)]:
  - @tsrx/ripple@0.0.20
  - @ripple-ts/adapter@0.3.38

## 0.3.37

### Patch Changes

- Updated dependencies
  [[`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)]:
  - @tsrx/ripple@0.0.19
  - @ripple-ts/adapter@0.3.37

## 0.3.36

### Patch Changes

- [#999](https://github.com/Ripple-TS/ripple/pull/999)
  [`aa6628b`](https://github.com/Ripple-TS/ripple/commit/aa6628b3318f1bdad6a6e12286d3002f8d591e2e)
  Thanks [@trueadm](https://github.com/trueadm)! - Pass RenderRoute params to
  SSR-compiled page components.

- Updated dependencies []:
  - @tsrx/ripple@0.0.18
  - @ripple-ts/adapter@0.3.36

## 0.3.35

### Patch Changes

- [#966](https://github.com/Ripple-TS/ripple/pull/966)
  [`caf83e3`](https://github.com/Ripple-TS/ripple/commit/caf83e386faa9133df70460f266fc27ab323082b)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - fix:
  register SSR/API middleware as a pre-hook so it runs before Vite's HTML fallback
  middleware

  The dev server's `configureServer` hook previously returned a function
  (post-hook), which registered SSR/API middleware after Vite's internal
  middleware stack. Vite's HTML fallback middleware would intercept all non-file
  GET requests first, preventing SSR rendering and API routes from ever executing.

  Switched to a pre-hook (no return value) so middleware is registered before Vite
  internals. Config loading is deferred to the first request via
  `ensureConfigLoaded()`, which retries on missing config and surfaces load errors
  as dev-server 500 pages instead of silently falling through.

- Updated dependencies []:
  - @tsrx/ripple@0.0.17
  - @ripple-ts/adapter@0.3.35

## 0.3.34

### Patch Changes

- Updated dependencies
  [[`fee8620`](https://github.com/Ripple-TS/ripple/commit/fee8620fa4e82a7c7e4adb3e434e9db552a3e157),
  [`2fcacb4`](https://github.com/Ripple-TS/ripple/commit/2fcacb471d7780074f92b20c9b394f7650a941bb)]:
  - @tsrx/ripple@0.0.16
  - @ripple-ts/adapter@0.3.34

## 0.3.33

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.15
  - @ripple-ts/adapter@0.3.33

## 0.3.32

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.14
  - @ripple-ts/adapter@0.3.32

## 0.3.31

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.13
  - @ripple-ts/adapter@0.3.31

## 0.3.30

### Patch Changes

- Updated dependencies
  [[`7f59ed8`](https://github.com/Ripple-TS/ripple/commit/7f59ed80d7b44c847fb9eb8bf00d4fe9835c3136)]:
  - @tsrx/ripple@0.0.12
  - @ripple-ts/adapter@0.3.30

## 0.3.29

### Patch Changes

- Updated dependencies
  [[`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)]:
  - @tsrx/ripple@0.0.11
  - @ripple-ts/adapter@0.3.29

## 0.3.28

### Patch Changes

- Updated dependencies
  [[`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8),
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)]:
  - @tsrx/ripple@0.0.10
  - @ripple-ts/adapter@0.3.28

## 0.3.27

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.27

## 0.3.26

### Patch Changes

- [`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Correct package versions.

- Updated dependencies
  [[`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)]:
  - @ripple-ts/adapter@0.3.26
  - @tsrx/ripple@0.0.9

## 1.0.1

### Patch Changes

- Updated dependencies
  [[`316cba1`](https://github.com/Ripple-TS/ripple/commit/316cba18614e5ef59dce15e0de6e720eb922955f)]:
  - @tsrx/ripple@0.0.8
  - @ripple-ts/adapter@1.0.1

## 1.0.0

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.7
  - @ripple-ts/adapter@1.0.0

## 0.3.25

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.25

## 0.3.24

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.24

## 0.3.23

### Patch Changes

- Updated dependencies
  [[`73ceaac`](https://github.com/Ripple-TS/ripple/commit/73ceaacd029fb634a62252abdda59ab5f2bec15d)]:
  - @tsrx/ripple@0.0.6
  - @ripple-ts/adapter@0.3.23

## 0.3.22

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.22

## 0.3.21

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.21

## 0.3.20

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.20

## 0.3.19

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.19

## 0.3.18

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.18

## 0.3.17

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.5
  - @ripple-ts/adapter@0.3.17

## 0.3.16

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.4
  - @ripple-ts/adapter@0.3.16

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
  Thanks [@trueadm](https://github.com/trueadm)! - Add `.tsrx` support across
  Ripple tooling and rename the repository's tracked `.tsrx` modules to `.tsrx`.
- Updated dependencies []:
  - @ripple-ts/adapter@0.3.13

## 0.3.12

### Patch Changes

- [#859](https://github.com/Ripple-TS/ripple/pull/859)
  [`cdd31ba`](https://github.com/Ripple-TS/ripple/commit/cdd31ba4c07ce504b01d56533e19a6ba37879f5a)
  Thanks [@trueadm](https://github.com/trueadm)! - Add first-phase `.tsrx` support
  across the core Ripple tooling so Vite, Rollup, TypeScript, the language server,
  Prettier, ESLint, and editor integrations accept both `.tsrx` and `.tsrx` files.

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

  The fix eagerly re-compiles the `.tsrx` file in the `hotUpdate` hook to update
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

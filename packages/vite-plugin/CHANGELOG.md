# @ripple-ts/vite-plugin

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

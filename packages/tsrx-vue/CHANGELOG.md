# @tsrx/vue

## 0.0.13

### Patch Changes

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

## 0.0.12

### Patch Changes

- Updated dependencies
  [[`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)]:
  - @tsrx/core@0.0.17

## 0.0.11

### Patch Changes

- [#949](https://github.com/Ripple-TS/ripple/pull/949)
  [`f660969`](https://github.com/Ripple-TS/ripple/commit/f66096972bc8d2f03061e6018d03e40207761aaa)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix Vue early-return lowering
  so continuation-local refs stay stable across parent updates.

  Also make `if (cond) return;` early returns in Vue components reactive after
  mount. Previously the early return was emitted as a setup-time `if` block, which
  only evaluated `cond` once when `setup()` ran and never again — so flipping the
  condition after mount didn't toggle the continuation.

  The lowering now picks one of two paths based on the continuation:
  - **Pure JSX continuation** — inlined as a render-time ternary
    (`cond ? null : <continuation/>`). Cheapest path, no extra component.
  - **Continuation with setup-time statements** (`provide`, `watch`,
    `watchEffect`, declarations, plain function calls, etc.) — moved into a
    `StatementBodyHook` helper component whose setup runs only when the helper
    mounts. This keeps those statements scoped to the continuation's lifecycle so
    e.g. `provide` is only visible to descendants while the continuation is
    active.

  React, Preact, and Solid lowering is unchanged: their bodies re-run on every
  render, so the existing setup-time `if` already behaves reactively.

- [#949](https://github.com/Ripple-TS/ripple/pull/949)
  [`f660969`](https://github.com/Ripple-TS/ripple/commit/f66096972bc8d2f03061e6018d03e40207761aaa)
  Thanks [@trueadm](https://github.com/trueadm)! - Add Vue `try/catch` component
  error boundary support.

- Updated dependencies
  [[`f660969`](https://github.com/Ripple-TS/ripple/commit/f66096972bc8d2f03061e6018d03e40207761aaa)]:
  - @tsrx/core@0.0.16

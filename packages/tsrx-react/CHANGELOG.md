# @tsrx/react

## 0.1.0

### Minor Changes

- [#907](https://github.com/Ripple-TS/ripple/pull/907)
  [`f82f95f`](https://github.com/Ripple-TS/ripple/commit/f82f95fcf99aa58be086c69a37ed0e5b170e1a76)
  Thanks [@trueadm](https://github.com/trueadm)! - Allow top-level component-body
  `await` in React components without requiring a module-level `"use server"`
  directive.

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

## 0.0.7

### Patch Changes

- [#903](https://github.com/Ripple-TS/ripple/pull/903)
  [`0babf74`](https://github.com/Ripple-TS/ripple/commit/0babf745f0bdfe04a70d8f19730097007c4f1705)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix React JSX hoisting so
  elements with render-time expressions are not lifted into shared statics.

## 0.0.6

### Patch Changes

- [#896](https://github.com/Ripple-TS/ripple/pull/896)
  [`01b4ed6`](https://github.com/Ripple-TS/ripple/commit/01b4ed663f1deb9306ad401d02dbec0f5d27cdc5)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix React `for` loop key
  generation in compiled output:
  - Ensure hook-extracted loop wrapper components receive a `key` when using
    `for (...; index index)` and no explicit key is provided.
  - Ensure non-hook loop item elements also receive an implicit `key={index}`
    fallback in the same indexed-loop scenario.
  - Add regression tests covering both hook and non-hook conditional loop paths.

## 0.0.5

### Patch Changes

- Updated dependencies
  [[`d027c6c`](https://github.com/Ripple-TS/ripple/commit/d027c6c84fd3ba7c577c52b9fdade77e7ff886e0)]:
  - @tsrx/core@0.0.5

## 0.0.4

### Patch Changes

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
  Thanks [@trueadm](https://github.com/trueadm)! - Fix silent failure when
  `{html expr}` appears at the component body level (outside any element) on the
  React target. `is_jsx_child` was missing the `'Html'` node type, so the node was
  incorrectly classified as a non-JSX statement and landed in the function body as
  an invalid AST node instead of surfacing the "not supported on the React target"
  compile error.

## 0.0.3

### Patch Changes

- [#884](https://github.com/Ripple-TS/ripple/pull/884)
  [`1e34bbd`](https://github.com/Ripple-TS/ripple/commit/1e34bbd762bc931c34e562bf100aeb103aa45368)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix static hoisting incorrectly
  hoisting elements that reference component-scope bindings as JSX tag names
  (including JSXMemberExpression objects like `<ui.Button />`), and fix lazy
  destructuring transforms incorrectly rewriting references to block-scoped
  variables that shadow lazy binding names

## 0.0.2

### Patch Changes

- [#869](https://github.com/Ripple-TS/ripple/pull/869)
  [`4cb69cc`](https://github.com/Ripple-TS/ripple/commit/4cb69cc780d48c26493e3144006caf4b11df8e1d)
  Thanks [@trueadm](https://github.com/trueadm)! - Add @tsrx/react package — a
  React compiler built on @tsrx/core that transforms .tsrx files into React
  components

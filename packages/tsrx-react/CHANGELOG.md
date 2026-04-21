# @tsrx/react

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

# @tsrx/react

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

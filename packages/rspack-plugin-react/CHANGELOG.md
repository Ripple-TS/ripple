# @tsrx/rspack-plugin-react

## 0.0.3

### Patch Changes

- Updated dependencies
  [[`f82f95f`](https://github.com/Ripple-TS/ripple/commit/f82f95fcf99aa58be086c69a37ed0e5b170e1a76),
  [`1856b0f`](https://github.com/Ripple-TS/ripple/commit/1856b0f2df681b501253ebb8d8314b84fceb822b)]:
  - @tsrx/react@0.1.0

## 0.0.2

### Patch Changes

- [#904](https://github.com/Ripple-TS/ripple/pull/904)
  [`d28aa89`](https://github.com/Ripple-TS/ripple/commit/d28aa892849d18da13fe28549a1dd3c79133e39c)
  Thanks [@trueadm](https://github.com/trueadm)! - Add
  `@tsrx/rspack-plugin-react`, an Rspack plugin for `.tsrx` modules that compiles
  them via `@tsrx/react` and then delegates the final JSX transform to rspack's
  `builtin:swc-loader`. Per-component `<style>` blocks are imported via a sibling
  `?tsrx-css&lang.css` query and handled by rspack's built-in CSS module type.

- [#904](https://github.com/Ripple-TS/ripple/pull/904)
  [`d28aa89`](https://github.com/Ripple-TS/ripple/commit/d28aa892849d18da13fe28549a1dd3c79133e39c)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix the JS loader to avoid
  forwarding a stale source map after prepending a virtual CSS import.

- Updated dependencies
  [[`0babf74`](https://github.com/Ripple-TS/ripple/commit/0babf745f0bdfe04a70d8f19730097007c4f1705)]:
  - @tsrx/react@0.0.7

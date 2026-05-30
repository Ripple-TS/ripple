# @tsrx/bun-plugin-solid

## 0.0.13

### Patch Changes

- Updated dependencies
  [[`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc),
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)]:
  - @tsrx/solid@0.1.19

## 0.0.12

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.18

## 0.0.11

### Patch Changes

- [#1177](https://github.com/Ripple-TS/ripple/pull/1177)
  [`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)
  Thanks [@trueadm](https://github.com/trueadm)! - Parse tags and bare fragments
  as native TSRX by default, remove `component` keyword parsing, and
  compile/format/lint function components that return native TSRX across the
  React, Preact, Solid, Vue, and Ripple targets. Ripple component compilation now
  only renders TSRX reachable from returned values and supports string and `null`
  component returns.

  Ripple now also preserves directly called PascalCase helpers as ordinary
  functions while still compiling renderable component functions used as
  components or render entries.

  The old explicit TSRX wrapper tag is no longer special; TSRX elements and
  fragments are the default expression syntax, and the tag name is treated like
  any ordinary element name.

  Ripple now exports a typed `Fragment` helper from its public runtimes and
  supports `innerHTML` on both host elements and `Fragment`. Ripple also treats
  `innerHTML` from element spreads as rendered content instead of serializing it
  as an `innerhtml` attribute.

  The `{html ...}` template directive has been removed. Use each target's native
  raw HTML prop instead, such as `innerHTML` for Ripple/Solid/Vue or
  `dangerouslySetInnerHTML` for React/Preact.

  The `{text ...}` template directive has also been removed. Text values now use
  ordinary `{expr}` containers, with explicit coercion written as JavaScript
  (`String(value)`, `value + ''`, or a typed string value). Ripple optimizes
  clearly string-shaped expressions and typed string props into text-node updates
  without requiring a TSRX-specific directive.

- Updated dependencies
  [[`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)]:
  - @tsrx/solid@0.1.17

## 0.0.10

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.16

## 0.0.9

### Patch Changes

- Updated dependencies
  [[`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/solid@0.1.15

## 0.0.8

### Patch Changes

- Updated dependencies
  [[`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/solid@0.1.14

## 0.0.7

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.13

## 0.0.6

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.12

## 0.0.5

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.11

## 0.0.4

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.10

## 0.0.3

### Patch Changes

- Updated dependencies
  [[`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)]:
  - @tsrx/solid@0.1.9

## 0.0.2

### Patch Changes

- [#1073](https://github.com/Ripple-TS/ripple/pull/1073)
  [`8e96911`](https://github.com/Ripple-TS/ripple/commit/8e969112d486413837f25f5be5b1683e678224ad)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - Add a Bun
  plugin for compiling `.tsrx` files with `@tsrx/solid`, running Solid's Babel JSX
  transform, and emitting component-local styles as virtual CSS modules.

- Updated dependencies
  [[`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/solid@0.1.8

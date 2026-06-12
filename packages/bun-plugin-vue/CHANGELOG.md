# @tsrx/bun-plugin-vue

## 0.0.34

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.30

## 0.0.33

### Patch Changes

- Updated dependencies
  [[`b1256fd`](https://github.com/Ripple-TS/ripple/commit/b1256fdb5bf279ee7dd20bf1a71dcfccc47e279c)]:
  - @tsrx/vue@0.1.29

## 0.0.32

### Patch Changes

- Updated dependencies
  [[`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482)]:
  - @tsrx/vue@0.1.28

## 0.0.31

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.27

## 0.0.30

### Patch Changes

- Updated dependencies
  [[`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9)]:
  - @tsrx/vue@0.1.26

## 0.0.29

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.25

## 0.0.28

### Patch Changes

- Updated dependencies
  [[`6fd49c9`](https://github.com/Ripple-TS/ripple/commit/6fd49c9dd737e889844e254763f66e13ea4a7241)]:
  - @tsrx/vue@0.1.24

## 0.0.27

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.23

## 0.0.26

### Patch Changes

- Updated dependencies
  [[`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)]:
  - @tsrx/vue@0.1.22

## 0.0.25

### Patch Changes

- Updated dependencies
  [[`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)]:
  - @tsrx/vue@0.1.21

## 0.0.24

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.20

## 0.0.23

### Patch Changes

- Updated dependencies
  [[`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc),
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)]:
  - @tsrx/vue@0.1.19

## 0.0.22

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.18

## 0.0.21

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
  - @tsrx/vue@0.1.17

## 0.0.20

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.16

## 0.0.19

### Patch Changes

- Updated dependencies
  [[`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/vue@0.1.15

## 0.0.18

### Patch Changes

- Updated dependencies
  [[`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/vue@0.1.14

## 0.0.17

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.13

## 0.0.16

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.12

## 0.0.15

### Patch Changes

- [#1145](https://github.com/Ripple-TS/ripple/pull/1145)
  [`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add Vue Vapor support for
  TSRX `try/pending` by lowering pending blocks to Vue Suspense slots.

- Updated dependencies
  [[`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a),
  [`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a)]:
  - @tsrx/vue@0.1.11

## 0.0.14

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.10

## 0.0.13

### Patch Changes

- Updated dependencies
  [[`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)]:
  - @tsrx/vue@0.1.9

## 0.0.12

### Patch Changes

- Updated dependencies
  [[`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/vue@0.1.8

## 0.0.11

### Patch Changes

- Updated dependencies
  [[`e4a04dd`](https://github.com/Ripple-TS/ripple/commit/e4a04ddb4bbc8e21a9c7c2c65b179d764b72e4fb)]:
  - @tsrx/vue@0.1.7

## 0.0.10

### Patch Changes

- Updated dependencies
  [[`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)]:
  - @tsrx/vue@0.1.6

## 0.0.9

### Patch Changes

- Updated dependencies
  [[`18b4aef`](https://github.com/Ripple-TS/ripple/commit/18b4aefa8127e56a9f1b3058da2d4d2172551579)]:
  - @tsrx/vue@0.1.5

## 0.0.8

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.4

## 0.0.7

### Patch Changes

- Updated dependencies
  [[`4f360f0`](https://github.com/Ripple-TS/ripple/commit/4f360f008edf61492cf85afa646c797c80a73f22),
  [`2ae792c`](https://github.com/Ripple-TS/ripple/commit/2ae792cdca7d466e552a330ea965cefec2b1f5a5)]:
  - @tsrx/vue@0.1.3

## 0.0.6

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.2

## 0.0.5

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.1

## 0.0.4

### Patch Changes

- Updated dependencies
  [[`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)]:
  - @tsrx/vue@0.1.0

## 0.0.3

### Patch Changes

- Updated dependencies
  [[`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)]:
  - @tsrx/vue@0.0.23

## 0.0.2

### Patch Changes

- [#1041](https://github.com/Ripple-TS/ripple/pull/1041)
  [`b1e717e`](https://github.com/Ripple-TS/ripple/commit/b1e717e33283f17209c5b4fc2bc2e70037d90460)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - Add a Bun
  plugin for compiling `.tsrx` files with `@tsrx/vue`, running the downstream
  `vue-jsx-vapor` transform, and emitting component-local styles as virtual CSS
  modules.

# @tsrx/vite-plugin-vue

## 0.0.37

### Patch Changes

- Updated dependencies
  [[`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)]:
  - @tsrx/vue@0.1.21

## 0.0.36

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.20

## 0.0.35

### Patch Changes

- Updated dependencies
  [[`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc),
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)]:
  - @tsrx/vue@0.1.19

## 0.0.34

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.18

## 0.0.33

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

## 0.0.32

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.16

## 0.0.31

### Patch Changes

- Updated dependencies
  [[`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/vue@0.1.15

## 0.0.30

### Patch Changes

- Updated dependencies
  [[`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/vue@0.1.14

## 0.0.29

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.13

## 0.0.28

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.12

## 0.0.27

### Patch Changes

- [#1148](https://github.com/Ripple-TS/ripple/pull/1148)
  [`78d766a`](https://github.com/Ripple-TS/ripple/commit/78d766ad263152cd7a8decf64979d33be52a0124)
  Thanks [@aleclarson](https://github.com/aleclarson)! - Chain TSRX compiler
  source maps through the Vite JSX transform so browser devtools show original
  `.tsrx` sources instead of generated TSX.

## 0.0.26

### Patch Changes

- [#1145](https://github.com/Ripple-TS/ripple/pull/1145)
  [`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add Vue Vapor support for
  TSRX `try/pending` by lowering pending blocks to Vue Suspense slots.

- Updated dependencies
  [[`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a),
  [`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a)]:
  - @tsrx/vue@0.1.11

## 0.0.25

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.10

## 0.0.24

### Patch Changes

- Updated dependencies
  [[`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)]:
  - @tsrx/vue@0.1.9

## 0.0.23

### Patch Changes

- Updated dependencies
  [[`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/vue@0.1.8

## 0.0.22

### Patch Changes

- Updated dependencies
  [[`e4a04dd`](https://github.com/Ripple-TS/ripple/commit/e4a04ddb4bbc8e21a9c7c2c65b179d764b72e4fb)]:
  - @tsrx/vue@0.1.7

## 0.0.21

### Patch Changes

- Updated dependencies
  [[`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)]:
  - @tsrx/vue@0.1.6

## 0.0.20

### Patch Changes

- Updated dependencies
  [[`18b4aef`](https://github.com/Ripple-TS/ripple/commit/18b4aefa8127e56a9f1b3058da2d4d2172551579)]:
  - @tsrx/vue@0.1.5

## 0.0.19

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.4

## 0.0.18

### Patch Changes

- Updated dependencies
  [[`4f360f0`](https://github.com/Ripple-TS/ripple/commit/4f360f008edf61492cf85afa646c797c80a73f22),
  [`2ae792c`](https://github.com/Ripple-TS/ripple/commit/2ae792cdca7d466e552a330ea965cefec2b1f5a5)]:
  - @tsrx/vue@0.1.3

## 0.0.17

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.2

## 0.0.16

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.1.1

## 0.0.15

### Patch Changes

- Updated dependencies
  [[`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)]:
  - @tsrx/vue@0.1.0

## 0.0.14

### Patch Changes

- [#1071](https://github.com/Ripple-TS/ripple/pull/1071)
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add named ref props with
  `prop_name={ref expr}` syntax and expose `isRefProp()` for runtime detection of
  named ref prop values.
- Updated dependencies
  [[`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)]:
  - @tsrx/vue@0.0.23

## 0.0.13

### Patch Changes

- [#1063](https://github.com/Ripple-TS/ripple/pull/1063)
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Standardizes compile api
  across all packages, including forcing types to adhere to the standard. Adds
  more debug compile options to the playgrounds.

- [#1062](https://github.com/Ripple-TS/ripple/pull/1062)
  [`1d51061`](https://github.com/Ripple-TS/ripple/commit/1d51061890bc6dfc5f8e177455b91ab93977db1d)
  Thanks [@trueadm](https://github.com/trueadm)! - Lower Vue `for...of` templates
  to `VaporFor` so loop item and key callbacks preserve types. Update the Vue
  plugin bridge and peer floor for the `vue-jsx-vapor` runtime that provides
  `VaporFor`.

- Updated dependencies
  [[`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6),
  [`29ac6d7`](https://github.com/Ripple-TS/ripple/commit/29ac6d757b376e4102c4c8c8d3d47f7ae3afdd00),
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b),
  [`4cd0986`](https://github.com/Ripple-TS/ripple/commit/4cd0986201e960cd8544d0f789d17a217e93f954),
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124),
  [`1d51061`](https://github.com/Ripple-TS/ripple/commit/1d51061890bc6dfc5f8e177455b91ab93977db1d)]:
  - @tsrx/vue@0.0.22

## 0.0.12

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.0.21

## 0.0.11

### Patch Changes

- Updated dependencies
  [[`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)]:
  - @tsrx/vue@0.0.20

## 0.0.10

### Patch Changes

- Updated dependencies
  [[`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)]:
  - @tsrx/vue@0.0.19

## 0.0.9

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.0.18

## 0.0.8

### Patch Changes

- Updated dependencies
  [[`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)]:
  - @tsrx/vue@0.0.17

## 0.0.7

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.0.16

## 0.0.6

### Patch Changes

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/vue@0.0.15

## 0.0.5

### Patch Changes

- Updated dependencies
  [[`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108)]:
  - @tsrx/vue@0.0.14

## 0.0.4

### Patch Changes

- Updated dependencies
  [[`bce43be`](https://github.com/Ripple-TS/ripple/commit/bce43be304812ca04dd8d196e2439f28ea392237)]:
  - @tsrx/vue@0.0.13

## 0.0.3

### Patch Changes

- Updated dependencies []:
  - @tsrx/vue@0.0.12

## 0.0.2

### Patch Changes

- Updated dependencies
  [[`f660969`](https://github.com/Ripple-TS/ripple/commit/f66096972bc8d2f03061e6018d03e40207761aaa),
  [`f660969`](https://github.com/Ripple-TS/ripple/commit/f66096972bc8d2f03061e6018d03e40207761aaa)]:
  - @tsrx/vue@0.0.11

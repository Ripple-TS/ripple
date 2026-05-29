# @tsrx/rspack-plugin-solid

## 0.0.30

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

## 0.0.29

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.16

## 0.0.28

### Patch Changes

- Updated dependencies
  [[`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/solid@0.1.15

## 0.0.27

### Patch Changes

- Updated dependencies
  [[`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/solid@0.1.14

## 0.0.26

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.13

## 0.0.25

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.12

## 0.0.24

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.11

## 0.0.23

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.10

## 0.0.22

### Patch Changes

- Updated dependencies
  [[`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)]:
  - @tsrx/solid@0.1.9

## 0.0.21

### Patch Changes

- Updated dependencies
  [[`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/solid@0.1.8

## 0.0.20

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.7

## 0.0.19

### Patch Changes

- Updated dependencies
  [[`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)]:
  - @tsrx/solid@0.1.6

## 0.0.18

### Patch Changes

- Updated dependencies
  [[`18b4aef`](https://github.com/Ripple-TS/ripple/commit/18b4aefa8127e56a9f1b3058da2d4d2172551579)]:
  - @tsrx/solid@0.1.5

## 0.0.17

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.4

## 0.0.16

### Patch Changes

- Updated dependencies
  [[`4f360f0`](https://github.com/Ripple-TS/ripple/commit/4f360f008edf61492cf85afa646c797c80a73f22),
  [`2ae792c`](https://github.com/Ripple-TS/ripple/commit/2ae792cdca7d466e552a330ea965cefec2b1f5a5)]:
  - @tsrx/solid@0.1.3

## 0.0.15

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.2

## 0.0.14

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.1.1

## 0.0.13

### Patch Changes

- Updated dependencies
  [[`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)]:
  - @tsrx/solid@0.1.0

## 0.0.12

### Patch Changes

- Updated dependencies
  [[`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)]:
  - @tsrx/solid@0.0.28

## 0.0.11

### Patch Changes

- [#1063](https://github.com/Ripple-TS/ripple/pull/1063)
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Standardizes compile api
  across all packages, including forcing types to adhere to the standard. Adds
  more debug compile options to the playgrounds.
- Updated dependencies
  [[`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6),
  [`29ac6d7`](https://github.com/Ripple-TS/ripple/commit/29ac6d757b376e4102c4c8c8d3d47f7ae3afdd00),
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b),
  [`4cd0986`](https://github.com/Ripple-TS/ripple/commit/4cd0986201e960cd8544d0f789d17a217e93f954),
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)]:
  - @tsrx/solid@0.0.27

## 0.0.10

### Patch Changes

- Updated dependencies
  [[`8125c73`](https://github.com/Ripple-TS/ripple/commit/8125c73b37e7b201dbb0a078e3583c022ceb7687)]:
  - @tsrx/solid@0.0.26

## 0.0.9

### Patch Changes

- Updated dependencies
  [[`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)]:
  - @tsrx/solid@0.0.25

## 0.0.8

### Patch Changes

- Updated dependencies
  [[`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)]:
  - @tsrx/solid@0.0.24

## 0.0.7

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.0.23

## 0.0.6

### Patch Changes

- Updated dependencies
  [[`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)]:
  - @tsrx/solid@0.0.22

## 0.0.5

### Patch Changes

- Updated dependencies []:
  - @tsrx/solid@0.0.21

## 0.0.4

### Patch Changes

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/solid@0.0.20

## 0.0.3

### Patch Changes

- Updated dependencies
  [[`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108)]:
  - @tsrx/solid@0.0.19

## 0.0.2

### Patch Changes

- [#1003](https://github.com/Ripple-TS/ripple/pull/1003)
  [`b133df0`](https://github.com/Ripple-TS/ripple/commit/b133df0b56aa066d6ffb8fc171fb1163a591576d)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - Add a Solid
  Rspack plugin that compiles `.tsrx` with `@tsrx/solid`, runs the final
  TypeScript + JSX transform through Babel, and extracts component-local `<style>`
  blocks through Rspack's CSS pipeline.
- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7),
  [`bce43be`](https://github.com/Ripple-TS/ripple/commit/bce43be304812ca04dd8d196e2439f28ea392237)]:
  - @tsrx/solid@0.0.18

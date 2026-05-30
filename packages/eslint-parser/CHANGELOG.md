# @tsrx/eslint-parser

## 0.3.70

### Patch Changes

- Updated dependencies
  [[`5c0b0ff`](https://github.com/Ripple-TS/ripple/commit/5c0b0ff031ddfb319bb048d627e2d2a2a49c1f1d)]:
  - @tsrx/core@0.1.18

## 0.3.69

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
  - @tsrx/core@0.1.17

## 0.3.68

### Patch Changes

- Updated dependencies
  [[`d045396`](https://github.com/Ripple-TS/ripple/commit/d0453962cfe1df7a98a0981b0bf3e5729195a9ae)]:
  - @tsrx/core@0.1.16

## 0.3.67

### Patch Changes

- Updated dependencies
  [[`ea717f2`](https://github.com/Ripple-TS/ripple/commit/ea717f2ac20901aca59946c1cea8066c28a4220c),
  [`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/core@0.1.15

## 0.3.66

### Patch Changes

- Updated dependencies
  [[`1dc0331`](https://github.com/Ripple-TS/ripple/commit/1dc0331f7b7296545ee459dc31a92057871cbb0d),
  [`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/core@0.1.14

## 0.3.65

### Patch Changes

- Updated dependencies
  [[`95c2976`](https://github.com/Ripple-TS/ripple/commit/95c2976b9ec2c20c4160ad13b636c1ed03e863ef)]:
  - @tsrx/core@0.1.13

## 0.3.64

## 0.3.63

### Patch Changes

- Updated dependencies
  [[`2acbbea`](https://github.com/Ripple-TS/ripple/commit/2acbbea9253ac8f516fe0d3a7a38331490e6fd8b),
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)]:
  - @tsrx/core@0.1.12

## 0.3.62

## 0.3.61

### Patch Changes

- Updated dependencies
  [[`0de733f`](https://github.com/Ripple-TS/ripple/commit/0de733f05800df5d3854eb69e012e9aeaf098f8a)]:
  - @tsrx/core@0.1.11

## 0.3.60

### Patch Changes

- Updated dependencies
  [[`8c064c8`](https://github.com/Ripple-TS/ripple/commit/8c064c888b60e4fcf88f6828e51792b3bba5797a)]:
  - @tsrx/core@0.1.10

## 0.3.59

### Patch Changes

- Updated dependencies
  [[`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)]:
  - @tsrx/core@0.1.9

## 0.3.58

### Patch Changes

- [#1127](https://github.com/Ripple-TS/ripple/pull/1127)
  [`aaa33db`](https://github.com/Ripple-TS/ripple/commit/aaa33dbdfdc7bef2d813bbe87689d9cdb2bae9ae)
  Thanks [@aleclarson](https://github.com/aleclarson)! - Use `@tsrx/core` directly
  from the ESLint parser.

- Updated dependencies
  [[`b54fdfc`](https://github.com/Ripple-TS/ripple/commit/b54fdfc3ebfea29ac613307b76732c5bf5f49ab5),
  [`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/core@0.1.8

## 0.3.57

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.7

## 0.3.56

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.6

## 0.3.55

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.5

## 0.3.54

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.4

## 0.3.53

### Patch Changes

- Updated dependencies
  [[`c042672`](https://github.com/Ripple-TS/ripple/commit/c04267255d35945753ca8090006622c96fa0a14f)]:
  - @tsrx/ripple@0.1.3

## 0.3.52

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.2

## 0.3.51

### Patch Changes

- [`f1b1f94`](https://github.com/Ripple-TS/ripple/commit/f1b1f9475553cbe3632a5cc9794a8f54615c29f2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Patch packages currently
  versioned at 0.3.50 to fix the bump that caused major 1.0.0 release with a minor
  changeset.

- Updated dependencies []:
  - @tsrx/ripple@0.1.1

## 0.3.50

### Patch Changes

- Updated dependencies
  [[`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)]:
  - @tsrx/ripple@0.1.0

## 0.3.49

### Patch Changes

- Updated dependencies
  [[`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)]:
  - @tsrx/ripple@0.0.30

## 0.3.48

## 0.3.47

### Patch Changes

- Updated dependencies
  [[`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6),
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b),
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)]:
  - @tsrx/ripple@0.0.29

## 0.3.46

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.28

## 0.3.45

### Patch Changes

- Updated dependencies
  [[`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)]:
  - @tsrx/ripple@0.0.27

## 0.3.44

### Patch Changes

- Updated dependencies
  [[`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)]:
  - @tsrx/ripple@0.0.26

## 0.3.43

### Patch Changes

- Updated dependencies
  [[`5c6ee71`](https://github.com/Ripple-TS/ripple/commit/5c6ee71bfd4f5dc443c43eb34e631bb032606faf),
  [`83b19fd`](https://github.com/Ripple-TS/ripple/commit/83b19fd67aa27eb10e93205dd88c61b13ffbc523)]:
  - @tsrx/ripple@0.0.25

## 0.3.42

### Patch Changes

- Updated dependencies
  [[`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)]:
  - @tsrx/ripple@0.0.24

## 0.3.41

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.23

## 0.3.40

### Patch Changes

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/ripple@0.0.22

## 0.3.39

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.21

## 0.3.38

### Patch Changes

- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7)]:
  - @tsrx/ripple@0.0.20

## 0.3.37

### Patch Changes

- Updated dependencies
  [[`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)]:
  - @tsrx/ripple@0.0.19

## 0.3.36

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.18

## 0.3.35

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.17

## 0.3.34

### Patch Changes

- Updated dependencies
  [[`fee8620`](https://github.com/Ripple-TS/ripple/commit/fee8620fa4e82a7c7e4adb3e434e9db552a3e157),
  [`2fcacb4`](https://github.com/Ripple-TS/ripple/commit/2fcacb471d7780074f92b20c9b394f7650a941bb)]:
  - @tsrx/ripple@0.0.16

## 0.3.33

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.15

## 0.3.32

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.14

## 0.3.31

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.13

## 0.3.30

### Patch Changes

- Updated dependencies
  [[`7f59ed8`](https://github.com/Ripple-TS/ripple/commit/7f59ed80d7b44c847fb9eb8bf00d4fe9835c3136)]:
  - @tsrx/ripple@0.0.12

## 0.3.29

### Patch Changes

- Updated dependencies
  [[`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)]:
  - @tsrx/ripple@0.0.11

## 0.3.28

### Patch Changes

- Updated dependencies
  [[`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8),
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)]:
  - @tsrx/ripple@0.0.10

## 0.3.27

## 0.3.26

### Patch Changes

- [`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Correct package versions.

- Updated dependencies []:
  - @tsrx/ripple@0.0.9

## 1.0.1

### Patch Changes

- Updated dependencies
  [[`316cba1`](https://github.com/Ripple-TS/ripple/commit/316cba18614e5ef59dce15e0de6e720eb922955f)]:
  - @tsrx/ripple@0.0.8

## 1.0.0

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.7

## 0.3.25

## 0.3.24

## 0.3.23

### Patch Changes

- Updated dependencies
  [[`73ceaac`](https://github.com/Ripple-TS/ripple/commit/73ceaacd029fb634a62252abdda59ab5f2bec15d)]:
  - @tsrx/ripple@0.0.6

## 0.3.22

## 0.3.21

## 0.3.20

### Patch Changes

- [#879](https://github.com/Ripple-TS/ripple/pull/879)
  [`7ff7cfa`](https://github.com/Ripple-TS/ripple/commit/7ff7cfad33b2c31f742d410d7e2450066b735d92)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - chore: drop
  Node 20 support

## 0.3.19

## 0.3.18

## 0.3.17

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.5

## 0.3.16

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.4

## 0.3.15

### Patch Changes

- Updated dependencies
  [[`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)]:
  - @tsrx/ripple@0.0.3

## 0.3.14

### Patch Changes

- Updated dependencies
  [[`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)]:
  - @tsrx/ripple@0.0.2

## 0.3.13

## 0.3.12

## 0.3.11

## 0.3.10

## 0.3.9

## 0.3.8

## 0.3.7

## 0.3.6

## 0.3.5

## 0.3.4

## 0.3.3

## 0.3.2

## 0.3.1

## 0.3.0

### Minor Changes

- [#779](https://github.com/Ripple-TS/ripple/pull/779)
  [`74a10cc`](https://github.com/Ripple-TS/ripple/commit/74a10cc5701962cd7c72b144d59b35ecb76263a3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Introduces #ripple namespace
  for creating ripple reactive entities without imports, such as array, object,
  map, set, date, url, urlSearchParams, mediaQuery. Adds track, untrack,
  trackSplit, effect, context, server, style to the namespace. Deprecates #[] and
  #{} in favor of #ripple[] and #ripple{}. Renames types and actual reactive
  imports for TrackedX entities, such as TrackedArray, TrackedObject, etc. into
  RippleArray, RippleObjec, etc.

## 0.2.216

## 0.2.215

## 0.2.214

## 0.2.213

## 0.2.212

## 0.2.211

## 0.2.210

## 0.2.209

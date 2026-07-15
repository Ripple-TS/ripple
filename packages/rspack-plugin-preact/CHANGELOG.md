# @tsrx/rspack-plugin-preact

## 0.0.56

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.40

## 0.0.55

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.39

## 0.0.54

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.38

## 0.0.53

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.37

## 0.0.52

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.36

## 0.0.51

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.35

## 0.0.50

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.34

## 0.0.49

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.33

## 0.0.48

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.32

## 0.0.47

### Patch Changes

- Updated dependencies
  [[`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e)]:
  - @tsrx/preact@0.1.31

## 0.0.46

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.30

## 0.0.45

### Patch Changes

- Updated dependencies
  [[`b1256fd`](https://github.com/Ripple-TS/ripple/commit/b1256fdb5bf279ee7dd20bf1a71dcfccc47e279c)]:
  - @tsrx/preact@0.1.29

## 0.0.44

### Patch Changes

- Updated dependencies
  [[`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482)]:
  - @tsrx/preact@0.1.28

## 0.0.43

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.27

## 0.0.42

### Patch Changes

- Updated dependencies
  [[`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9)]:
  - @tsrx/preact@0.1.26

## 0.0.41

### Patch Changes

- Updated dependencies
  [[`1693c9e`](https://github.com/Ripple-TS/ripple/commit/1693c9e6daf1421e71171fe3c50e37adfc858b69)]:
  - @tsrx/preact@0.1.25

## 0.0.40

### Patch Changes

- Updated dependencies
  [[`6fd49c9`](https://github.com/Ripple-TS/ripple/commit/6fd49c9dd737e889844e254763f66e13ea4a7241)]:
  - @tsrx/preact@0.1.24

## 0.0.39

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.23

## 0.0.38

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.22

## 0.0.37

### Patch Changes

- Updated dependencies
  [[`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)]:
  - @tsrx/preact@0.1.21

## 0.0.36

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.20

## 0.0.35

### Patch Changes

- Updated dependencies
  [[`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc),
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)]:
  - @tsrx/preact@0.1.19

## 0.0.34

### Patch Changes

- Updated dependencies
  [[`5c0b0ff`](https://github.com/Ripple-TS/ripple/commit/5c0b0ff031ddfb319bb048d627e2d2a2a49c1f1d)]:
  - @tsrx/preact@0.1.18

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
  - @tsrx/preact@0.1.17

## 0.0.32

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.16

## 0.0.31

### Patch Changes

- Updated dependencies
  [[`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/preact@0.1.15

## 0.0.30

### Patch Changes

- Updated dependencies
  [[`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/preact@0.1.14

## 0.0.29

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.13

## 0.0.28

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.12

## 0.0.27

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.11

## 0.0.26

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.10

## 0.0.25

### Patch Changes

- Updated dependencies
  [[`b1d6de0`](https://github.com/Ripple-TS/ripple/commit/b1d6de05912aca4cf40af68f291851eda706140c)]:
  - @tsrx/preact@0.1.9

## 0.0.24

### Patch Changes

- Updated dependencies
  [[`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/preact@0.1.8

## 0.0.23

### Patch Changes

- Updated dependencies
  [[`2b1f746`](https://github.com/Ripple-TS/ripple/commit/2b1f7469ab31713140a5baf912a19fa8eedb9234)]:
  - @tsrx/preact@0.1.7

## 0.0.22

### Patch Changes

- Updated dependencies
  [[`a59ccb8`](https://github.com/Ripple-TS/ripple/commit/a59ccb83b91257bf34fca2ba1415e77d1f815a7b)]:
  - @tsrx/preact@0.1.6

## 0.0.21

### Patch Changes

- Updated dependencies
  [[`de27e18`](https://github.com/Ripple-TS/ripple/commit/de27e182d002ea736aee992acca4cbf9873a307d),
  [`1256569`](https://github.com/Ripple-TS/ripple/commit/12565695efaa3a4ad429245807721ea671c2ecb5),
  [`18b4aef`](https://github.com/Ripple-TS/ripple/commit/18b4aefa8127e56a9f1b3058da2d4d2172551579)]:
  - @tsrx/preact@0.1.5

## 0.0.20

### Patch Changes

- Updated dependencies
  [[`3e84758`](https://github.com/Ripple-TS/ripple/commit/3e847588027d6254c3999a87c717e9d58fb55a26)]:
  - @tsrx/preact@0.1.4

## 0.0.19

### Patch Changes

- Updated dependencies
  [[`4f360f0`](https://github.com/Ripple-TS/ripple/commit/4f360f008edf61492cf85afa646c797c80a73f22),
  [`c042672`](https://github.com/Ripple-TS/ripple/commit/c04267255d35945753ca8090006622c96fa0a14f),
  [`2ae792c`](https://github.com/Ripple-TS/ripple/commit/2ae792cdca7d466e552a330ea965cefec2b1f5a5)]:
  - @tsrx/preact@0.1.3

## 0.0.18

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.2

## 0.0.17

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.1.1

## 0.0.16

### Patch Changes

- Updated dependencies
  [[`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)]:
  - @tsrx/preact@0.1.0

## 0.0.15

### Patch Changes

- Updated dependencies
  [[`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471),
  [`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)]:
  - @tsrx/preact@0.0.23

## 0.0.14

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
  - @tsrx/preact@0.0.22

## 0.0.13

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.0.21

## 0.0.12

### Patch Changes

- Updated dependencies
  [[`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)]:
  - @tsrx/preact@0.0.20

## 0.0.11

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.0.19

## 0.0.10

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.0.18

## 0.0.9

### Patch Changes

- Updated dependencies
  [[`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)]:
  - @tsrx/preact@0.0.17

## 0.0.8

### Patch Changes

- Updated dependencies
  [[`76fd362`](https://github.com/Ripple-TS/ripple/commit/76fd3622f3e6432787fadb1a96337541424b25aa)]:
  - @tsrx/preact@0.0.16

## 0.0.7

### Patch Changes

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/preact@0.0.15

## 0.0.6

### Patch Changes

- Updated dependencies
  [[`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108),
  [`7832be8`](https://github.com/Ripple-TS/ripple/commit/7832be8d1d2937e7f1005ab79e964329d42e0108)]:
  - @tsrx/preact@0.0.14

## 0.0.5

### Patch Changes

- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7),
  [`bce43be`](https://github.com/Ripple-TS/ripple/commit/bce43be304812ca04dd8d196e2439f28ea392237)]:
  - @tsrx/preact@0.0.13

## 0.0.4

### Patch Changes

- Updated dependencies
  [[`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)]:
  - @tsrx/preact@0.0.12

## 0.0.3

### Patch Changes

- Updated dependencies []:
  - @tsrx/preact@0.0.11

## 0.0.2

### Patch Changes

- [#947](https://github.com/Ripple-TS/ripple/pull/947)
  [`0c18739`](https://github.com/Ripple-TS/ripple/commit/0c18739aca48a4b80492c378e7d1caafab8beab3)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - Add a
  Rspack plugin for compiling TSRX to Preact

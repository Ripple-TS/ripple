# @ripple-ts/vite-plugin

## 0.3.98

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.98

## 0.3.97

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.41
  - @ripple-ts/adapter@0.3.97

## 0.3.96

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.40
  - @ripple-ts/adapter@0.3.96

## 0.3.95

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.95

## 0.3.94

### Patch Changes

- Updated dependencies
  [[`78502e4`](https://github.com/Ripple-TS/ripple/commit/78502e46929df2165d288dbb2483f48e9254ef35)]:
  - @tsrx/ripple@0.1.39
  - @ripple-ts/adapter@0.3.94

## 0.3.93

### Patch Changes

- [`9db5a49`](https://github.com/Ripple-TS/ripple/commit/9db5a49e45c2eb3bb4f6b46c65c0aaf9016633ad)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Rename the `ripple/server`
  helper exports to camelCase: `create_ssr_stream` is now `createStream` and
  `get_css_for_hashes` is now `getCss` (returning the CSS text for the scoped
  style hashes collected by `render()`). The old snake_case exports are removed;
  update imports accordingly. The vite plugin consumes the new names internally.
- Updated dependencies []:
  - @ripple-ts/adapter@0.3.93

## 0.3.92

### Patch Changes

- [#1326](https://github.com/Ripple-TS/ripple/pull/1326)
  [`fea49bf`](https://github.com/Ripple-TS/ripple/commit/fea49bfb4410a05e0c915dfa39acdaba7f542737)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Streaming SSR:
  `render(App, { stream })` now streams progressively. The synchronous shell (with
  pending fallbacks for suspended `@try` boundaries and all CSS registered so far)
  is flushed immediately; each boundary's content streams out of order as a framed
  chunk once its async work settles, including per-chunk CSS, trackAsync envelopes
  and `<head>` content. A tiny inline runtime swaps chunks into their slots before
  hydration, and hydrated boundaries activate streamed chunks in place afterwards
  — claiming the streamed DOM without re-rendering. Catch-only async boundaries
  stream an empty slot and resolve to their body or server-rendered catch; errors
  whose catch region is already on the wire hand off to the client boundary via an
  error envelope. `render` also gains a `streamTemplate` option for document
  scaffolding, and the vite plugin streams render-route responses when
  `ssr.streaming` is enabled in ripple.config.ts (falling back to buffered SSR
  when index.html lacks the `<!--ssr-head-->`/`<!--ssr-body-->` markers).
- Updated dependencies []:
  - @ripple-ts/adapter@0.3.92

## 0.3.91

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.38
  - @ripple-ts/adapter@0.3.91

## 0.3.90

### Patch Changes

- Updated dependencies
  [[`1925074`](https://github.com/Ripple-TS/ripple/commit/1925074254de0e61c8578cba136c50ea8f89cd35)]:
  - @tsrx/ripple@0.1.37
  - @ripple-ts/adapter@0.3.90

## 0.3.89

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.36
  - @ripple-ts/adapter@0.3.89

## 0.3.88

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.88

## 0.3.87

### Patch Changes

- Updated dependencies
  [[`cc95ffa`](https://github.com/Ripple-TS/ripple/commit/cc95ffaef3f3d3cd252176ea94308f89739f0212),
  [`6f78b7f`](https://github.com/Ripple-TS/ripple/commit/6f78b7ff5a5e1f9873a839b709f38e9506545a63)]:
  - @tsrx/ripple@0.1.35
  - @ripple-ts/adapter@0.3.87

## 0.3.86

### Patch Changes

- Updated dependencies
  [[`e4e6d7b`](https://github.com/Ripple-TS/ripple/commit/e4e6d7b854786ad19a2c86276ea7e0ffb062e61a)]:
  - @tsrx/ripple@0.1.34
  - @ripple-ts/adapter@0.3.86

## 0.3.85

### Patch Changes

- Updated dependencies
  [[`ba498cd`](https://github.com/Ripple-TS/ripple/commit/ba498cde76e9f83235ce91da825f403a28441bff),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`0e9f523`](https://github.com/Ripple-TS/ripple/commit/0e9f52358a615c2fc7759544e96c43dccb533c86),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`35ac700`](https://github.com/Ripple-TS/ripple/commit/35ac70052d79efae41bb1df2440fee3f052ca115),
  [`f55466b`](https://github.com/Ripple-TS/ripple/commit/f55466bde65d0cff00c0c4525af9d68ae794ffd2),
  [`bbc3843`](https://github.com/Ripple-TS/ripple/commit/bbc384387e33c538234be36c07cc4b30ef6ce136)]:
  - @tsrx/ripple@0.1.33
  - @ripple-ts/adapter@0.3.85

## 0.3.84

### Patch Changes

- Updated dependencies
  [[`cc3176b`](https://github.com/Ripple-TS/ripple/commit/cc3176b4e40021021986830bdfa3295530715432)]:
  - @tsrx/ripple@0.1.32
  - @ripple-ts/adapter@0.3.84

## 0.3.83

### Patch Changes

- Updated dependencies
  [[`3d93339`](https://github.com/Ripple-TS/ripple/commit/3d93339e851818b547c43c29c8965700c069b037),
  [`5646eb4`](https://github.com/Ripple-TS/ripple/commit/5646eb4e4c101b34100acf30ea57ad4065a47720),
  [`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e),
  [`8747e8f`](https://github.com/Ripple-TS/ripple/commit/8747e8f306628443d3c4d73bce0d79e986f5966e)]:
  - @tsrx/ripple@0.1.31
  - @ripple-ts/adapter@0.3.83

## 0.3.82

### Patch Changes

- [`67f3794`](https://github.com/Ripple-TS/ripple/commit/67f3794d2f1ffd55dd23a47327d925d9a76a4171)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Compose `RenderRoute` layouts
  during client hydration. The generated client entry hydrated the bare page
  component, so a route's `layout` only existed in the server-rendered HTML: the
  layout component never ran in the browser, its CSS was missing from the client
  graph, and once the SSR style block was removed after hydration the layout's
  styles disappeared (visible as a flash of unstyled content). The client entry
  now loads the layout module and wraps the page the same way the server does, and
  layout entries are included in the client build's static route imports so their
  CSS is bundled.
- Updated dependencies []:
  - @tsrx/ripple@0.1.30
  - @ripple-ts/adapter@0.3.82

## 0.3.81

### Patch Changes

- Updated dependencies
  [[`3b6fb73`](https://github.com/Ripple-TS/ripple/commit/3b6fb73170d4ad6a383befdda951ce0da4fcbb46),
  [`1c645c8`](https://github.com/Ripple-TS/ripple/commit/1c645c8f854df23bb1271b3402d1885616b525cd),
  [`b1256fd`](https://github.com/Ripple-TS/ripple/commit/b1256fdb5bf279ee7dd20bf1a71dcfccc47e279c)]:
  - @tsrx/ripple@0.1.29
  - @ripple-ts/adapter@0.3.81

## 0.3.80

### Patch Changes

- Updated dependencies
  [[`4af2591`](https://github.com/Ripple-TS/ripple/commit/4af259139d118a27d177531aa6a21435a3f3a015),
  [`87afc5d`](https://github.com/Ripple-TS/ripple/commit/87afc5d3f4c73e604cd245865e27d29e40435482)]:
  - @tsrx/ripple@0.1.28
  - @ripple-ts/adapter@0.3.80

## 0.3.79

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.27
  - @ripple-ts/adapter@0.3.79

## 0.3.78

### Patch Changes

- Updated dependencies
  [[`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa),
  [`92982ee`](https://github.com/Ripple-TS/ripple/commit/92982ee5cd2e6d971b5b650ec1df70483c9716aa),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9),
  [`b826234`](https://github.com/Ripple-TS/ripple/commit/b8262342111a977ba5a0d44086154e386b06f4b9)]:
  - @tsrx/ripple@0.1.26
  - @ripple-ts/adapter@0.3.78

## 0.3.77

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.25
  - @ripple-ts/adapter@0.3.77

## 0.3.76

### Patch Changes

- Updated dependencies
  [[`6fd49c9`](https://github.com/Ripple-TS/ripple/commit/6fd49c9dd737e889844e254763f66e13ea4a7241)]:
  - @tsrx/ripple@0.1.24
  - @ripple-ts/adapter@0.3.76

## 0.3.75

### Patch Changes

- Updated dependencies
  [[`88a254c`](https://github.com/Ripple-TS/ripple/commit/88a254c69953a5ace33bc10047f11052ec598672),
  [`4c5f992`](https://github.com/Ripple-TS/ripple/commit/4c5f992b9a11e1f26abee476a6add89f959169bc),
  [`186b3b2`](https://github.com/Ripple-TS/ripple/commit/186b3b2557761ff06c9056bf2e0b7ab8c7692477)]:
  - @tsrx/ripple@0.1.23
  - @ripple-ts/adapter@0.3.75

## 0.3.74

### Patch Changes

- Updated dependencies
  [[`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649),
  [`5d33325`](https://github.com/Ripple-TS/ripple/commit/5d3332564109d228af5e02c0f68ca4a318766649)]:
  - @tsrx/ripple@0.1.22
  - @ripple-ts/adapter@0.3.74

## 0.3.73

### Patch Changes

- [#1198](https://github.com/Ripple-TS/ripple/pull/1198)
  [`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the unused namespaced
  TSX island feature and React bridge package.

- Updated dependencies
  [[`e738e11`](https://github.com/Ripple-TS/ripple/commit/e738e1153694f56f35cfcab8982d897d7199d85a),
  [`1de66b8`](https://github.com/Ripple-TS/ripple/commit/1de66b8f851849597b6078dab7af2699e49b0e21)]:
  - @tsrx/ripple@0.1.21
  - @ripple-ts/adapter@0.3.73

## 0.3.72

### Patch Changes

- Updated dependencies
  [[`0ea87fb`](https://github.com/Ripple-TS/ripple/commit/0ea87fb3cbef21c3c00d63cc2a1f3c9f34d01c24)]:
  - @tsrx/ripple@0.1.20
  - @ripple-ts/adapter@0.3.72

## 0.3.71

### Patch Changes

- Updated dependencies
  [[`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc),
  [`0574e73`](https://github.com/Ripple-TS/ripple/commit/0574e73830a549f515cef6aa8c0a1e38c79b06cc)]:
  - @tsrx/ripple@0.1.19
  - @ripple-ts/adapter@0.3.71

## 0.3.70

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.18
  - @ripple-ts/adapter@0.3.70

## 0.3.69

### Patch Changes

- Updated dependencies
  [[`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549),
  [`054bd1e`](https://github.com/Ripple-TS/ripple/commit/054bd1e75347e395f6c096f8e293d1baf8e03549)]:
  - @tsrx/ripple@0.1.17
  - @ripple-ts/adapter@0.3.69

## 0.3.68

### Patch Changes

- Updated dependencies
  [[`d045396`](https://github.com/Ripple-TS/ripple/commit/d0453962cfe1df7a98a0981b0bf3e5729195a9ae)]:
  - @tsrx/ripple@0.1.16
  - @ripple-ts/adapter@0.3.68

## 0.3.67

### Patch Changes

- Updated dependencies
  [[`d083ab8`](https://github.com/Ripple-TS/ripple/commit/d083ab8e802259fa6d8b7bf9bb64d4be899848c4)]:
  - @tsrx/ripple@0.1.15
  - @ripple-ts/adapter@0.3.67

## 0.3.66

### Patch Changes

- [#1168](https://github.com/Ripple-TS/ripple/pull/1168)
  [`146cbf5`](https://github.com/Ripple-TS/ripple/commit/146cbf58120aad05161d503118a47bdc566ba869)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add global root pending/catch
  boundary support and allow Ripple config routes to reference named entry
  exports.

  Refactor vite-plugin to keep code generation in one place, produce cache as
  necessary and generate actual files for inspection.

- Updated dependencies
  [[`1dc0331`](https://github.com/Ripple-TS/ripple/commit/1dc0331f7b7296545ee459dc31a92057871cbb0d),
  [`bf1cb96`](https://github.com/Ripple-TS/ripple/commit/bf1cb96f2ea9b325e30f5a051c451f92659d20f9)]:
  - @tsrx/ripple@0.1.14
  - @ripple-ts/adapter@0.3.66

## 0.3.65

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.13
  - @ripple-ts/adapter@0.3.65

## 0.3.64

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.64

## 0.3.63

### Patch Changes

- Updated dependencies
  [[`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04),
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04),
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04),
  [`9df9fe3`](https://github.com/Ripple-TS/ripple/commit/9df9fe3a2d26978e69172db84994ac496761cd04)]:
  - @tsrx/ripple@0.1.12
  - @ripple-ts/adapter@0.3.63

## 0.3.62

### Patch Changes

- [#1148](https://github.com/Ripple-TS/ripple/pull/1148)
  [`78d766a`](https://github.com/Ripple-TS/ripple/commit/78d766ad263152cd7a8decf64979d33be52a0124)
  Thanks [@aleclarson](https://github.com/aleclarson)! - Chain TSRX compiler
  source maps through the Vite JSX transform so browser devtools show original
  `.tsrx` sources instead of generated TSX.

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.62

## 0.3.61

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.11
  - @ripple-ts/adapter@0.3.61

## 0.3.60

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.10
  - @ripple-ts/adapter@0.3.60

## 0.3.59

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.9
  - @ripple-ts/adapter@0.3.59

## 0.3.58

### Patch Changes

- Updated dependencies
  [[`165703c`](https://github.com/Ripple-TS/ripple/commit/165703c588b52f3dc0d26c06187f21700d448693)]:
  - @tsrx/ripple@0.1.8
  - @ripple-ts/adapter@0.3.58

## 0.3.57

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.7
  - @ripple-ts/adapter@0.3.57

## 0.3.56

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.6
  - @ripple-ts/adapter@0.3.56

## 0.3.55

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.5
  - @ripple-ts/adapter@0.3.55

## 0.3.54

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.4
  - @ripple-ts/adapter@0.3.54

## 0.3.53

### Patch Changes

- Updated dependencies
  [[`c042672`](https://github.com/Ripple-TS/ripple/commit/c04267255d35945753ca8090006622c96fa0a14f)]:
  - @tsrx/ripple@0.1.3
  - @ripple-ts/adapter@0.3.53

## 0.3.52

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.1.2
  - @ripple-ts/adapter@0.3.52

## 0.3.51

### Patch Changes

- [`f1b1f94`](https://github.com/Ripple-TS/ripple/commit/f1b1f9475553cbe3632a5cc9794a8f54615c29f2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Patch packages currently
  versioned at 0.3.50 to fix the bump that caused major 1.0.0 release with a minor
  changeset.

- Updated dependencies
  [[`f1b1f94`](https://github.com/Ripple-TS/ripple/commit/f1b1f9475553cbe3632a5cc9794a8f54615c29f2)]:
  - @ripple-ts/adapter@0.3.51
  - @tsrx/ripple@0.1.1

## 0.3.50

### Patch Changes

- Updated dependencies
  [[`2a85e9b`](https://github.com/Ripple-TS/ripple/commit/2a85e9bb73f4d82f2bd2273c33735b4dc7b82d5f)]:
  - @tsrx/ripple@0.1.0
  - @ripple-ts/adapter@0.3.50

## 0.3.49

### Patch Changes

- Updated dependencies
  [[`b54a72f`](https://github.com/Ripple-TS/ripple/commit/b54a72f721adb5f08a5bf3e3d006780b7e1eb471)]:
  - @tsrx/ripple@0.0.30
  - @ripple-ts/adapter@0.3.49

## 0.3.48

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.48

## 0.3.47

### Patch Changes

- [#1063](https://github.com/Ripple-TS/ripple/pull/1063)
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Standardizes compile api
  across all packages, including forcing types to adhere to the standard. Adds
  more debug compile options to the playgrounds.
- Updated dependencies
  [[`eae7b40`](https://github.com/Ripple-TS/ripple/commit/eae7b4047f4d8cc7a0278fb48ffe630d73a592c6),
  [`b34b95a`](https://github.com/Ripple-TS/ripple/commit/b34b95a808ec801109d1818f4d24ae0bbc00f66b),
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)]:
  - @tsrx/ripple@0.0.29
  - @ripple-ts/adapter@0.3.47

## 0.3.46

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.28
  - @ripple-ts/adapter@0.3.46

## 0.3.45

### Patch Changes

- Updated dependencies
  [[`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880),
  [`3928ac8`](https://github.com/Ripple-TS/ripple/commit/3928ac8816399f9eccfd40081d480042a9d74030)]:
  - @tsrx/ripple@0.0.27
  - @ripple-ts/adapter@0.3.45

## 0.3.44

### Patch Changes

- Updated dependencies
  [[`f5a3c1b`](https://github.com/Ripple-TS/ripple/commit/f5a3c1b9e915c250c8cd1a7dcf4e80c44abe720f)]:
  - @tsrx/ripple@0.0.26
  - @ripple-ts/adapter@0.3.44

## 0.3.43

### Patch Changes

- Updated dependencies
  [[`5c6ee71`](https://github.com/Ripple-TS/ripple/commit/5c6ee71bfd4f5dc443c43eb34e631bb032606faf),
  [`83b19fd`](https://github.com/Ripple-TS/ripple/commit/83b19fd67aa27eb10e93205dd88c61b13ffbc523)]:
  - @tsrx/ripple@0.0.25
  - @ripple-ts/adapter@0.3.43

## 0.3.42

### Patch Changes

- Updated dependencies
  [[`b4cc83f`](https://github.com/Ripple-TS/ripple/commit/b4cc83f07d8777d5882d1e853493941a3f6224ae)]:
  - @tsrx/ripple@0.0.24
  - @ripple-ts/adapter@0.3.42

## 0.3.41

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.23
  - @ripple-ts/adapter@0.3.41

## 0.3.40

### Patch Changes

- Updated dependencies
  [[`31193f2`](https://github.com/Ripple-TS/ripple/commit/31193f23aa6b6b5b79cd858f57e8aca69cd44b6d)]:
  - @tsrx/ripple@0.0.22
  - @ripple-ts/adapter@0.3.40

## 0.3.39

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.21
  - @ripple-ts/adapter@0.3.39

## 0.3.38

### Patch Changes

- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7)]:
  - @tsrx/ripple@0.0.20
  - @ripple-ts/adapter@0.3.38

## 0.3.37

### Patch Changes

- Updated dependencies
  [[`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)]:
  - @tsrx/ripple@0.0.19
  - @ripple-ts/adapter@0.3.37

## 0.3.36

### Patch Changes

- [#999](https://github.com/Ripple-TS/ripple/pull/999)
  [`aa6628b`](https://github.com/Ripple-TS/ripple/commit/aa6628b3318f1bdad6a6e12286d3002f8d591e2e)
  Thanks [@trueadm](https://github.com/trueadm)! - Pass RenderRoute params to
  SSR-compiled page components.

- Updated dependencies []:
  - @tsrx/ripple@0.0.18
  - @ripple-ts/adapter@0.3.36

## 0.3.35

### Patch Changes

- [#966](https://github.com/Ripple-TS/ripple/pull/966)
  [`caf83e3`](https://github.com/Ripple-TS/ripple/commit/caf83e386faa9133df70460f266fc27ab323082b)
  Thanks [@RazinShafayet2007](https://github.com/RazinShafayet2007)! - fix:
  register SSR/API middleware as a pre-hook so it runs before Vite's HTML fallback
  middleware

  The dev server's `configureServer` hook previously returned a function
  (post-hook), which registered SSR/API middleware after Vite's internal
  middleware stack. Vite's HTML fallback middleware would intercept all non-file
  GET requests first, preventing SSR rendering and API routes from ever executing.

  Switched to a pre-hook (no return value) so middleware is registered before Vite
  internals. Config loading is deferred to the first request via
  `ensureConfigLoaded()`, which retries on missing config and surfaces load errors
  as dev-server 500 pages instead of silently falling through.

- Updated dependencies []:
  - @tsrx/ripple@0.0.17
  - @ripple-ts/adapter@0.3.35

## 0.3.34

### Patch Changes

- Updated dependencies
  [[`fee8620`](https://github.com/Ripple-TS/ripple/commit/fee8620fa4e82a7c7e4adb3e434e9db552a3e157),
  [`2fcacb4`](https://github.com/Ripple-TS/ripple/commit/2fcacb471d7780074f92b20c9b394f7650a941bb)]:
  - @tsrx/ripple@0.0.16
  - @ripple-ts/adapter@0.3.34

## 0.3.33

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.15
  - @ripple-ts/adapter@0.3.33

## 0.3.32

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.14
  - @ripple-ts/adapter@0.3.32

## 0.3.31

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.13
  - @ripple-ts/adapter@0.3.31

## 0.3.30

### Patch Changes

- Updated dependencies
  [[`7f59ed8`](https://github.com/Ripple-TS/ripple/commit/7f59ed80d7b44c847fb9eb8bf00d4fe9835c3136)]:
  - @tsrx/ripple@0.0.12
  - @ripple-ts/adapter@0.3.30

## 0.3.29

### Patch Changes

- Updated dependencies
  [[`4543794`](https://github.com/Ripple-TS/ripple/commit/45437944a99decfb4bc56f7171772614a7f5691a)]:
  - @tsrx/ripple@0.0.11
  - @ripple-ts/adapter@0.3.29

## 0.3.28

### Patch Changes

- Updated dependencies
  [[`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8),
  [`e4b5555`](https://github.com/Ripple-TS/ripple/commit/e4b5555fb5b1651a2bf1bf232565c7e0e40213b8)]:
  - @tsrx/ripple@0.0.10
  - @ripple-ts/adapter@0.3.28

## 0.3.27

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.27

## 0.3.26

### Patch Changes

- [`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Correct package versions.

- Updated dependencies
  [[`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)]:
  - @ripple-ts/adapter@0.3.26
  - @tsrx/ripple@0.0.9

## 1.0.1

### Patch Changes

- Updated dependencies
  [[`316cba1`](https://github.com/Ripple-TS/ripple/commit/316cba18614e5ef59dce15e0de6e720eb922955f)]:
  - @tsrx/ripple@0.0.8
  - @ripple-ts/adapter@1.0.1

## 1.0.0

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.7
  - @ripple-ts/adapter@1.0.0

## 0.3.25

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.25

## 0.3.24

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.24

## 0.3.23

### Patch Changes

- Updated dependencies
  [[`73ceaac`](https://github.com/Ripple-TS/ripple/commit/73ceaacd029fb634a62252abdda59ab5f2bec15d)]:
  - @tsrx/ripple@0.0.6
  - @ripple-ts/adapter@0.3.23

## 0.3.22

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.22

## 0.3.21

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.21

## 0.3.20

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.20

## 0.3.19

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.19

## 0.3.18

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.18

## 0.3.17

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.5
  - @ripple-ts/adapter@0.3.17

## 0.3.16

### Patch Changes

- Updated dependencies []:
  - @tsrx/ripple@0.0.4
  - @ripple-ts/adapter@0.3.16

## 0.3.15

### Patch Changes

- Updated dependencies
  [[`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)]:
  - @tsrx/ripple@0.0.3
  - @ripple-ts/adapter@0.3.15

## 0.3.14

### Patch Changes

- Updated dependencies
  [[`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)]:
  - @tsrx/ripple@0.0.2
  - @ripple-ts/adapter@0.3.14

## 0.3.13

### Patch Changes

- [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `.tsrx` support across
  Ripple tooling and rename the repository's tracked `.tsrx` modules to `.tsrx`.
- Updated dependencies []:
  - @ripple-ts/adapter@0.3.13

## 0.3.12

### Patch Changes

- [#859](https://github.com/Ripple-TS/ripple/pull/859)
  [`cdd31ba`](https://github.com/Ripple-TS/ripple/commit/cdd31ba4c07ce504b01d56533e19a6ba37879f5a)
  Thanks [@trueadm](https://github.com/trueadm)! - Add first-phase `.tsrx` support
  across the core Ripple tooling so Vite, Rollup, TypeScript, the language server,
  Prettier, ESLint, and editor integrations accept both `.tsrx` and `.tsrx` files.

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.12

## 0.3.11

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.11

## 0.3.10

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.10

## 0.3.9

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.9

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.7

## 0.3.6

### Patch Changes

- [#819](https://github.com/Ripple-TS/ripple/pull/819)
  [`472c4c4`](https://github.com/Ripple-TS/ripple/commit/472c4c4b80a69ed22a258a3f3c03c4ca2d20a95b)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix HMR update causing
  component styling to disappear

  When editing a component's scoped CSS, the CSS hash changes but the virtual CSS
  module was not being invalidated or included in the HMR update. This caused the
  browser to keep stale CSS selectors that no longer matched the component's new
  hash-scoped class names, making all styling disappear until a full dev server
  restart.

  The fix eagerly re-compiles the `.tsrx` file in the `hotUpdate` hook to update
  the CSS cache, then invalidates and includes the virtual CSS module in the HMR
  update so the browser receives fresh CSS in sync with the re-rendered component.

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.5

## 0.3.4

### Patch Changes

- [#807](https://github.com/Ripple-TS/ripple/pull/807)
  [`56cdf54`](https://github.com/Ripple-TS/ripple/commit/56cdf54afb1b96e49faa273c18e0489ad70897b2)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Upgrade to Vite 8

- [`2956743`](https://github.com/Ripple-TS/ripple/commit/2956743ccbf8ebad6ae9fde27fb8809634fa3a91)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Split the production subpath
  declarations into a dedicated type file so the exported types resolve cleanly
  without self-import workarounds.

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.1

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.3.0

## 0.2.216

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.2.216

## 0.2.215

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/adapter@0.2.215

## 0.2.214

### Patch Changes

- [#730](https://github.com/Ripple-TS/ripple/pull/730)
  [`6efde20`](https://github.com/Ripple-TS/ripple/commit/6efde20a7fe1e29b27ac98823362cba2001340fa)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Force patch version bump for
  vite-plugin package.

- Updated dependencies []:
  - @ripple-ts/adapter@0.2.214

## 0.2.213

## 0.2.212

## 0.2.211

## 0.2.210

## 0.2.209

### Patch Changes

- [#682](https://github.com/Ripple-TS/ripple/pull/682)
  [`96a5614`](https://github.com/Ripple-TS/ripple/commit/96a56141de8aa667a64bf53ad06f63292e38b1d9)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Add
  invalid HTML nesting error detection during SSR in dev mode

  During SSR, if the HTML is malformed (e.g., `<button>` elements nested inside
  other `<button>` elements), the browser tries to repair the HTML, making
  hydration impossible. This change adds runtime validation of HTML nesting during
  SSR to detect these cases and provide clear error messages.
  - Added `push_element` and `pop_element` functions to the server runtime that
    track the element stack during SSR
  - Added comprehensive HTML nesting validation rules based on the HTML spec
  - The server compiler now emits `push_element`/`pop_element` calls when the
    `dev` option is enabled
  - Added `dev` option to `CompileOptions`
  - The Vite plugin now automatically enables dev mode during `vite dev` (serve
    command)

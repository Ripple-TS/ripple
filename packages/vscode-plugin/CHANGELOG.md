# Changelog

## 0.3.10

### Patch Changes

- Updated dependencies
  [[`aef1253`](https://github.com/Ripple-TS/ripple/commit/aef1253dd79c067a8358172d502dc21d8a9a9085)]:
  - ripple@0.3.10
  - @ripple-ts/language-server@0.3.10
  - @ripple-ts/typescript-plugin@0.3.10

## 0.3.9

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.9
  - @ripple-ts/language-server@0.3.9
  - @ripple-ts/typescript-plugin@0.3.9

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.8
  - @ripple-ts/language-server@0.3.8
  - @ripple-ts/typescript-plugin@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies
  [[`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117)]:
  - ripple@0.3.7
  - @ripple-ts/language-server@0.3.7
  - @ripple-ts/typescript-plugin@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.6
  - @ripple-ts/language-server@0.3.6
  - @ripple-ts/typescript-plugin@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies
  [[`218a72c`](https://github.com/Ripple-TS/ripple/commit/218a72c3e663910636eec1d065c58afe30813c84)]:
  - ripple@0.3.5
  - @ripple-ts/language-server@0.3.5
  - @ripple-ts/typescript-plugin@0.3.5

## 0.3.4

### Patch Changes

- Updated dependencies
  [[`92982cd`](https://github.com/Ripple-TS/ripple/commit/92982cd7b918d0afee9334c74765573b30c8a645),
  [`747ae1f`](https://github.com/Ripple-TS/ripple/commit/747ae1fc7948e994eeb521f3ed78711c9dd3e802),
  [`abe1caa`](https://github.com/Ripple-TS/ripple/commit/abe1caa6ab636722099a6ecd4cafbf117d208ec2),
  [`046d0ba`](https://github.com/Ripple-TS/ripple/commit/046d0baf190d161c3b851799080d11eb4f95e094),
  [`79a920e`](https://github.com/Ripple-TS/ripple/commit/79a920e30f0f35f2ec07ff8d52dc709f8bb74c77),
  [`83807a4`](https://github.com/Ripple-TS/ripple/commit/83807a412603ff49c398f9365b011fd4b4a5f8bf)]:
  - ripple@0.3.4
  - @ripple-ts/language-server@0.3.4
  - @ripple-ts/typescript-plugin@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies
  [[`cd1073f`](https://github.com/Ripple-TS/ripple/commit/cd1073f7cc8085c8b200ada4faf77b2c35b10c6c)]:
  - ripple@0.3.3
  - @ripple-ts/language-server@0.3.3
  - @ripple-ts/typescript-plugin@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies
  [[`42524c9`](https://github.com/Ripple-TS/ripple/commit/42524c9551b1950d7f7a0336ce396fc312b6fe51)]:
  - ripple@0.3.2
  - @ripple-ts/language-server@0.3.2
  - @ripple-ts/typescript-plugin@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies
  [[`87c2078`](https://github.com/Ripple-TS/ripple/commit/87c20780f6f6f7339cf94b9a9d08e028533df0a2)]:
  - ripple@0.3.1
  - @ripple-ts/language-server@0.3.1
  - @ripple-ts/typescript-plugin@0.3.1

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

### Patch Changes

- Updated dependencies
  [[`61271cb`](https://github.com/Ripple-TS/ripple/commit/61271cb1c4777f2ab9093c6c89a5ad771ec98b7d),
  [`21dd402`](https://github.com/Ripple-TS/ripple/commit/21dd4029d7e027a0706cb133b09530a722feb73d),
  [`c2dbefe`](https://github.com/Ripple-TS/ripple/commit/c2dbefe5645c0c4f6e0ff4dc00d9c4de81616667),
  [`74a10cc`](https://github.com/Ripple-TS/ripple/commit/74a10cc5701962cd7c72b144d59b35ecb76263a3)]:
  - ripple@0.3.0
  - @ripple-ts/typescript-plugin@0.3.0
  - @ripple-ts/language-server@0.3.0

## 0.0.91

### Patch Changes

- [#764](https://github.com/Ripple-TS/ripple/pull/764)
  [`95ea864`](https://github.com/Ripple-TS/ripple/commit/95ea8645b2cb27e2610a4ace4c8fb238c92d441a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fixes syntax color
  highlighting for `pending`

- Updated dependencies
  [[`9fb507d`](https://github.com/Ripple-TS/ripple/commit/9fb507d76af6fd6a5c636af1976d1e03d3e869ac),
  [`e1de4bb`](https://github.com/Ripple-TS/ripple/commit/e1de4bb9df75342a693cda24d0999a423db05ec4),
  [`95ea864`](https://github.com/Ripple-TS/ripple/commit/95ea8645b2cb27e2610a4ace4c8fb238c92d441a)]:
  - ripple@0.2.216
  - @ripple-ts/language-server@0.2.216
  - @ripple-ts/typescript-plugin@0.2.216

## 0.0.90

### Patch Changes

- Updated dependencies
  [[`a9ecda4`](https://github.com/Ripple-TS/ripple/commit/a9ecda4e3f29e3b934d9f5ee80d55c059ba36ebe),
  [`6653c5c`](https://github.com/Ripple-TS/ripple/commit/6653c5cebfbd4dce129906a25686ef9c63dc592a),
  [`307dcf3`](https://github.com/Ripple-TS/ripple/commit/307dcf30f27dae987a19a59508cc2593c839eda3)]:
  - ripple@0.2.215
  - @ripple-ts/language-server@0.2.215
  - @ripple-ts/typescript-plugin@0.2.215

## 0.0.89

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.214
  - @ripple-ts/language-server@0.2.214
  - @ripple-ts/typescript-plugin@0.2.214

## 0.0.88

### Patch Changes

- Updated dependencies
  [[`6c1c21c`](https://github.com/Ripple-TS/ripple/commit/6c1c21ce8225ea7e9820be16626e68b5156c8f5e)]:
  - @ripple-ts/language-server@0.2.213
  - ripple@0.2.213
  - @ripple-ts/typescript-plugin@0.2.213

## 0.0.87

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.212
  - @ripple-ts/language-server@0.2.212
  - @ripple-ts/typescript-plugin@0.2.212

See https://github.com/Ripple-TS/ripple/releases

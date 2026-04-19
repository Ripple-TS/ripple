# @ripple-ts/typescript-plugin

## 0.3.19

### Patch Changes

- [#877](https://github.com/Ripple-TS/ripple/pull/877)
  [`7610ef8`](https://github.com/Ripple-TS/ripple/commit/7610ef84847bb77cc83488a902ecb6f96594e113)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Convert the Ripple language
  server, TypeScript plugin, and VS Code extension codebases from CommonJS source
  files to ESM source files, while publishing built dist entrypoints instead of
  source files.

  This updates package metadata such as `type: module` and dist-based `main`
  paths, replaces `require` and `module.exports` usage with `import` and `export`,
  and adds tsdown bundling configs that emit CommonJS dist output plus a
  dist/package.json that forces `type: commonjs`.

  Development builds also include sourcemaps.

## 0.3.18

### Patch Changes

- Updated dependencies
  [[`4cb69cc`](https://github.com/Ripple-TS/ripple/commit/4cb69cc780d48c26493e3144006caf4b11df8e1d)]:
  - @tsrx/react@0.0.2

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

### Patch Changes

- [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `.rsrx` support across
  Ripple tooling and rename the repository's tracked `.ripple` modules to `.rsrx`.
- Updated dependencies
  [[`4eb4d68`](https://github.com/Ripple-TS/ripple/commit/4eb4d6851573d771d65f1e85b1b442ad3cdc53d2),
  [`48af856`](https://github.com/Ripple-TS/ripple/commit/48af85678d5e1b32bb1c5e3fbb2fb07498bc88a3),
  [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)]:
  - ripple@0.3.13

## 0.3.12

### Patch Changes

- [#859](https://github.com/Ripple-TS/ripple/pull/859)
  [`cdd31ba`](https://github.com/Ripple-TS/ripple/commit/cdd31ba4c07ce504b01d56533e19a6ba37879f5a)
  Thanks [@trueadm](https://github.com/trueadm)! - Add first-phase `.tsrx` support
  across the core Ripple tooling so Vite, Rollup, TypeScript, the language server,
  Prettier, ESLint, and editor integrations accept both `.ripple` and `.tsrx`
  files.

- Updated dependencies []:
  - ripple@0.3.12

## 0.3.11

### Patch Changes

- Updated dependencies
  [[`6792c70`](https://github.com/Ripple-TS/ripple/commit/6792c700db30ec0c25077bf8892753f18eddc5cc),
  [`f2624a6`](https://github.com/Ripple-TS/ripple/commit/f2624a6596479480c47317ea3030863214a6e2b3),
  [`13323dd`](https://github.com/Ripple-TS/ripple/commit/13323dddbcb68e1e8e373142884a7c54fbb76cd7)]:
  - ripple@0.3.11

## 0.3.10

### Patch Changes

- Updated dependencies
  [[`aef1253`](https://github.com/Ripple-TS/ripple/commit/aef1253dd79c067a8358172d502dc21d8a9a9085)]:
  - ripple@0.3.10

## 0.3.9

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.9

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies
  [[`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117),
  [`9ca9310`](https://github.com/Ripple-TS/ripple/commit/9ca9310550a800f4435821ed84b24bdd4f243117)]:
  - ripple@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies
  [[`218a72c`](https://github.com/Ripple-TS/ripple/commit/218a72c3e663910636eec1d065c58afe30813c84)]:
  - ripple@0.3.5

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

## 0.3.3

### Patch Changes

- Updated dependencies
  [[`cd1073f`](https://github.com/Ripple-TS/ripple/commit/cd1073f7cc8085c8b200ada4faf77b2c35b10c6c)]:
  - ripple@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies
  [[`42524c9`](https://github.com/Ripple-TS/ripple/commit/42524c9551b1950d7f7a0336ce396fc312b6fe51)]:
  - ripple@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies
  [[`87c2078`](https://github.com/Ripple-TS/ripple/commit/87c20780f6f6f7339cf94b9a9d08e028533df0a2)]:
  - ripple@0.3.1

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

## 0.2.216

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

## 0.2.215

### Patch Changes

- Updated dependencies
  [[`a9ecda4`](https://github.com/Ripple-TS/ripple/commit/a9ecda4e3f29e3b934d9f5ee80d55c059ba36ebe),
  [`6653c5c`](https://github.com/Ripple-TS/ripple/commit/6653c5cebfbd4dce129906a25686ef9c63dc592a),
  [`307dcf3`](https://github.com/Ripple-TS/ripple/commit/307dcf30f27dae987a19a59508cc2593c839eda3)]:
  - ripple@0.2.215

## 0.2.214

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.214

## 0.2.213

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.213

## 0.2.212

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.212

## 0.2.211

### Patch Changes

- Updated dependencies
  [[`fa285f4`](https://github.com/Ripple-TS/ripple/commit/fa285f441ab8d748c3dfea6adb463e3ca6d614b5)]:
  - ripple@0.2.211

## 0.2.210

### Patch Changes

- Updated dependencies []:
  - ripple@0.2.210

## 0.2.209

### Patch Changes

- Updated dependencies
  [[`96a5614`](https://github.com/Ripple-TS/ripple/commit/96a56141de8aa667a64bf53ad06f63292e38b1d9),
  [`ae3aa98`](https://github.com/Ripple-TS/ripple/commit/ae3aa981515f81e62a699497e624dd0c2e3d2c91)]:
  - ripple@0.2.209

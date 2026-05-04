# @ripple-ts/compat-react

## 0.3.47

### Patch Changes

- Updated dependencies
  [[`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)]:
  - ripple@0.3.47

## 0.3.46

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.46

## 0.3.45

### Patch Changes

- Updated dependencies
  [[`d1acf12`](https://github.com/Ripple-TS/ripple/commit/d1acf129cdd0bf2ee596dbab26ec4df829a33880)]:
  - ripple@0.3.45

## 0.3.44

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.44

## 0.3.43

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.43

## 0.3.42

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.42

## 0.3.41

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.41

## 0.3.40

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.40

## 0.3.39

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.39

## 0.3.38

### Patch Changes

- Updated dependencies
  [[`088299c`](https://github.com/Ripple-TS/ripple/commit/088299ce94a6022c017ce2e56c7e1b59bd5973f7)]:
  - ripple@0.3.38

## 0.3.37

### Patch Changes

- Updated dependencies
  [[`c631ab0`](https://github.com/Ripple-TS/ripple/commit/c631ab0076b7e2cb30f4998101b54c3a86e78c61)]:
  - ripple@0.3.37

## 0.3.36

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.36

## 0.3.35

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.35

## 0.3.34

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.34

## 0.3.33

### Patch Changes

- Updated dependencies
  [[`3e07109`](https://github.com/Ripple-TS/ripple/commit/3e071098508449158fa11f2ae48c912d4d673b68)]:
  - ripple@0.3.33

## 0.3.32

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.32

## 0.3.31

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.31

## 0.3.30

### Patch Changes

- Updated dependencies
  [[`7f59ed8`](https://github.com/Ripple-TS/ripple/commit/7f59ed80d7b44c847fb9eb8bf00d4fe9835c3136)]:
  - ripple@0.3.30

## 0.3.29

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.29

## 0.3.28

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.28

## 0.3.27

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.27

## 0.3.26

### Patch Changes

- [`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Correct package versions.

- Updated dependencies
  [[`68d80f8`](https://github.com/Ripple-TS/ripple/commit/68d80f8c7a6398692e00497b90cb3d0ba981aea3)]:
  - ripple@0.3.26

## 1.0.1

### Patch Changes

- Updated dependencies
  [[`316cba1`](https://github.com/Ripple-TS/ripple/commit/316cba18614e5ef59dce15e0de6e720eb922955f)]:
  - ripple@1.0.1

## 1.0.0

### Patch Changes

- Updated dependencies []:
  - ripple@1.0.0

## 0.3.25

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.25

## 0.3.24

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.24

## 0.3.23

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.23

## 0.3.22

### Patch Changes

- Updated dependencies
  [[`bc8a6ed`](https://github.com/Ripple-TS/ripple/commit/bc8a6ed53d451da90cb6eb6ff9ec564f6f0cabe8)]:
  - ripple@0.3.22

## 0.3.21

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.21

## 0.3.20

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.20

## 0.3.19

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.19

## 0.3.18

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.18

## 0.3.17

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.17

## 0.3.16

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.16

## 0.3.15

### Patch Changes

- Updated dependencies
  [[`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)]:
  - ripple@0.3.15

## 0.3.14

### Patch Changes

- Updated dependencies
  [[`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)]:
  - ripple@0.3.14

## 0.3.13

### Patch Changes

- [#862](https://github.com/Ripple-TS/ripple/pull/862)
  [`48af856`](https://github.com/Ripple-TS/ripple/commit/48af85678d5e1b32bb1c5e3fbb2fb07498bc88a3)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add a release changeset for
  the async tracking work introduced in commit
  `4eb4d6851573d771d65f1e85b1b442ad3cdc53d2`.

  This ships async tracking as a first-class feature in Ripple:
  - remove and prohibit direct component-level `await`; async component flows now
    require using `trackAsync()` (with `trackPending()` for pending state checks)
  - add `trackAsync()` and `trackPending()` support so async values can be read
    through Ripple's reactive runtime using tracked async values
  - update compiler/runtime behavior for `try`/`catch`/`pending` boundaries so
    async pending and error states can render and recover correctly in client and
    SSR paths
  - align `@ripple-ts/compat-react` async boundary behavior with the new Ripple
    async tracking semantics
  - update editor/tooling integration to match the new async syntax/runtime shape

- Updated dependencies
  [[`4eb4d68`](https://github.com/Ripple-TS/ripple/commit/4eb4d6851573d771d65f1e85b1b442ad3cdc53d2),
  [`48af856`](https://github.com/Ripple-TS/ripple/commit/48af85678d5e1b32bb1c5e3fbb2fb07498bc88a3),
  [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)]:
  - ripple@0.3.13

## 0.3.12

### Patch Changes

- Updated dependencies []:
  - ripple@0.3.12

## 0.3.11

### Patch Changes

- [#840](https://github.com/Ripple-TS/ripple/pull/840)
  [`13323dd`](https://github.com/Ripple-TS/ripple/commit/13323dddbcb68e1e8e373142884a7c54fbb76cd7)
  Thanks [@trueadm](https://github.com/trueadm)! - Remove the `compat` option from
  `mount()` and `hydrate()`, and stop exporting the old public compat types from
  `ripple`. Compat integrations are now expected to be provided by the Vite plugin
  via `ripple.config.ts`, while direct runtime tests can seed the generated global
  compat registry.

  Also add the `reactCompat()` config-facing helper from `@ripple-ts/compat-react`
  for use in `ripple.config.ts`.

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

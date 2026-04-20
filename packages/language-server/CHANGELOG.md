# @ripple-ts/language-server

## 0.3.20

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.20

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

- Updated dependencies
  [[`7610ef8`](https://github.com/Ripple-TS/ripple/commit/7610ef84847bb77cc83488a902ecb6f96594e113)]:
  - @ripple-ts/typescript-plugin@0.3.19

## 0.3.18

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.18

## 0.3.17

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.17

## 0.3.16

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.16

## 0.3.15

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.15

## 0.3.14

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.14

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

- [`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)
  Thanks [@trueadm](https://github.com/trueadm)! - Add `.rsrx` support across
  Ripple tooling and rename the repository's tracked `.ripple` modules to `.rsrx`.
- Updated dependencies
  [[`6e11177`](https://github.com/Ripple-TS/ripple/commit/6e111778cae4e7d9876e51e293520f0859eb5890)]:
  - @ripple-ts/typescript-plugin@0.3.13

## 0.3.12

### Patch Changes

- [#859](https://github.com/Ripple-TS/ripple/pull/859)
  [`cdd31ba`](https://github.com/Ripple-TS/ripple/commit/cdd31ba4c07ce504b01d56533e19a6ba37879f5a)
  Thanks [@trueadm](https://github.com/trueadm)! - Add first-phase `.tsrx` support
  across the core Ripple tooling so Vite, Rollup, TypeScript, the language server,
  Prettier, ESLint, and editor integrations accept both `.ripple` and `.tsrx`
  files.

- Updated dependencies
  [[`cdd31ba`](https://github.com/Ripple-TS/ripple/commit/cdd31ba4c07ce504b01d56533e19a6ba37879f5a)]:
  - @ripple-ts/typescript-plugin@0.3.12

## 0.3.11

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.11

## 0.3.10

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.10

## 0.3.9

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.9

## 0.3.8

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.8

## 0.3.7

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.7

## 0.3.6

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.6

## 0.3.5

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.5

## 0.3.4

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.4

## 0.3.3

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.3

## 0.3.2

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.3.2

## 0.3.1

### Patch Changes

- Updated dependencies []:
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
  [[`74a10cc`](https://github.com/Ripple-TS/ripple/commit/74a10cc5701962cd7c72b144d59b35ecb76263a3)]:
  - @ripple-ts/typescript-plugin@0.3.0

## 0.2.216

### Patch Changes

- [#764](https://github.com/Ripple-TS/ripple/pull/764)
  [`95ea864`](https://github.com/Ripple-TS/ripple/commit/95ea8645b2cb27e2610a4ace4c8fb238c92d441a)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fixes syntax color
  highlighting for `pending`

- Updated dependencies
  [[`95ea864`](https://github.com/Ripple-TS/ripple/commit/95ea8645b2cb27e2610a4ace4c8fb238c92d441a)]:
  - @ripple-ts/typescript-plugin@0.2.216

## 0.2.215

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.2.215

## 0.2.214

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.2.214

## 0.2.213

### Patch Changes

- [#717](https://github.com/Ripple-TS/ripple/pull/717)
  [`6c1c21c`](https://github.com/Ripple-TS/ripple/commit/6c1c21ce8225ea7e9820be16626e68b5156c8f5e)
  Thanks [@copilot-swe-agent](https://github.com/apps/copilot-swe-agent)! - Fix
  language server not recognizing changes to `.ts` files

  The language server now watches TypeScript and JavaScript files for changes on
  disk. Previously, modifications to `.ts` files imported by `.ripple` files would
  not be picked up by the language server until it was restarted, causing stale
  diagnostics. This was because the `workspace/didChangeWatchedFiles` connection
  handler was never registered (it requires calling
  `server.fileWatcher.watchFiles()`). The fix adds explicit file watcher
  registration for all TypeScript/JavaScript file extensions in the server's
  `onInitialized` callback.

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.2.213

## 0.2.212

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.2.212

## 0.2.211

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.2.211

## 0.2.210

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.2.210

## 0.2.209

### Patch Changes

- Updated dependencies []:
  - @ripple-ts/typescript-plugin@0.2.209

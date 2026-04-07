# @ripple-ts/language-server

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

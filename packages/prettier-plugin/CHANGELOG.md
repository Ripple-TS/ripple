# @ripple-ts/prettier-plugin

## 0.3.5

## 0.3.4

### Patch Changes

- [`92982cd`](https://github.com/Ripple-TS/ripple/commit/92982cd7b918d0afee9334c74765573b30c8a645)
  Thanks [@trueadm](https://github.com/trueadm)! - feat(compiler): add lazy
  destructuring syntax (`&{...}` and `&[...]`)

  Lazy destructuring defers property/index access until the binding is read,
  preserving reactivity for destructured props. Works with default values,
  compound assignment operators, and update expressions.

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

### Patch Changes

- [#784](https://github.com/Ripple-TS/ripple/pull/784)
  [`d38c8f2`](https://github.com/Ripple-TS/ripple/commit/d38c8f21201c8bb50293d12da2df233353b9837b)
  Thanks [@anubra266](https://github.com/anubra266)! - fix: preserve parentheses
  around IIFE callee in prettier plugin

## 0.2.216

## 0.2.215

## 0.2.214

## 0.2.213

## 0.2.212

## 0.2.211

## 0.2.210

## 0.2.209

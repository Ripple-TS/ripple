# @tsrx/ripple

## 0.0.9

### Patch Changes

- Updated dependencies
  [[`fab49f7`](https://github.com/Ripple-TS/ripple/commit/fab49f7da8ec13c981f1c7b3102703d0c349fc1e)]:
  - @tsrx/core@0.0.7

## 0.0.8

### Patch Changes

- [#886](https://github.com/Ripple-TS/ripple/pull/886)
  [`316cba1`](https://github.com/Ripple-TS/ripple/commit/316cba18614e5ef59dce15e0de6e720eb922955f)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Add SSR-to-client
  serialization/hydration for trackAsync by emitting per-call JSON <script>
  envelopes (resolved payload + direct dependency hashes, or sanitized error
  message) and consuming/removing them during client hydration to avoid re-running
  the user async function. Add proper error handling routing to catch blocks with
  actual error messages in DEV and safe production error messages, all with
  correct hydration support

## 0.0.7

### Patch Changes

- Updated dependencies
  [[`e9da9cb`](https://github.com/Ripple-TS/ripple/commit/e9da9cbdd42c28f129ee643366c06f8779b8f931)]:
  - @tsrx/core@0.0.6

## 0.0.6

### Patch Changes

- [#894](https://github.com/Ripple-TS/ripple/pull/894)
  [`73ceaac`](https://github.com/Ripple-TS/ripple/commit/73ceaacd029fb634a62252abdda59ab5f2bec15d)
  Thanks [@trueadm](https://github.com/trueadm)! - Fix a hydration edge case where
  sibling traversal after nested DOM children (such as <pre><code>{html
  ...}</code></pre> chains) could leave the hydrate pointer on the wrong node and
  throw a hydration error during client hydration. Added hydration regression
  coverage for the website-like code-block sibling pattern.

- Updated dependencies
  [[`d027c6c`](https://github.com/Ripple-TS/ripple/commit/d027c6c84fd3ba7c577c52b9fdade77e7ff886e0)]:
  - @tsrx/core@0.0.5

## 0.0.5

### Patch Changes

- Updated dependencies
  [[`7f98c10`](https://github.com/Ripple-TS/ripple/commit/7f98c1039f52a56135672b0f9b476af280c81f03)]:
  - @tsrx/core@0.0.4

## 0.0.4

### Patch Changes

- Updated dependencies
  [[`030ff45`](https://github.com/Ripple-TS/ripple/commit/030ff45bc3020cd1b6e1a914fc58af7c8a0e5af1)]:
  - @tsrx/core@0.0.3

## 0.0.3

### Patch Changes

- [`a14097a`](https://github.com/Ripple-TS/ripple/commit/a14097a688ad85c236a6619cef527c78787ab367)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fix children prop precedence
  when invoking components so that template children always win over an explicit
  `children=` attribute, while still respecting JSX-like ordering between explicit
  props and spreads when no template children are present.

## 0.0.2

### Patch Changes

- [#866](https://github.com/Ripple-TS/ripple/pull/866)
  [`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)
  Thanks [@trueadm](https://github.com/trueadm)! - Extract compiler into
  `@tsrx/core` and `@tsrx/ripple` packages
  - `@tsrx/core`: Core compiler infrastructure — parser factory, scope management,
    utilities, constants, and type definitions
  - `@tsrx/ripple`: Ripple-specific compiler — RipplePlugin, analyze,
    client/server transforms
  - Remove compiler source code from `ripple` package (consumers should use
    `@tsrx/ripple`)
  - Migrate eslint-plugin type imports to `@tsrx/core/types/*`
  - Remove unused compiler dependencies from `ripple` package

- Updated dependencies
  [[`228f1bb`](https://github.com/Ripple-TS/ripple/commit/228f1bb36cd3e8506c422ed0997164bf5a0b5fe2)]:
  - @tsrx/core@0.0.2

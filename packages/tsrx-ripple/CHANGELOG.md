# @tsrx/ripple

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

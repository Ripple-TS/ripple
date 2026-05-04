# @tsrx/solid-playground

## 0.0.4

### Patch Changes

- [#1063](https://github.com/Ripple-TS/ripple/pull/1063)
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Standardizes compile api
  across all packages, including forcing types to adhere to the standard. Adds
  more debug compile options to the playgrounds.

## 0.0.3

### Patch Changes

- [#1027](https://github.com/Ripple-TS/ripple/pull/1027)
  [`4efd806`](https://github.com/Ripple-TS/ripple/commit/4efd8062b7494f88fd7d623403dc6c1b426a0495)
  Thanks [@leonidaz](https://github.com/leonidaz)! - We will no bump up the
  language-server version in zed's package.json config field automatically to keep
  things in sync

  Fixed issue with Zed to look and find the project's language-server first -
  useful for dev

  language-server was pointing to dist but dist wasn't published, also issues with
  bin, etc.

## 0.0.2

### Patch Changes

- [#1025](https://github.com/Ripple-TS/ripple/pull/1025)
  [`76fd362`](https://github.com/Ripple-TS/ripple/commit/76fd3622f3e6432787fadb1a96337541424b25aa)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Fixes a bug where for all
  control statements: for, if, switch, try/pending/catch where using hooks inside
  to change values, like useState, would not be reflected in the subsequent code.
  The fix involved creating continuation hooks and calling them at the end of the
  control flow block - it's an oversimplification.

  Fixes the for loop by hoisting the generated statement body hooks and types to
  the outside of the loop.

  Refactors a bunch, but not all, manually created AST nodes into using ast
  builder functions.

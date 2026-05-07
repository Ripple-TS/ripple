# @tsrx/vue-playground

## 0.0.3

### Patch Changes

- [#1063](https://github.com/Ripple-TS/ripple/pull/1063)
  [`a960343`](https://github.com/Ripple-TS/ripple/commit/a960343169aee906162211c502b6cc6b74e2a124)
  Thanks [@leonidaz](https://github.com/leonidaz)! - Standardizes compile api
  across all packages, including forcing types to adhere to the standard. Adds
  more debug compile options to the playgrounds.

## 0.0.2

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

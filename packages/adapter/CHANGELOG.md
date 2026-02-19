# @ripple-ts/adapter

## 0.2.209

### Patch Changes

- [#696](https://github.com/Ripple-TS/ripple/pull/696)
  [`cc23cc0`](https://github.com/Ripple-TS/ripple/commit/cc23cc03e2a264944d1d0f2edac6852528a07d10)
  Thanks [@WebEferen](https://github.com/WebEferen)! - Extract shared adapter
  primitives and types into `@ripple-ts/adapter`, then use them from both
  `@ripple-ts/adapter-node` and `@ripple-ts/adapter-bun`.

- [#700](https://github.com/Ripple-TS/ripple/pull/700)
  [`45e0689`](https://github.com/Ripple-TS/ripple/commit/45e0689b648b6a63ee0d9eb192344a9889787b48)
  Thanks [@WebEferen](https://github.com/WebEferen)! - Add a shared
  `ServeStaticDirectoryOptions` type in `@ripple-ts/adapter` and update node/bun
  adapters to consume it instead of redefining the same
  `ServeStaticOptions & { dir?: string }` shape locally.

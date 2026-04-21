# @tsrx/vite-plugin-solid

## 0.0.4

### Patch Changes

- Updated dependencies
  [[`bfe6fd3`](https://github.com/Ripple-TS/ripple/commit/bfe6fd30155ce2c308a624744ade8a87c15858d7)]:
  - @tsrx/solid@0.0.4

## 0.0.3

### Patch Changes

- Updated dependencies
  [[`ad99739`](https://github.com/Ripple-TS/ripple/commit/ad99739f65202850ff0013515121cfd3a1758b82)]:
  - @tsrx/solid@0.0.3

## 0.0.2

### Patch Changes

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - Target Solid 2.0 beta. The
  Solid transform now emits `<Errored>` / `<Loading>` instead of `<ErrorBoundary>`
  / `<Suspense>` (renamed in Solid 2.0 core). The Vite plugin re-anchors virtual
  `.tsrx.tsx` ids when the host bundler strips the workspace root (e.g. Vitest
  test entries). A new `tsrx-solid-runtime` Vitest project runs Solid components
  end-to-end in jsdom, mirroring the existing React runtime test matrix.

- [#885](https://github.com/Ripple-TS/ripple/pull/885)
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)
  Thanks [@trueadm](https://github.com/trueadm)! - Honor the `include` option on
  the Vite plugin. Previously it was typed and documented on `TsrxSolidOptions`
  but never read — the plugin always matched files via a hardcoded `.tsrx`
  extension check, so passing `{ include: /pattern/ }` had no effect. `resolveId`,
  the virtual-id detection and `handleHotUpdate` now all route through the
  user-supplied regex (or `/\.tsrx$/` when none is provided), so extending or
  narrowing the set of compiled sources works as advertised.
- Updated dependencies
  [[`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd),
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd),
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd),
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd),
  [`34d64e5`](https://github.com/Ripple-TS/ripple/commit/34d64e5028aee91a22a1cd1d8490c1c64105a7cd)]:
  - @tsrx/solid@0.0.2

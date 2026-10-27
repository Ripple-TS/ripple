# Browser and release validation

Milestone 6 validates the
[production SSR example](https://github.com/Ripple-TS/ripple/tree/main/packages/tanstack-router/examples/ssr)
in Chromium, Firefox and WebKit using Playwright 1.63.0. The automated release job
runs on Linux with Node 24; local validation also runs on macOS. Runtime suites
continue to run on Node 22, 24 and 26.

## Reproduce the gate

```sh
pnpm --filter @ripple-ts/tanstack-router exec playwright install --with-deps chromium firefox webkit
pnpm --filter @ripple-ts/tanstack-router test:release
pnpm --filter @ripple-ts/tanstack-router test
pnpm --filter @ripple-ts/tanstack-router upstream:audit
pnpm typecheck
pnpm format:check
pnpm changeset:check
```

`test:release` packs the adapter and its pending Ripple runtime/compiler/Vite
integration dependencies, installs them outside the workspace, and validates the
installed files. All shared TSRX language packages come from the registry. The
consumer uses no workspace links or aliases to local source. The separate private
Solid reference app is not installed. React and Solid are absent from the adapter
runtime dependencies and the production module graph. Browser and server bundles
select their respective Ripple entry, and the browser graph contains one Ripple
runtime instance.

The packed consumer checks public export files, declarations, positive and
negative route typing in ordinary TypeScript and TSRX using the published
`tsrx-tsc` CLI and the example’s `tsconfig.json`, Vite dependency optimization,
both production targets, and a separate lazy chunk. The adapter is
source-distributed: consuming `.tsrx` modules requires the Ripple Vite plugin. The
plugin discovers the installed package and excludes it from prebundling. The
example explicitly optimizes its nested core/history dependencies; a browser also
hydrates and navigates through that development graph.

## Browser assertions

Production documents use the nonce-based strict CSP described in the SSR guide.
The gate captures `securitypolicyviolation` events, checks distinct nonces across
concurrent responses, and deliberately inserts unauthorized scripts to verify
enforcement. It covers scoped and late CSS, lazy CSS/module preloads, nested
stream patches and late route outcomes in all three engines without `bypassCSP`.

| Contract              | Checks                                                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR and hydration     | Document-driven bootstrap without harness imports, direct parameter/search entry, reload, retained server DOM, no browser loader refetch, title updates, streamed deferred data and subsequent navigation                                    |
| Native navigation     | Links, back/forward, modified-click new tab, preloading without duplicate requests, actual pending UI, error recovery, explicit lazy chunk                                                                                                   |
| History and ownership | `/app/` base path, blocker stay/leave, window scroll restoration and hash targets after render, 20 retained-layout updates, 8 remounts with exactly one history subscriber and zero after disposal                                           |
| View transitions      | Real Chromium old/new DOM around the native update callback, `ready` and `finished`, rendered navigation before animation completion, skipped and interrupted animation, CSS naming and reduced motion; disabled API fallback in all engines |

The pinned core has an upstream limitation: skipped/interrupted animations can
produce an unhandled `ViewTransition.ready` rejection even when navigation commits
([TanStack/router#7906](https://github.com/TanStack/router/issues/7906)). This
adapter preserves core ownership of transitions and does not install a global
error suppressor. Applications can leave native transitions disabled (the router
default) until the upstream fix is included in an audited baseline.

The browser tests do not replace native transitions with a mock. They wrap the
native API to record the DOM on either side of its update callback and preserve
its original promises. The harness accounts separately for the known native
`AbortError` on the exact `ready` promise, checks that its update callback
succeeds, and records it in the report. Other errors fail the test. A screenshot
of the active transition and a JSON report are written to
`packages/tanstack-router/dist/browser/` and uploaded by CI. The report lists
actual browser versions, scenario results and compressed chunk sizes.
`BROWSERS=chromium` selects one engine for debugging; CI runs all three.

The representative example has an 80,000-byte gzip budget for **all** emitted
client JavaScript, including lazy chunks and Ripple. This is a regression budget,
not a standalone adapter size claim. Repeated navigation asserts retained layout
identity, one render event per committed navigation and bounded history
subscriptions. It does not claim a general heap-leak or browser BFCache audit.

## Release contract

The supported baseline is `@tanstack/router-core` **1.171.39** with
`@tanstack/history` **1.162.5**, pinned dependencies rather than an untested
version range. Use the Ripple version selected by the release's peer dependency;
the adapter and pending runtime changes must be versioned together through
Changesets. The runtime additions have their own changesets. This gate prepares a
public package; it does not publish it or bypass the normal release workflow.

See [setup and client APIs](./client.md), [SSR ownership and limits](./ssr.md),
[compatibility](./compatibility.md), and the
[upstream upgrade procedure](https://github.com/Ripple-TS/ripple/blob/main/packages/tanstack-router/upstream/README.md#upstream-upgrades).
Any core/history upgrade must audit the pinned source inventories, rerun type and
runtime ports, compare reference apps, and pass this clean-consumer browser gate.

File-route generation is optional TSRX work. TanStack Start, Query, devtools,
React-style transition components, Trusted Types, static hash policies and
development/HMR CSP are outside the supported contract. Streaming authorizes the
inline transport/patch scripts with the response nonce described in the SSR guide.
Publishing the adapter does not depend on optional milestone 7.

## Initial validation record

On October 26, 2026, the clean tarball consumer passed all 30 checks on macOS with
Node 24 and Playwright 1.63.0: Chromium 153.0.8010.12, Firefox 155.0, and WebKit
26.6. The complete example client JavaScript measured 51,344 bytes gzip across
three chunks (80,000-byte budget), with one Ripple runtime. The example's
`tsrx-tsc` checks and production client/server builds passed. CI repeats the gate
on Linux and publishes its own report; measurements may vary with tool/platform
versions.

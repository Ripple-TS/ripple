# Upstream baseline and test mapping

Source: [TanStack/router](https://github.com/TanStack/router), commit
`da2adec76dbe6c0da6d6a0d5640f7b9388217f45` (October 25, 2026). Registry metadata
was reconfirmed October 26, 2026:

| Package                              | Version    |
| ------------------------------------ | ---------- |
| `@tanstack/router-core`              | `1.171.39` |
| `@tanstack/history`                  | `1.162.5`  |
| `@tanstack/solid-router` (reference) | `1.170.43` |
| `solid-js` (reference)               | `1.9.10`   |

The published Solid adapter depends on the same core/history versions and peers
with Solid `^1.9.10`. The reference version is recorded here, not installed into
the Ripple package or its typechecking graph.

`tests.json` inventories all files in `packages/solid-router/tests`, including
support fixtures, with SHA-256 checksums. It records each live `test`/`it`
declaration's source line, suite/title, and modifiers. Commented-out source is not
counted. A parameterized declaration is a family, not a count of expanded runtime
cases; dynamic titles remain source expressions. Test files without declarations
fail the inventory validation and must be investigated.

A test's stable lookup at this pinned baseline is `file:line`. Its mapping is
`file.overrides[line]` when present, otherwise `file.mapping`. **Every declaration
inherits an explicit status and reason**; no absence is interpreted as passing.

- `deferred`: not ported; record milestone and reason.
- `ported`: record Ripple test paths relative to this package, and preserve
  assertions unless an intentional difference is documented.
- `inapplicable`: explain the framework-specific behavior or excluded feature.

Milestone 2 ports the six render-acknowledgement tests, two provider-remount
tests, the first three retained-pending regressions, and the cached-preload
zero-update regression. Remaining cases stay explicitly deferred. Independent
store and native view-transition tests add Ripple-specific coverage; they do not
count as translated upstream cases. Solid's eager-memo execution counts need a
separate audit because Ripple readers are lazy. Upstream `skip`, `todo`, and
conditional modifiers remain visible independently of the Ripple mapping; upstream
skips do not become automatic exclusions.

Milestone 3 adds individually mapped client ports for active href/path matching,
remount dependencies, scoped APIs, lazy route/component loading and retries,
pending-minimum redirects, structured params, matches, blocker decisions, history
readers, background error recovery, cached context, and awaited falsy values.
Partial files retain their deferred defaults; only completed declarations receive
`ported` overrides. Tests added for Ripple-specific inputs/ownership do not claim
additional upstream cases.

## Milestone 3 feature gate

The upstream paths below are under `packages/solid-router/tests/`. Exact port
status is in `tests.json`; this table also identifies the Ripple-specific tests
that cover the adapter contract without claiming a complete upstream file port.

| Client feature                                                       | Upstream references                                                                                                                                       | Ripple tests (under `tests/client/`)                                                                          |
| -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Scoped readers, registration, params/search/context/loaders/location | `routeScopedShouldThrow.test.tsx`, `issue-7964-param-parsing-loader.test.tsx`, `issue-8115-context.test.tsx`, `Matches.test.tsx`, `useCanGoBack.test.tsx` | Corresponding `upstream/` ports, `features.test.tsrx`; `.ts` and TSRX typing in `../types/` and `../tooling/` |
| Nested/pathless/index routes, wrappers, identity/remount             | `remountDeps.test.tsx`, `RouterProvider.test.tsx`, `Outlet.test.tsx`                                                                                      | Remount port, `features.test.tsrx`, `router.test.tsrx`                                                        |
| Links, native attributes/events/refs, active state, navigation       | `link-path-matching.test.tsx`, `link-href-safety.test.tsx`, `link-element-props.test.tsx`, `navigate.test.tsx`                                            | Path/href ports, `links.test.tsrx`, `features.test.tsrx`                                                      |
| Preloads, cache, lazy imports/retries, cancellation/invalidation     | `createLazyRoute.test.tsx`, `component-preload-retry.test.tsx`, `store-updates-during-navigation.test.tsx`, `loaders.test.tsx`                            | Lazy/cache ports, `links.test.tsrx`, `features.test.tsrx`                                                     |
| Pending/error/not-found UI, reset, redirects, retained parents       | `errorComponent.test.tsx`, `issue-7367-pending-min-redirect.test.tsx`, `issue-7986-retained-pending.test.tsx`, `not-found.test.tsx`, `Await.test.tsx`     | Corresponding ports, `features.test.tsrx`; runtime `boundary-retry.test.tsrx`                                 |
| Blocking/history/scroll after rendering                              | `useBlocker.test.tsx`, `useCanGoBack.test.tsx`, `transitioner-render-ack.test.tsx`; core `scroll-restoration.ts`                                          | Corresponding ports, `history-scroll.test.tsrx` (no Solid scroll test file at this baseline)                  |
| Tracked inputs, selector isolation, outgoing observers, cleanup      | `use-match-outgoing-transition.test.tsx`, `link-destination.test.tsx`, `link-departing-scope.test.tsx`                                                    | Outgoing-match port, `features.test.tsrx`, `links.test.tsrx`, `history-scroll.test.tsrx`                      |

Lifecycle translations use real Ripple root disposal and explicit tracked reads.
State callbacks use `render` because Ripple's `children` is a template slot;
custom anchors receive `Derived<AnchorProps>` as `linkProps`. Flushes in tracked
input tests commit scheduled Ripple updates; they do not substitute for loader or
render completion. The disabled-href port additionally verifies click default
prevention. Lazy fixture delays and upstream controlled promises are retained.
Full applicable test/type parity and the React audit remain milestone 4.

Regenerate from a clean checkout at the pinned commit:

```sh
pnpm --filter @ripple-ts/tanstack-router upstream:inventory /path/to/TanStack-router
pnpm exec prettier --write packages/tanstack-router/upstream/tests.json
```

The generator reads local source, performs no network calls, preserves existing
mappings, and rejects a different commit or changed tracked test sources. When
upgrading, review changed/added/deleted test families and migrate their mappings
explicitly before changing the pin. The broader upgrade audit and React-only test
comparison are milestone 4 work. Preserve the upstream notice in `NOTICE` when
porting source or tests.

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
with Solid `^1.9.10`. The reference is installed only in the private Solid
fixture, outside the Ripple package dependency and typechecking graphs. React
source version `1.170.46` is audited at the same commit; React is not installed
for this audit.

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
Milestone 4 completes the applicable client/type audit described below.

## Milestone 4 parity gate

`tests.json` inventories the Solid baseline; `react-tests.json` inventories every
React test and support source at the same commit. Every declaration resolves to an
explicit mapping. `ported` means a translated scenario; React `covered` means the
audited behavior is already tested by the referenced Solid/native scenario.
Neither excludes nor deferred cases count as passing ports. Parameterized
declarations represent families, not expanded test counts.

The adapter test projects execute the runtime ports. Package typechecking runs the
positive and negative type ports in an isolated TypeScript graph, separate from
registered `.ts` consumers and the Solid fixture. The tooling suite uses
`compile_to_volar_mappings` for TSRX generic components, required props, events,
refs, tracked inputs and invalid inputs.

The bundled reference apps compare public state, lifecycle events and visible text
at initial load, same-route updates, pending navigation, supersession, late
completion, invalidation and disposal. They also assert retained parent state,
absence of stale rendered work, and removal of owned history listeners.

Translations use native `@if`/`@for`/`@try`, explicit tracked props, real root
disposal, and awaited public navigation completion. React `act` becomes callback
settlement followed by `flushSync`; it is not evidence that an unresolved loader
or render finished. Native event and error-value differences are documented in
[the compatibility contract](../docs/compatibility.md). Each exclusion in the
manifest identifies the affected framework contract.

The one upstream-skipped client scenario (Solid `routeContext.test.tsx:1585`, also
present in React) runs in Ripple with its assertions intact. Source skip modifiers
remain visible in the report. Milestone 5 completes the streaming-cleanup source,
SSR, hydration and assets. File routing remains optional milestone 7. No
client/type case is silently deferred.

## Milestone 5 SSR/hydration gate

All previously deferred milestone 5 declarations now have explicit dispositions in
both inventories. Only optional file routing remains deferred. The audit rejects
any unfinished client, type, SSR, hydration or asset case. A renderer-specific
exclusion is not counted as a passing port.

| Contract                                                                   | Ripple validation                                                                              |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Request isolation, loader transfer, headers, statuses, redirects           | `tests/server/ssr.test.tsrx`; concurrent requests and reused-router rejection                  |
| Buffered/streamed hydration, retained DOM, lazy imports, pending minimums  | `tests/client/ssr-hydration.test.tsrx`, terminal-lane ports and native root pending test       |
| Terminal boundaries, context reconstruction, shell context                 | Solid #8115 port, React error/not-found/context and match-provider ports                       |
| Head/data/executable scripts, manifests, JSON-LD, ownership                | Solid and React Scripts ports, React Asset ports, native `assets.test.tsrx`                    |
| Late records, failed deferred values, abort/consumer/lifetime cancellation | Server SSR tests, `server/upstream/stream-records.test.tsrx`, real compiled hydration fixtures |
| SSR links, refs, active props, URL safety, lazy components and Await       | `tests/server/upstream/`; refs use Ripple's symbol keys and CSS whitespace is normalized       |

Framework substitutions are explicit. Ripple buffered rendering waits for async
UI, while Solid's synchronous string renderer retains fallbacks. Ripple streaming
always sends an early shell; callers select buffered rendering for bots rather
than using Solid/React producer readiness APIs. Ripple's container root keeps its
configured pending boundary enabled; React's document-root suppression and
snapshot-getter/render counts are excluded. Loaded arbitrary errors retain their
original values. Late async errors whose ancestor bytes were already sent use
Ripple's error envelope and are checked through actual hydration and navigation.
Server effects do not run. Missing lazy exports report an error in production.

Tests use real server/client builds and execute each streamed script exactly once.
Promises transported by core are observed before their component boundaries
activate, preserving their original rejection for the eventual consumer without
unhandled-rejection noise. Core owns serialization and transport cleanup; Ripple
owns DOM patches and cancellable component work. See the
[SSR contract](../docs/ssr.md) for output ownership and the remaining
browser/release limits.

## Milestone 6 browser/package gate

`test:release` packs the adapter and pending Ripple dependencies, installs them
outside the workspace, checks declarations with the published `tsrx-tsc` and
consumer `tsconfig.json`, and builds both targets. It then runs
`tests/browser/run.js` against the production SSR example in Chromium, Firefox,
and WebKit, plus a browser navigation through Vite's dependency optimizer.

The 24 checks cover direct entry/reload, retained server DOM and loader state,
streaming hydration, params/search, nested layout state, lazy chunks, history,
modified clicks, preloading, blockers, base paths, scroll restoration, repeated
navigation/remount/disposal, and native transition snapshots/completion/fallback.
The module graph checks one Ripple runtime, correct client/server conditions and
no React/Solid runtime dependencies. Every client chunk counts toward the gzip
budget; CI uploads the measured chunks, browser versions and transition images.

Native animation-only `ready` rejection from the pinned core is explicitly
accounted for by native promise identity, recorded separately, and requires a
successful update callback. Application errors remain failures. See
[the release contract](../docs/release.md) for upstream #7906, strict CSP
follow-up #1594, reproduction commands and the scope of the performance/ownership
checks. No file-routing milestone is needed to use or publish the package.

## Upstream upgrades

```sh
# Local mapping gate: reports missing, deferred and upstream-skipped cases.
pnpm --filter @ripple-ts/tanstack-router upstream:audit
# Candidate source audit: nonzero exit when the commit or tracked sources differ.
pnpm --filter @ripple-ts/tanstack-router upstream:audit /path/to/TanStack-router
# Regenerate each inventory only after reviewing and migrating the baseline.
pnpm --filter @ripple-ts/tanstack-router upstream:inventory /path/to/TanStack-router solid
pnpm --filter @ripple-ts/tanstack-router upstream:inventory /path/to/TanStack-router react
```

The audit reports added/deleted/changed source checksums and test declarations,
including assertion-only changes with unchanged titles. It reads a clean local
checkout and makes no network requests. A different commit always requires review.
The generator refuses an unreviewed baseline change, changed source, or removed
source; new cases inherit a deferred mapping that fails the client/type gate.
Review the audit, migrate the manifests and version pins in the upgrade PR, then
regenerate and rerun runtime, type and differential checks. Preserve the upstream
notice in `NOTICE`.

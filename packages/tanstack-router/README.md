# @ripple-ts/tanstack-router

A native Ripple adapter over TanStack Router: code-defined routes, typed reactive
readers, links, lazy loading, boundaries, blocking, scroll restoration, and
request-scoped buffered/streaming SSR with hydration and route assets. Milestones
1–6 of [#1578](https://github.com/Ripple-TS/ripple/issues/1578) cover the declared
contract, including upstream runtime/type ports, production browser tests and a
clean installed-tarball consumer.

## Setup

```sh
pnpm add @ripple-ts/tanstack-router ripple
pnpm add -D @ripple-ts/vite-plugin vite
```

Enable `ripple()` from `@ripple-ts/vite-plugin` in Vite. The plugin compiles the
adapter's `.tsrx` components for the selected target and handles dependency
optimization. Start with the
[production SSR example](https://github.com/Ripple-TS/ripple/tree/main/packages/tanstack-router/examples/ssr)
for a complete code-defined route tree, registered types, lazy imports and
client/server entries. The package requires the Ripple peer version specified by
its release; keep one application runtime.

This is a separate TanStack Router integration. It does not change Ripple's own
routing system. File-based routing is optional future TSRX tooling and is not
required by this package.

## Available exports

Implemented adapter exports:

- `createRouter`, `Router`, `createRootRoute`, `createRootRouteWithContext`, and
  `createRoute`, `getRouteApi`, `createLazyRoute`, and `createRouteMask`.
- `RouterProvider`, `RouterContextProvider`, and `Outlet`.
- `useRouter`, `useRouterState`, `useMatch`, `useParams`, `useSearch`,
  `useLoaderData`, `useLoaderDeps`, `useRouteContext`, `useLocation`,
  `useMatches`, `useParentMatches`, `useChildMatches`, `useMatchRoute`,
  `useCanGoBack`, and `useNavigate`. Route instances expose their corresponding
  scoped readers. State readers return `Derived<T>` and are read through `.value`.
- `Link`, `createLink`, `useLinkProps`, `linkOptions`, `Navigate`, and
  `MatchRoute`.
- `lazyRouteComponent`, `Await`, `useAwaited`, and `ErrorComponent`.
- `useBlocker`, `Block`, and `useElementScrollRestoration`.
- `HeadContent`, `Scripts`, `Asset`, `ClientOnly`, and `useHydrated`.
- From `/ssr/server`: `createRequestHandler`, `renderRouterToString`,
  `renderRouterToStream`, `defaultRenderHandler`, and `defaultStreamHandler`.
- From `/ssr/client`: `hydrate` (router state) and `hydrateRouter` (state and
  DOM).

The package also re-exports these unmodified upstream utilities:

- From `@tanstack/router-core@1.171.39`: `createControlledPromise`,
  `defaultParseSearch`, `defaultStringifySearch`, `redirect`, `isRedirect`,
  `notFound`, `isNotFound`, `isMatch`, `lazyFn`, `retainSearchParams`, and
  `stripSearchParams`.
- From `@tanstack/history@1.162.5`: `createMemoryHistory`, `createBrowserHistory`,
  and `createHashHistory`. Browser/hash history require a browser when called.
- Types: `ControlledPromise`, `NotFoundError`, `Redirect`, `HistoryLocation`,
  `HistoryState`, and `RouterHistory`.

The core and history versions are pinned together. Ripple is a peer dependency so
the application and adapter share one runtime. React and Solid are not package
dependencies. The store factory uses `track()` values; it does not introduce
another state creation API. The component subtree uses `createRenderObserver()` to
acknowledge rendered navigation, including async work and supersession.

See [client usage and Ripple API adaptations](./docs/client.md),
[SSR, hydration, streaming and ownership](./docs/ssr.md),
[the compatibility contract](./docs/compatibility.md) for the milestone contract,
and
[the upstream inventory](https://github.com/Ripple-TS/ripple/blob/main/packages/tanstack-router/upstream/README.md)
for test provenance and status.

## Distribution

Follow Ripple's source distribution: ordinary modules ship as ESM JavaScript with
explicit `.d.ts` declarations; authored components use `.tsrx` source compiled by
the application's `@ripple-ts/vite-plugin` into client or server code. This
preserves the application's hydration, development, and SSR compiler options. The
root entry includes components, so consumers must use Ripple's compiler
integration. Dedicated `/ssr/server` and `/ssr/client` entries handle request
rendering and state restoration. The server/client fixtures exercise buffered and
streamed hydration through working navigation.

The private `tests/fixtures/source-library` models a component dependency with a
`.tsrx` export and declaration entry. `tests/fixtures/consumer` imports it through
package resolution, along with this package. Tests build that consumer for both
targets, hydrate server output, and verify disposal. These fixtures are excluded
from the published package. The [release gate](./docs/release.md) installs packed
artifacts outside the workspace and runs the production example in Chromium,
Firefox and WebKit.

## Development

From the workspace root:

```sh
pnpm install
pnpm --filter @ripple-ts/tanstack-router test
pnpm --filter @ripple-ts/tanstack-router typecheck
```

The three test projects (`tanstack-router-client`, `tanstack-router-server`, and
`tanstack-router-tooling`) also run with `pnpm test`; `pnpm typecheck` includes
the package. The client project's global setup builds the isolated server/client
consumer graphs, so no generated fixture output needs to be committed.

Use `tests/harness.js` for mounted tests. It provides scoped Testing Library DOM
queries, real Ripple root disposal, `createControlledPromise`, and
`advanceTimers`. Tests explicitly opt into fake timers. Cleanup disposes roots
before restoring timers and mocks; it never runs all outstanding timers just to
make a test pass.

The differential runners are separate private projects under `tests/fixtures/`,
with independent dependency and TypeScript graphs. The pinned Solid reference uses
Solid 1.9, independently of the Solid 2 benchmarks. Both apps bundle the same core
version and compare public state, lifecycle events, normalized UI, and cleanup at
controlled checkpoints. Package typechecking includes the upstream
positive/negative `.tsx` tests and checks the Solid fixture separately; the
tooling suite checks `.tsrx` call sites through the published mapping pipeline.

## Current limits

The upstream audit accounts for each pinned client, type, SSR/hydration and
streaming case, including explicit framework differences. The
[release gate](./docs/release.md) records browser and package validation. The
client feature gate and exact translated test families are recorded in the
upstream inventory. One mounted provider owns a router instance. Deprecated
framework-specific aliases and file-route factories are not exported. See the
client guide for explicit reactive inputs, `render` callbacks, custom anchors, and
history ownership.

TanStack core owns native `document.startViewTransition()` calls. Its update
callback waits for the adapter's render acknowledgement; navigation does not wait
for the animation's `finished` promise. Runtime lifecycle tests and real Chromium
snapshot/style checks cover this contract, including interrupted/skipped
animations and reduced motion. The [release notes](./docs/release.md) document the
pinned core's animation-promise rejection limitation
([upstream #7906](https://github.com/TanStack/router/issues/7906)). A React-style
Ripple `<ViewTransition>` is a separate feature in
[#1581](https://github.com/Ripple-TS/ripple/issues/1581).

The render observer reports subtree settlement. It does not provide atomic
concurrent DOM staging or roll back state updates when an updater throws.

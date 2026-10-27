# @ripple-ts/tanstack-router

Milestone 4 of [#1578](https://github.com/Ripple-TS/ripple/issues/1578) provides
the client adapter: code-defined routes, reactive readers, links, lazy loading,
boundaries, blocking, and render-aware navigation/scrolling, with audited upstream
runtime/type coverage and an isolated Solid comparison runner. The package is
**private** during development and will not be published with unrelated Ripple
releases. It is not feature-complete.

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

The package also re-exports these unmodified upstream utilities:

- From `@tanstack/router-core@1.171.39`: `createControlledPromise`,
  `defaultParseSearch`, `defaultStringifySearch`, `redirect`, `isRedirect`,
  `notFound`, `isNotFound`, `isMatch`, `lazyFn`, `retainSearchParams`, and
  `stripSearchParams`.
- From `@tanstack/history@1.162.5`: `createMemoryHistory`, `createBrowserHistory`,
  and `createHashHistory`. Browser/hash history require a browser when called.
- Types: `ControlledPromise`, `NotFoundError`, `Redirect`, `HistoryLocation`,
  `HistoryState`, and `RouterHistory`.

The core and history versions are pinned together. Ripple is a peer dependency
(`workspace:^`) so the application and adapter share one runtime. React and Solid
are not package dependencies. The store factory uses `track()` values; it does not
introduce another state creation API. The component subtree uses
`createRenderObserver()` to acknowledge rendered navigation, including async work
and supersession.

See [client usage and Ripple API adaptations](./docs/client.md),
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
integration. Dedicated SSR helpers and router state hydration remain milestone 5
work. The server/client build fixtures verify compilation, not full router SSR
compatibility.

The private `tests/fixtures/source-library` models a component dependency with a
`.tsrx` export and declaration entry. `tests/fixtures/consumer` imports it through
package resolution, along with this package. Tests build that consumer for both
targets, hydrate server output, and verify disposal. These fixtures are excluded
from the published package. A clean installed-tarball/browser release matrix is
tracked in milestone 6.

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

SSR/hydration and real-browser release validation remain milestones 5–6. Milestone
4 accounts for each pinned upstream case, including explicit framework differences
and later-milestone cases. The client feature gate and exact translated test
families are recorded in the upstream inventory. One mounted provider owns a
router instance. Deprecated framework-specific aliases and file-route factories
are not exported. See the client guide for explicit reactive inputs, `render`
callbacks, custom anchors, and history ownership.

TanStack core owns native `document.startViewTransition()` calls. Its update
callback waits for the adapter's render acknowledgement; navigation does not wait
for the animation's `finished` promise. Mocked lifecycle tests cover this
contract; real-browser snapshot/style validation remains milestone 6. A
React-style Ripple `<ViewTransition>` is a separate feature in
[#1581](https://github.com/Ripple-TS/ripple/issues/1581).

The render observer reports subtree settlement. It does not provide atomic
concurrent DOM staging or roll back state updates when an updater throws.

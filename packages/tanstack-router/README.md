# @ripple-ts/tanstack-router

Milestone 2 of [#1578](https://github.com/Ripple-TS/ripple/issues/1578) provides
native stores, code-defined routes, nested rendering, reactive readers, and the
navigation/rendering lifecycle. The package is **private** during development and
will not be published with unrelated Ripple releases. It is not feature-complete.

This is a separate TanStack Router integration. It does not change Ripple's own
routing system. File-based routing is optional future TSRX tooling and is not
required by this package.

## Available exports

Implemented adapter exports:

- `createRouter`, `Router`, `createRootRoute`, `createRootRouteWithContext`, and
  `createRoute`.
- `RouterProvider`, `RouterContextProvider`, and `Outlet`.
- `useRouter`, `useRouterState`, `useMatch`, `useParams`, `useSearch`,
  `useLoaderData`, `useLoaderDeps`, `useRouteContext`, and `useNavigate`. Route
  instances expose their corresponding scoped readers. State readers return
  `Derived<T>` and are read through `.value`.

The package also re-exports these unmodified upstream utilities:

- From `@tanstack/router-core@1.171.39`: `createControlledPromise`,
  `defaultParseSearch`, `defaultStringifySearch`, `redirect`, `isRedirect`,
  `notFound`, and `isNotFound`.
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

See [the compatibility contract](./docs/compatibility.md) for the planned API and
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

When differential reference runners are added in milestone 4, place them in
separate private projects with their own dependency and TypeScript graphs. The
pinned Solid reference uses Solid 1.9, independently of this repository's Solid 2
benchmarks; its router module augmentations must not enter the Ripple type tests.

## Current limits

`Link`, the remaining navigation/match helpers, explicit remount dependencies,
complete error/not-found/lazy-boundary behavior, and reactive provider context are
milestone 3 work. Full type/runtime parity, SSR/hydration, and real-browser
release validation remain milestones 4–6. A provider currently accepts a stable
router and plain context, with one mounted provider per router instance.

TanStack core owns native `document.startViewTransition()` calls. Its update
callback waits for the adapter's render acknowledgement; navigation does not wait
for the animation's `finished` promise. Mocked lifecycle tests cover this
contract; real-browser snapshot/style validation remains milestone 6. A
React-style Ripple `<ViewTransition>` is a separate feature in
[#1581](https://github.com/Ripple-TS/ripple/issues/1581).

The render observer reports subtree settlement. It does not provide atomic
concurrent DOM staging or roll back state updates when an updater throws.

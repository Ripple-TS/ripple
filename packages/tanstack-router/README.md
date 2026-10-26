# @ripple-ts/tanstack-router

Milestone 1 of [#1578](https://github.com/Ripple-TS/ripple/issues/1578): package
foundation, API contract, and validation harness. This package does **not yet
provide a working Ripple router**. Route factories, providers, links, and reactive
readers arrive in later milestones.

This is a separate TanStack Router integration. It does not change Ripple's own
routing system. File-based routing is optional future TSRX tooling and is not
required by this package.

## Available exports

The package currently re-exports these unmodified upstream utilities:

- From `@tanstack/router-core@1.171.39`: `createControlledPromise`,
  `defaultParseSearch`, `defaultStringifySearch`, `redirect`, `isRedirect`,
  `notFound`, and `isNotFound`.
- From `@tanstack/history@1.162.5`: `createMemoryHistory`, `createBrowserHistory`,
  and `createHashHistory`. Browser/hash history require a browser when called;
  importing the package on the server is supported.
- Types: `ControlledPromise`, `NotFoundError`, `Redirect`, `HistoryLocation`,
  `HistoryState`, and `RouterHistory`.

The core and history versions are pinned together. Ripple is a peer dependency
(`workspace:^`, packed as `^0.5.0` at this baseline) so the application and
adapter share one runtime. React and Solid are not package dependencies. This
foundation does not export placeholder router implementations or re-export core's
router as if it were a Ripple adapter.

See [the compatibility contract](./docs/compatibility.md) for the planned API and
[the upstream inventory](https://github.com/Ripple-TS/ripple/blob/main/packages/tanstack-router/upstream/README.md)
for test provenance and status.

## Distribution

Follow Ripple's source distribution: ordinary modules ship as ESM JavaScript with
explicit `.d.ts` declarations; authored components will ship as `.tsrx` source
compiled by the application's `@ripple-ts/vite-plugin` into client or server code.
This preserves the application's hydration, development, and SSR compiler options.
The package currently has only framework-neutral JavaScript, so both environments
resolve the same entry. Framework-specific SSR helpers will get explicit subpath
exports when implemented.

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

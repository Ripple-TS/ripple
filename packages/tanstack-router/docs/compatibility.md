# Compatibility contract

This tracks the target contract for milestones 2–6. Milestone 5 implements SSR,
hydration, and streaming; milestone 4 audits the client feature surface and types:
routes, links, reactive readers, lazy loading, boundaries, blocking, history, and
scroll integration. The package README lists the exact current exports and limits;
the table below separates client features from later SSR and release gates.

| Surface                  | Planned API / behavior                                                                                                                                                                       | Milestone |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| Router and route tree    | `createRouter`, `Router`, `createRootRoute`, `createRootRouteWithContext`, `createRoute`, `getRouteApi`; code-defined nested, pathless, and index routes                                     | 2–3       |
| Rendering and context    | `RouterProvider`, `RouterContextProvider`, `Outlet`, match rendering, `Wrap`/`InnerWrap`, stable route component identity and remount dependencies                                           | 2–3       |
| Reactive readers         | `useRouterState`, `useLocation`, `useMatch`, `useMatches`, parent/child matches, `useParams`, `useSearch`, `useRouteContext`, `useLoaderData`, `useLoaderDeps`, and route-scoped equivalents | 3         |
| Navigation               | `useNavigate`, `Navigate`, `Link`, `createLink`, `useLinkProps`, `linkOptions`, active matching, history, blocking, preloading, scroll restoration                                           | 3         |
| Loading and boundaries   | Lazy routes/components, explicit imports, invalidation, cancellation, pending/error/not-found UI, reset, and supported async helpers                                                         | 2–3       |
| Types                    | Registered-router inference, params/search/context/loader inference, valid destinations, negative cases, component props and DOM events/refs                                                 | 4         |
| SSR                      | Request-scoped helpers, status/redirect/error handling, head/scripts, serialization, buffered and streaming rendering                                                                        | 5         |
| Hydration                | Router state restoration, pending/lazy/error cases, no unintended initial refetches, disposal and navigation during hydration                                                                | 5         |
| Browser/package behavior | Native anchor behavior, back/forward, scroll, production build and clean installation                                                                                                        | 6         |

Exact aliases and deprecated upstream exports are audited before claiming parity.
File-route factories/types and generated route trees belong to optional
milestone 7. TanStack Start, Query integration, and devtools are outside this
issue. React hooks, React node types, Solid accessors/resources, and
framework-specific error stack formatting are not compatibility requirements;
their observable routing behavior is. Record exclusions per test instead of
silently dropping them.

## Reactive readers

State readers return read-only `Derived<T>` values. Call them during component
initialization and read `.value` inside tracked rendering or effects. Preserve
upstream selection, `from`, `strict`, and `shouldThrow` semantics in the resulting
type. `useRouter()` returns the stable router instance; `useNavigate()` returns a
callable imperative navigation function.

Route-scoped readers retain their inference through registered router types:

```tsrx
function Post() @{
  const params = Route.useParams();
  const data = Route.useLoaderData();
  <article>
    <h1>{data.value.title}</h1>
    <p>Post: {params.value.postId}</p>
  </article>
}
```

Destructuring `params.value` in setup takes a snapshot. Derive a selected value or
read `.value` at the point of use to observe same-route navigation without
remounts. Returning a `Derived<T>` does not give callers permission to write
router state.

## Link and provider inputs

The following dynamic-input contract is implemented in milestone 3. See
[client usage](./client.md) for callbacks and custom anchor components.

Component props are ordinary objects evaluated once by Ripple. For changing
navigation inputs, accept either the normal TanStack value or a read-only Ripple
derived at the **top-level prop** (`T | Derived<T>`). A `Tracked<T>` is accepted
through Ripple's read-only derived interface. Resolve it when calculating hrefs,
active state, preloading, and navigation; never snapshot it only at mount.

This applies to `to`, `from`, `params`, `search`, `hash`, `state`, `mask`, active
options, and navigation flags. Nested objects are normal upstream values: pass a
derived of the whole object when its fields change. Preserve TanStack updater
functions as callbacks; do not interpret arbitrary functions as reactive getters.
Normal event handlers and refs retain Ripple's host-element semantics, including
`class` rather than `className`.

Usage:

```tsrx
import { track } from 'ripple';

function PostLink() @{
  const postId = track('first');
  <Link to="/posts/$postId" params={track(() => ({ postId: postId.value }))}>
    Read post
  </Link>
}
```

`RouterProvider.router` is a stable instance for that provider's lifetime. Switch
instances by unmounting/remounting the provider explicitly. Context may be a plain
object or a derived object; updates affect subsequent loads, and an explicit
`router.invalidate()` reruns already loaded route context/guards. Updating context
does not itself invalidate the router or create a second context store. Route
definitions, component constructors, and callbacks stay stable configuration; use
`router.update()` for other imperative option changes.

## Rendering completion and ownership

Core owns navigation policy, loading/caching, and pending timing. The adapter owns
Ripple rendering, subscription lifetimes, and acknowledgement of the exact
rendered destination. A suspended or superseded render must not acknowledge a
newer navigation. Same-route updates preserve component state unless remount
dependencies change. Leaving a route disposes its observers before they can read
invalid match state. Provider cleanup removes its history subscription and settles
owned pending acknowledgements.

The adapter uses Ripple's `createRenderObserver()` to await subtree rendering and
settle superseded/unmounted observations. It does not implement atomic concurrent
DOM staging. `tick()` or an arbitrary timeout is not evidence of completion of a
suspended render. TanStack core remains the sole owner of native browser view
transitions; render completion and animation completion are separate.

## Parity and framework differences

The pinned Solid runtime/type inventory and React audit are in
[`../upstream/`](../upstream/README.md). Each declaration has a disposition and
test references or an explicit exclusion/deferment reason. React-only behavior
already covered by a Solid/native scenario is marked `covered`, not counted as a
direct port. The source-skipped preload/context case runs in Ripple.

Ripple preserves arbitrary thrown values, so error component and `onCatch`
arguments default to `unknown`; narrow them before reading error properties.
Missing lazy exports report errors in development and production. Default error
markup and Solid's error normalization are not part of the contract.

Reader options are fixed during component initialization. Changing a `from` option
requires a new component scope. Links and provider context retain their explicit
tracked-input contract. Native user event callbacks run even when an event was
already prevented; the router action remains cancelled. Blocked links prevent
default clicks. Ripple follows Solid's inactive styling for external links and its
held-location behavior for newly mounted departing-route links.

React memo/StrictMode counts, Solid proxy-store detection, standalone framework
boundary helpers, and global concurrent DOM staging are excluded. Their public
routing counterparts are tested with native scopes and control flow. Pending DOM
may be removed instead of kept hidden as in React. Browser validation remains
milestone 6. The [SSR contract](./ssr.md) documents request ownership, streaming,
assets and the deliberate renderer differences.

Disabled Ripple links omit `href` for all destinations, including direct schemes.
This applies identically on the server and client.

# Client adapter

Milestone 3 provides the client feature surface. The package remains private; full
upstream/type parity, SSR, and browser release validation follow in milestones
4–6. Use the pinned core and a single Ripple runtime.

## Reactive input and output

Readers return `Derived<T>`. Read `.value` in templates or effects. Route objects,
`getRouteApi(id)`, and `createLazyRoute(id)(options)` expose scoped data readers,
`useNavigate()`, and `Link`. Register your router through the package's `Register`
interface to infer route IDs, destinations, params, search, context and loaders.

`Link`, `Navigate`, and `MatchRoute` accept plain or tracked values for top-level
routing options. Nested objects and updater functions retain TanStack semantics.
For a changing object, pass a derived of the entire object:

```tsrx
function PostLink() @{
  const id = track('first');
  <Link to="/posts/$id" params={track(() => ({ id: id.value }))}>
    Read post
  </Link>
}
```

Provider context accepts a plain or derived object. Context changes update router
options on Ripple's effect flush, without automatically loading routes. Call
`router.invalidate()` to rerun loaders and `beforeLoad` guards. Core intentionally
retains a route's `context()` contribution for the same match; compute changing
contributions in `beforeLoad`. Keep the router instance stable while mounted.
Configure `Wrap` and `InnerWrap` on the router; both propagate Ripple context.

## Links and callbacks

`Link` renders an anchor with active/inactive props, classes, styles, normal DOM
attributes and events, and Ripple refs (callback cleanup, tracked refs, or ref
arrays). Disabled links have no href. Modified clicks, downloads, external links,
non-self targets, and `reloadDocument` preserve browser navigation. User handlers
run before the routing handler and can prevent it. Core validates public hrefs,
including rewrites, masks and history formatting, against its protocol allowlist.

Ripple reserves `children` for templates. Use **`render`** for state callbacks:

```tsrx
<Link to="/" render={({ isActive }) => isActive ? 'Home (active)' : 'Home'} />
<MatchRoute
  to="/posts/$id"
  render={(params) => params ? params.id : 'No match'}
/>
<Await
  promise={request}
  fallback="Loading"
  render={(data) => <p>{data.title}</p>}
/>
```

`useAwaited({ promise })` returns a derived value, integrating with Ripple
`@try`/`@pending`/`@catch`. Replacing a resolved promise retains its previous UI
while the replacement is pending, following Ripple's async behavior.

`useLinkProps(options)` returns `Derived<AnchorProps>` to spread into an anchor.
`createLink()` passes that live object as **`linkProps`** to a custom component;
forward it to the actual anchor to retain navigation and ref ownership:

```tsrx
function Anchor({ linkProps, children }) {
  return <a {...linkProps.value}>{children}</a>;
}
const CustomLink = createLink(Anchor);
```

`linkOptions()` validates and preserves an options object for reuse. Router
factories and configuration callbacks are stable, ordinary values.

## Loading and boundaries

Core owns loader caching, invalidation, cancellation, redirects, and pending
minimums. Link preloading supports `intent`, `render`, and `viewport`; intent
preloads honor delays and are canceled on leave, destination changes, or unmount.
Viewport preloading requires `IntersectionObserver`.

Use `route.lazy(() => import('./page.tsrx').then(module => module.Route))` with
`createLazyRoute()`, or `lazyRouteComponent(importer, exportName?)` for individual
components. Lazy component preloads are shared; successful client imports stop
advertising preload work. Failures reach route error UI. An error component can
call `reset()` and `router.invalidate()` to retry. A standalone lazy component can
await its `.preload()` retry before resetting its surrounding Ripple boundary.

Nested, pathless and index routes render through `Outlet`. Same-route updates
preserve component identity; `remountDeps` or `defaultRemountDeps` opt into
remounting when their serialized dependency value changes. Error and not-found
boundaries follow route ancestry, pass error/data props, and recover when a new
match generation is published. Render-thrown not-found values bypass error UI.

## History, blocking and scrolling

The package re-exports core's pinned memory, browser and hash history factories.
`useCanGoBack()` returns a derived boolean. The modern
`useBlocker({ shouldBlockFn, withResolver, disabled, enableBeforeUnload })` API
returns a derived resolver. `Block` provides the same API with an optional
`render` callback. Deprecated positional blocker overloads are not part of this
adapter.

A blocked resolver exposes `proceed()` and `reset()`. Disabling or unmounting a
blocker cancels outstanding confirmation work. Blocked programmatic navigation
settles its own promise, without acknowledging a newer navigation. History's
browser back/forward and before-unload behavior is supplied by the pinned history
package; memory history supports push/replace blockers, as upstream does.

Configure `scrollRestoration`, `getScrollRestorationKey`,
`scrollRestorationBehavior`, `scrollToTopSelectors`, and hash/reset options on the
router/navigation. Core restores on `onRendered`, after Ripple's actual subtree
completion, including suspension. `useElementScrollRestoration()` returns the
core's saved element entry for virtualized lists. Core owns its document-lifetime
scroll listeners/cache; provider remounts do not install another set. The adapter
owns and disposes its history subscription, blockers, preload timers/observers,
refs, and render acknowledgement. Real browser scroll/BFCache validation remains
milestone 6; deprecated scroll components and SSR scroll scripts are not exported.

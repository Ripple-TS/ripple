# Server rendering and hydration

The adapter supports buffered and streaming HTML responses using TanStack core
1.171.39 and Ripple's renderer. Create a fresh router and route tree for each
request. The [production example and release gate](./release.md) validate both
modes in real browsers using installed package artifacts.

## Application layout

Render `HeadContent` and `Scripts` once in a common layout. Put them in the root
`shellComponent` if they must remain present when the root itself renders an error
or pending fallback. The shell is a Ripple component inside the application
container; the HTTP helpers own `<html>`, `<head>`, `<body>`, and `#app`.

```tsrx
import {
  createRootRoute,
  createRoute,
  createRouter,
  HeadContent,
  Scripts,
  Outlet,
  Link,
} from '@ripple-ts/tanstack-router';

export function getRouter() {
  const root = createRootRoute({
    shellComponent: ({ children }) => <>
      <HeadContent />
      {children}
      <Scripts />
    </>,
    component: Outlet,
  });
  const index = createRoute({
    getParentRoute: () => root,
    path: '/',
    loader: () => ({ greeting: 'Hello' }),
    head: () => ({ meta: [{ title: 'Home' }] }),
    component: Home,
  });
  function Home() @{
    const data = index.useLoaderData();
    <main>
      <h1>{data.value.greeting}</h1>
      <Link to="/">Home</Link>
    </main>
  }
  return createRouter({ routeTree: root.addChildren([index]) });
}
```

## HTTP handler

Compile the server entry with Ripple's server target and the browser entry with
its hydration-capable client target.

```js
import {
  createRequestHandler,
  defaultStreamHandler,
  defaultRenderHandler,
} from '@ripple-ts/tanstack-router/ssr/server';
import { getRouter } from './router.tsrx';

export function handle(request) {
  return createRequestHandler({ createRouter: getRouter, request })(
    defaultStreamHandler,
  );
}
// Use defaultRenderHandler for a buffered response, including crawlers that
// require all deferred UI. Handler selection is explicit, not User-Agent based.
```

Core owns request URL normalization, server history, loading, headers, redirects,
and the status selected by loaders (`200`, errors, and not-found results). A
redirect returns its original HTTP response without rendering. Buffered rendering
waits for all component work and transported promises; an uncaught render failure
returns `500`. A streaming response sends its shell first, so later render errors
cannot change its status. Route boundaries handle recoverable errors; a fatal
error terminates the stream.

`renderRouterToString` and `renderRouterToStream` accept the request-handler
callback arguments. Both optionally accept `children: Component` for a custom
application root; pass the same component to `hydrateRouter` on the client. They
are called after core prepares/dehydrates the request router. A custom callback
must return the stream helper's entire result (including its disposal ownership),
not just its `.response` field. Core exports response-wrapping helpers from
`@tanstack/router-core/ssr/server` for middleware that replaces a response body.

Do not reuse a router across requests; the handler rejects reused instances. Keep
authentication and request data in the fresh router's context. The optional
`getRouterManifest` callback supplies core's asset manifest. Route definitions,
context objects, and application caches must themselves follow your application's
request-isolation rules.

## Browser entry

```js
import { hydrateRouter } from '@ripple-ts/tanstack-router/ssr/client';
import { getRouter } from './router.tsrx';

const router = getRouter();
const dispose = await hydrateRouter({
  router,
  target: document.getElementById('app'),
});
// Call dispose() when the application root is removed.
```

Load the browser entry after `#app` exists (for example, with a module script).
`hydrateRouter` first restores core state, route context, and lazy components,
then hydrates Ripple. Successful transported loaders are reused. Missing client
suffixes and `ssr: false` / `ssr: 'data-only'` routes follow core's hydration
handoff and pending minimums. `ClientOnly` keeps its fallback through hydration
and enables its children after mount. `useHydrated()` returns `Derived<boolean>`
for the component scope, initially false even in a newly mounted scope.

For a custom mount workflow, `hydrate(router)` from the same entry restores only
router state; then call Ripple's `hydrate()` yourself. Restoration is memoized per
router, not across requests or roots. It signals transport cleanup on success or
failure without replacing the original error. Navigation that supersedes an
asynchronous hydration hook keeps ownership of the newer destination.

## Assets

`HeadContent` derives titles, meta tags, links, styles, JSON-LD and head scripts
from the presented route prefix. Child title/meta entries override ancestors;
unchanged assets retain their DOM nodes across navigation. Manifest styles, inline
CSS, preloads, script format, `assetCrossOrigin`, and route nonces follow core's
asset model. JSON-LD escapes raw-text delimiters while retaining valid JSON.

`Scripts` renders route/manifest data scripts in place. Executable scripts are
placed in the head and deduplicated by resolved source URL or inline source, type,
and nonce. Existing executable scripts are reused; adapter-owned nodes are removed
after their last mounted owner is disposed. Script effects already executed are
not reversible. Bootstrap state precedes application scripts, and the streaming
insertion boundary follows the application root. Neither component is responsible
for serializing router state.

Route asset contents supplied as raw strings are trusted application code/markup.
Use `JSON.stringify` with escaped `<` characters for application data scripts.
`Asset` accepts one stable tag descriptor; updates are normally driven by
`HeadContent`/`Scripts` and their keyed asset lists. Ripple component props do not
rerender like React props. Do not duplicate `HeadContent` within a router layout.

## Streaming ownership and limits

TanStack core serializes match data, context, custom `dehydrate` data, promises,
and configured serialization adapters. Ripple owns component async envelopes,
scoped CSS and deferred DOM patches. The adapter emits complete renderer records
and selects core's `record-end` insertion profile. Initial state precedes the
transport boundary; late transport records and Ripple patches can arrive in either
order. The document closes only after both producers finish. Core reserves the
exact `</body></html>` sequence for that close; custom raw content emitted after
the shell must not contain that sequence. Structured loader data uses the
serializers and does not need manual framing.

The request signal, response cancellation, serialization failures and core's
stream lifetime limit cancel Ripple rendering and release core's SSR state. Ripple
aborts controllers returned by `trackAsync`. Application promises without an
abortable operation cannot themselves be forcibly stopped, but their late results
cannot write to the cancelled response. Dispose the hydrated root to remove its
history subscription and reactive work. The application owns browser history
instances it creates separately.

Buffered output waits for deferred UI; it does not reproduce Solid's synchronous
string-render fallback snapshot. Streaming is the early-shell API for every user
agent. Ripple uses its configured root pending boundary inside `#app`, including a
forced reload after hydration. Framework-specific React document-shell rules,
Solid producer APIs, and React script-hoisting behavior are not reproduced.

This milestone uses the existing Ripple renderer and its inline patch runtime.
Route/transport nonce attributes are supported, but a complete strict-CSP nonce
policy for Ripple's own inline scripts is tracked in
[#1594](https://github.com/Ripple-TS/ripple/issues/1594). Browser navigation,
package installation and representative bundle/ownership checks are covered by the
release gate; strict CSP remains outside the contract. File-route manifests,
TanStack Start, Query and devtools remain outside this adapter's scope.

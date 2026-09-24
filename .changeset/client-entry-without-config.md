---
'@ripple-ts/vite-plugin': minor
---

Keep ripple.config.ts out of the browser. The generated hydration entry imported
the whole config, so a middleware or other server-only module it imported (for
example one calling `node:fs` or `node:crypto` at load) was bundled for the client
and threw before hydration, leaving the page inert. The entry now imports only the
modules the config names for the client, and the server sends the matched route's
entry and layout with the page data.

Breaking: `transport` and `rootBoundary.pending`/`rootBoundary.catch` take module
references instead of values, like a route `entry`: a root-relative path, or an
`[exportName, path]` tuple. A path alone uses the module's default export for
`transport`, and the default or first capitalized function export for a boundary
component. Move the handlers or components into their own modules, for example
`transport: ['transport', '/src/transport.ts']` and
`rootBoundary: { pending: '/src/Loading.tsrx' }`.

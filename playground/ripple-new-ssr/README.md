# ripple-new SSR example

A minimal server-render + client-hydrate example for **ripple-new** (SSR Phase 5).
It shows the full round-trip: the server renders `App` to an HTML string,
serializes the async data it resolved, and the browser hydrates the markup in
place — adopting the existing DOM, attaching event handlers, and seeding the async
value so there's no client re-fetch.

## Run

```bash
pnpm --filter ripple-new-ssr dev          # http://localhost:5175
pnpm --filter ripple-new-ssr dev:stream   # http://localhost:5176 (streaming shell, see below)
```

Open the page, then click the counter — the handler is live on the server-rendered
button. View source to see the server HTML already contains the greeting and
`Clicked 0 times`, plus the inline
`<script type="application/json" data-ripple-new-suspense>` carrying the resolved
async value.

## How it fits together

| File                  | Role                                                                                                                           |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `index.html`          | Shell with `<!--ssr-head-->` and `<div id="app"><!--ssr-body--></div>` markers, and the `entry-client.ts` module script.       |
| `src/App.tsrx`        | A single-root component: `use(promise)` async data + a `useState` counter.                                                     |
| `src/entry-server.ts` | Imports `render` from `ripple-new/server`; `renderApp()` awaits `render(App)` → `{ head, body, css }`.                         |
| `src/entry-client.ts` | Imports `hydrate` from `ripple-new`; hydrates `App` into `#app`.                                                               |
| `server.js`           | Vite in middleware mode + `polka`; loads `entry-server.ts` via `ssrLoadModule`, splices `body`/`head`/`css` into the template. |
| `vite.config.ts`      | `rippleNew()` (per-module SSR target) + `ssr.noExternal` for the raw-TS workspace package.                                     |

The **same `App.tsrx` compiles to two targets** automatically: the `rippleNew()`
Vite plugin emits `mode: 'server'` (HTML-string output) when Vite loads a module
for SSR (`ssrLoadModule`), and `mode: 'client'` (template-clone DOM runtime) for
the browser bundle. (`rippleNew({ ssr: true })` can force server mode globally,
but a standard SSR setup like this one doesn't need it.)

## Streaming (stretch)

`pnpm dev:stream` runs `server-stream.js`, which flushes the `<head>` shell to the
browser **before** awaiting `render()`, so asset loading overlaps server-side data
resolution.

This is **not** yet true Suspense streaming — flushing `@pending` fallbacks
immediately and streaming each boundary's resolved markup as its promise settles.
`render()` currently awaits all suspended `use(promise)` calls and returns the
whole body, so that would require a `renderToStream` API on the runtime (future
work).

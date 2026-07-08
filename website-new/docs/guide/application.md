---
title: Creating a Ripple application
---

# Creating a Ripple application

We'll start with this code snippet, and break it down step by step.

```js
import { mount } from 'ripple';
// @ts-expect-error: known issue, we're working on it
import { App } from './App.tsrx';

mount(App, {
	target: document.getElementById('app')!,
});
```

## The Root Component

The `App` "object" we've imported is actually a component. Every app requires a
"root component" that can contain other components as its children.

While many examples in this guide only need a single component, most real
applications are organized into a tree of nested, reusable components. For
example, a Todo application's component tree might look like this:

```text
App (root component)
├─ TodoList
│  └─ TodoItem
│     ├─ TodoDeleteButton
│     └─ TodoEditButton
└─ TodoFooter
   ├─ TodoClearButton
   └─ TodoStatistics
```

In later sections of the guide, we will discuss how to define and compose multiple
components together. Before that, we will focus on what happens inside a single
component.

## Mounting the App

To bring the app to life, we'll use the `mount` function that we imported to
attach the application to the DOM.

`mount()` expects a component, and an options object. Inside the options object,
we'll use `document.getElementById()` to acquire a reference to the DOM element we
want the app to be attached to the `target` property.

## Hydration

When using server-side rendering (SSR), the server pre-renders your components to
HTML. The client then needs to "hydrate" this HTML by attaching event listeners
and making it interactive, without re-creating the DOM elements.

Ripple provides the `hydrate()` function for this purpose:

```js
import { hydrate } from 'ripple';
import { App } from './App.tsrx';

hydrate(App, {
  target: document.getElementById('app')!,
});
```

### When to use `mount()` vs `hydrate()`

| Function    | Use Case                                                                                    |
| ----------- | ------------------------------------------------------------------------------------------- |
| `mount()`   | Client-side only rendering (SPA). Clears the target element and renders fresh.              |
| `hydrate()` | Server-side rendering (SSR). Adopts existing server-rendered HTML and makes it interactive. |

### Server-Side Rendering

On the server, use `render()` from `ripple/server`. It is asynchronous — the
returned promise resolves once all async work (`trackAsync`) has settled — and
it resolves an object, not a string:

- `body` — HTML for the app's insertion point, including hydration markers.
- `head` — HTML for the document head, collected from `<head>` writes such as
  `<title>` and `<meta>`.
- `css` — a `Set` of scoped style hashes collected during the render. Pass it
  to `get_css_for_hashes()` and emit the result in a `<style data-ripple-ssr>`
  tag so hydration can later swap it for the client styles.
- `topLevelError` — the error that reached the root boundary, if any.

```js
// server.js
import { render, get_css_for_hashes } from 'ripple/server';
import { App } from './App.tsrx';

const { head, body, css } = await render(App);

res.send(`
  <!DOCTYPE html>
  <html>
    <head>
      ${head}
      <style data-ripple-ssr>${get_css_for_hashes(css)}</style>
    </head>
    <body>
      <div id="app">${body}</div>
      <script type="module" src="/client.js"></script>
    </body>
  </html>
`);
```

`render()` takes the component itself. To render with props, wrap the
component in a function that applies them, and pass the same props to
`hydrate()` on the client:

```js
// server.js
const Root = () => App({ title: 'Hello world!' });
const { head, body, css } = await render(Root);
```

```js
// client.js
import { hydrate } from 'ripple';
import { App } from './App.tsrx';

hydrate(App, {
  target: document.getElementById('app')!,
  props: { title: 'Hello world!' }
});
```

### Root Boundaries

`render()` accepts a `rootBoundary`: app-level `pending` and `catch`
components wrapped around the root, used when no `@try` boundary inside the
app handles a suspension or an error. Pass the same `rootBoundary` to
`hydrate()` so the server and client agree on the boundary structure.

```js
const { head, body, css } = await render(App, {
  rootBoundary: {
    pending: LoadingScreen,
    catch: ErrorScreen,
  },
});
```

### Streaming SSR

Buffered rendering holds the whole response until the slowest data has
resolved. Streaming sends bytes as soon as they exist:

1. The **shell** flushes immediately: all synchronous HTML, with each
   suspended `@try` boundary showing its `@pending` fallback, plus all CSS
   collected so far. The browser starts painting and fetching assets while the
   server is still waiting on data.
2. As each boundary's async work settles, its HTML streams as a
   self-contained chunk — carrying its own CSS, serialized `trackAsync`
   results, and `<head>` content — and a small inline runtime (shipped once
   with the shell) swaps it into the boundary's slot. Chunks arrive in
   whatever order the data resolves; parent boundaries always arrive before
   nested ones.
3. A boundary with only `@catch` streams an empty slot that later resolves to
   its body — or to the server-rendered catch HTML if the data failed. An
   error whose boundary is already on the wire is handed to the client
   boundary during hydration instead.

Async work must sit under a `@try` boundary that has `@pending` (or under the
root boundary's `pending`) — the fallback is what occupies the slot in the
shell.

Enable streaming by passing a `stream` sink. `streamTemplate` wraps the stream
in a document: `before` and `between` frame the SSR head content and the shell
body in the first write, and `after` is pushed once the last chunk has
streamed.

```js
import { render, create_ssr_stream } from 'ripple/server';
import { App } from './App.tsrx';

const { stream, sink } = create_ssr_stream();

render(App, {
  stream: sink,
  rootBoundary: { pending: LoadingScreen },
  streamTemplate: {
    before: '<!DOCTYPE html><html><head>',
    between: '</head><body><div id="app">',
    after: '</div><script type="module" src="/client.js"></script></body></html>',
  },
});

return new Response(stream, {
  headers: { 'Content-Type': 'text/html; charset=utf-8' },
});
```

`hydrate()` needs no extra configuration for streaming: content that arrived
before hydration is adopted normally, and chunks that arrive afterwards
activate their boundary in place without re-rendering. Set
`closeStream: false` when you need the sink to stay open for writes of your
own after rendering finishes.

### Streaming With The Vite Plugin

Apps built on `@ripple-ts/vite-plugin` do not call `render()` directly. Enable
streaming for render routes in `ripple.config.ts`:

```ts
export default {
  ssr: {
    streaming: true,
  },
};
```

The plugin splits `index.html` at the `<!--ssr-head-->` and `<!--ssr-body-->`
markers to build the stream scaffold, so both markers must stay in the
template. When they are missing, the plugin falls back to buffered SSR and
logs a warning.

Root boundaries are configured the same way — set `rootBoundary` in
`ripple.config.ts` and the plugin applies it to the server render and to
client hydration for every render route:

```ts
import { LoadingScreen } from './src/LoadingScreen.tsrx';
import { ErrorScreen } from './src/ErrorScreen.tsrx';

export default {
  rootBoundary: {
    pending: LoadingScreen,
    catch: ErrorScreen,
  },
  ssr: {
    streaming: true,
  },
};
```

### Cleanup

Both `mount()` and `hydrate()` return a cleanup function that unmounts the
component:

```js
const cleanup = mount(App, { target: document.getElementById('app')! });

// Later, to unmount:
cleanup();
```

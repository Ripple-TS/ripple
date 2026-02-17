---
title: Creating a Ripple application
---

# Creating a Ripple application

We'll start with this code snippet, and break it down step by step.

```js
import { mount } from 'ripple';
// @ts-expect-error: known issue, we're working on it
import { App } from './App.ripple';

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

In later sections of the guide, we will discuss how to define and compose
multiple components together. Before that, we will focus on what happens inside
a single component.

## Mounting the App

To bring the app to life, we'll use the `mount` function that we imported to
attach the application to the DOM.

`mount()` expects a component, and an options object. Inside the options object,
we'll use `document.getElementById()` to acquire a reference to the DOM element
we want the app to be attached to the `target` property.

## Hydration

When using server-side rendering (SSR), the server pre-renders your components to HTML. The client then needs to "hydrate" this HTML by attaching event listeners and making it interactive, without re-creating the DOM elements.

Ripple provides the `hydrate()` function for this purpose:

```js
import { hydrate } from 'ripple';
import { App } from './App.ripple';

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

On the server, use the `render()` function from `ripple/server` to generate HTML:

```js
// server.js
import { render } from 'ripple/server'
import { App } from './App.ripple'

const html = render(App, {
	props: { title: 'Hello world!' },
})

// Send html to the client
res.send(`
  <!DOCTYPE html>
  <html>
    <body>
      <div id="app">${html}</div>
      <script type="module" src="/client.js"></script>
    </body>
  </html>
`)
```

Then on the client, hydrate the server-rendered HTML:

```js
// client.js
import { hydrate } from 'ripple';
import { App } from './App.ripple';

hydrate(App, {
  target: document.getElementById('app')!,
  props: { title: 'Hello world!' }
});
```

### Cleanup

Both `mount()` and `hydrate()` return a cleanup function that unmounts the component:

```js
const cleanup = mount(App, { target: document.getElementById('app')! });

// Later, to unmount:
cleanup();
```

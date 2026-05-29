---
title: Control flow in Ripple
---

# Control flow

## If statements

If blocks work seamlessly with Ripple's templating language, you can put them
inside the JSX-like statements, making control-flow far easier to read and reason
with.

<Code>

```ripple
export function Truthy({ x }) {
  return <>
  <div>
    if (x) {
      <span>"x is truthy"</span>
    } else {
      <span>"x is falsy"</span>
    }
  </div>

  </>;
}
```

</Code>

## Guard returns

Use normal JavaScript guard clauses before returning TSRX when a component should
render nothing or return another value.

<Code>

```ripple
import { track } from 'ripple';

export function AuthGate() {
  let &[is_logged_in] = track(false);

  if (!is_logged_in) {
    return <p>"Please sign in."</p>;
  }

  return <>
  <h1>"Dashboard"</h1>
  <p>"Private content"</p>

  </>;
}
```

</Code>

`return` is not valid inside a TSRX element or fragment body. Use `if`, `else`,
ternaries, or extracted helper functions inside the template instead.

## Switch statements

Switch statements let you conditionally render content based on a value. They work
with both static and reactive values.

<Code>

```ripple
export function StatusIndicator({ status }) {
  return <>
  <div>
    switch (status) {
      case: 'init':
        // fall-through to the next
      case 'loading':
        <p>"Loading..."</p>
        break;
      case 'success':
        <p>"Success!"</p>
        break;
      case 'error':
        <p>"Error!"</p>
        break;
      default:
        <p>"Unknown status"</p>
    }
  </div>

  </>;
}
```

</Code>

You can also use reactive values with switch statements.

<Code>

```ripple
import { track } from 'ripple';

export function InteractiveStatus() {
  return <>
  let &[status] = track('loading');

  <button onClick={() => (status = 'success')}>"Success"</button>
  <button onClick={() => (status = 'error')}>"Error"</button>

  <div>
    switch (status) {
      case 'init':
        <p>"Init"</p>
      // fall-through to the next
      case 'loading':
        <p>"Loading..."</p>
        break;
      case 'success':
        <p>"Success!"</p>
        break;
      case 'error':
        <p>"Error!"</p>
        break;
      default:
        <p>"Unknown status"</p>
    }
  </div>

  </>;
}
```

</Code>

## For statements

You can render collections using a `for...of` loop.

<Code>

```ripple
function ListView({ title, items }) {
  return <>
  <h2>{title}</h2>
  <ul>
    for (const item of items) {
      <li>{item.text}</li>
    }
  </ul>

  </>;
}

// usage
export default function App() {
  return <>
  <ListView
    title="My List"
    items={[
      { text: 'Item 1' },
      { text: 'Item 2' },
      { text: 'Item 3' },
    ]}
  />

  </>;
}
```

</Code>

The `for...of` loop has also a built-in support for accessing the loops numerical
index. The `label` index declares a variable that will used to assign the loop's
index.

```ripple
for (const item of items; index i) {
  <div>
    {item.label}
    " at index "
    {i}
  </div>
}
```

You can also provide a `key` for efficient list updates and reconciliation:

```ripple
for (const item of items; index i; key item.id) {
  <div>
    {item.label}
    " at index "
    {i}
  </div>
}
```

**Key Usage Guidelines:**

- **Arrays with `RippleObject` objects**: Keys are usually unnecessary - object
  identity and reactivity handle updates automatically. Identity-based loops are
  more efficient with less bookkeeping.
- **Arrays with plain objects**: Keys are needed when object reference isn't
  sufficient for identification. Use stable identifiers: `key item.id`.

You can use Ripple's reactive arrays to easily compose contents of an array.

<Code>

```ripple
import { RippleArray } from 'ripple';

export function Numbers() {
  return <>
  const array = new RippleArray(1, 2, 3);

  for (const item of array; index i) {
    <div>
      {item}
      " at index "
      {i}
    </div>
  }

  <button onClick={() => array.push(array.length + 1)}>"Add Item"</button>

  </>;
}
```

</Code>

Clicking the `<button>` will create a new item.

::: info Note `for...of` loops inside components must contain either dom elements
or components. Otherwise, the loop can be run inside an `effect` or function.
:::

## Try statements

Try blocks work to build the foundation for **error boundaries**, when the runtime
encounters an error in the `try` block, you can easily render a fallback in the
`catch` block.

```ripple
import { reportError } from 'some-library';

export function ErrorBoundary() {
  return <>
  <div>
    try {
      <ComponentThatFails />
    } catch (e) {
      reportError(e);

      <div>"An error occurred! "{e.message}</div>
    }
  </div>

  </>;
}
```

The `catch` block also receives a `reset` function as its second argument.
Calling `reset()` clears the error state and re-renders the children, which is
useful for building retry UIs:

```ripple
export function RetryBoundary() {
  return <>
  <div>
    try {
      <ComponentThatMightFail />
    } catch (e, reset) {
      <div>
        <p>"Error: "{e.message}</p>
        <button onClick={() => reset()}>"Try again"</button>
      </div>
    }
  </div>

  </>;
}
```

## Dynamic Elements

You can render dynamic HTML elements by storing the tag name in a tracked variable
and using the `<@tagName>` syntax:

```ripple
import { track } from 'ripple';

export function App() {
  return <>
  let &[tag] = track('div');

  <@tag class="dynamic">"Hello World"</@tag>
  <button onClick={() => (tag = tag === 'div' ? 'span' : 'div')}>
    "Toggle Element"
  </button>

  </>;
}
```

## Async (Suspense boundaries) <Badge type="warning" text="Experimental" />

Components can use `await` directly in their body — no `async` keyword needed.
Everything before the first `await` renders immediately; everything after suspends
until the promise resolves.

```ripple
function UserProfile({ id }: { id: number }) {
  return <>
  // Renders immediately
  <h1>"Loading profile..."</h1>

  // Suspends here until resolved
  const user = await fetchUser(id);

  // Renders after resolution
  <h1>{user.name}</h1>
  <p>{user.email}</p>

  </>;
}
```

Wrap the component in a `try/pending` block to handle the suspended state:

```ripple
export function App() {
  return <>
  try {
    <UserProfile id={1} />
  } pending {
    <p>"Loading..."</p>
  } catch (e) {
    <p>
      "Error: "
      {e.message}
    </p>
  }

  </>;
}
```

The `{pending}` clause shows while the component is suspended. The `{catch}`
clause handles both sync throws and async rejections. Both clauses are optional
and can be used independently.

### Reactive async with `await track(fn)`

For async operations that should re-run when reactive dependencies change, use
`await track(fn)`. Any tracked values read inside the function become dependencies
— when they change the operation re-runs and the component re-suspends to the
nearest `try/pending` boundary.

```ripple
import { track } from 'ripple';

export function CitySearch() {
  return <>
  let &[query] = track('');

  // Renders immediately, never suspended
  <input type="text" value={query} onInput={(e) => (query = e.target.value)} />

  // Re-runs and re-suspends whenever query changes
  const city = await track(() => fetchCity(query));

  // Only renders once city has resolved for the current query
  <p>
    "Showing: "
    {query}
  </p>
  <CityCard {city} />

  </>;
}
```

::: info Note When `query` changes, everything above the `await track` line stays
visible. Only the content below re-suspends and shows `{pending}` until the new
fetch resolves.
:::

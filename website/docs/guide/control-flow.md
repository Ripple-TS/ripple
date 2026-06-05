---
title: Control flow in Ripple
---

# Control flow

## If statements

Use `@if` blocks for inline conditional rendering inside TSRX templates.

<Code>

```ripple
export const Truthy = ({ x }) => {
  return <div>
    @if (x) {
      <span>x is truthy</span>
    } else {
      <span>x is falsy</span>
    }
  </div>
};
```

</Code>

## Guard returns

Use normal JavaScript guard clauses before returning TSRX when a component should
render nothing or return another value.

<Code>

```ripple
import { track } from 'ripple';

export const AuthGate = () => <>
  let &[is_logged_in] = track(false);

  if (!is_logged_in) {
    return <p>Please sign in.</p>;
  }

  <>
    <h1>Dashboard</h1>
    <p>Private content</p>
  </>
</>;
```

</Code>

`return` is a real function exit inside a TSRX element or fragment body. Use it
for guard exits; use `@if`/`else`, ternaries, or extracted helper functions when
you want to render inline.

## Switch statements

Use `@switch` to conditionally render content based on a value. It works with
both static and reactive values.

<Code>

```ripple
export const StatusIndicator = ({ status }) => {
  return <div>
    @switch (status) {
      case 'init':
        // fall-through to the next
      case 'loading':
        <p>Loading...</p>
        break;
      case 'success':
        <p>Success!</p>
        break;
      case 'error':
        <p>Error!</p>
        break;
      default:
        <p>Unknown status</p>
    }
  </div>;
};
```

</Code>

You can also use reactive values with switch statements.

<Code>

```ripple
import { track } from 'ripple';

export const InteractiveStatus = () => <>
  let &[status] = track('loading');

  <>
    <button onClick={() => (status = 'success')}>Success</button>
    <button onClick={() => (status = 'error')}>Error</button>

    <div>
      @switch (status) {
        case 'init':
          <p>Init</p>
        // fall-through to the next
        case 'loading':
          <p>Loading...</p>
          break;
        case 'success':
          <p>Success!</p>
          break;
        case 'error':
          <p>Error!</p>
          break;
        default:
          <p>Unknown status</p>
      }
    </div>
  </>
</>;
```

</Code>

## For statements

Use `@for (... of ...)` to render collections.

<Code>

```ripple
const ListView = ({ title, items }) => {
  return <>
    <h2>{title}</h2>
    <ul>
      @for (const item of items) {
        <li>{item.text}</li>
      }
    </ul>
  </>;
};

// usage
const App = () => <ListView
    title="My List"
    items={[
      { text: 'Item 1' },
      { text: 'Item 2' },
      { text: 'Item 3' },
    ]}
  />;

export default App;
```

</Code>

The `for...of` loop has also a built-in support for accessing the loops numerical
index. The `label` index declares a variable that will used to assign the loop's
index.

```ripple
@for (const item of items; index i) {
  <div>{item.label} at index {i}</div>
}
```

You can also provide a `key` for efficient list updates and reconciliation:

```ripple
@for (const item of items; index i; key item.id) {
  <div>{item.label} at index {i}</div>
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

export const Numbers = () => <>
  const array = new RippleArray(1, 2, 3);

  <>
    @for (const item of array; index i) {
      <div>{item} at index {i}</div>
    }

    <button onClick={() => array.push(array.length + 1)}>Add Item</button>
  </>
</>;
```

</Code>

Clicking the `<button>` will create a new item.

::: info Note `for...of` loops inside components must contain either dom elements
or components. Otherwise, the loop can be run inside an `effect` or function.
:::

## Try statements

`@try` blocks build the foundation for **error boundaries**. When the runtime
encounters an error in the `try` block, you can easily render a fallback in the
`catch` block.

```ripple
import { reportError } from 'some-library';

export const ErrorBoundary = () => {
  return <div>
    @try {
      <ComponentThatFails />
    } catch (e) {
      reportError(e);

      <div>An error occurred! {e.message}</div>
    }
  </div>;
};
```

The `catch` block also receives a `reset` function as its second argument.
Calling `reset()` clears the error state and re-renders the children, which is
useful for building retry UIs:

```ripple
export const RetryBoundary = () => {
  return <div>
    @try {
      <ComponentThatMightFail />
    } catch (e, reset) {
      <div>
        <p>Error: {e.message}</p>
        <button onClick={() => reset()}>Try again</button>
      </div>
    }
  </div>;
};
```

## Dynamic Elements

You can render dynamic HTML elements by storing the tag name in a tracked variable
and using the `<@tagName>` syntax:

```ripple
import { track } from 'ripple';

export const App = () => <>
  let &[tag] = track('div');

  <>
    <@tag class="dynamic">Hello World</@tag>
    <button onClick={() => (tag = tag === 'div' ? 'span' : 'div')}>
      Toggle Element
    </button>
  </>
</>;
```

## Async (Suspense boundaries) <Badge type="warning" text="Experimental" />

Components can use `await` directly in their body — no `async` keyword needed.
The component suspends at the `await` and resumes rendering when the promise
resolves.

```ripple
const UserProfile = ({ id }: { id: number }) => <>
  const user = await fetchUser(id);

  <>
    <h1>{user.name}</h1>
    <p>{user.email}</p>
  </>
</>;
```

Wrap the component in a `try/pending` block to handle the suspended state:

```ripple
export const App = () => {
  return <>
    @try {
      <UserProfile id={1} />
    } pending {
      <p>Loading...</p>
    } catch (e) {
      <p>Error: {e.message}</p>
    }
  </>;
};
```

The `pending` clause shows while the component is suspended. The `catch`
clause handles both sync throws and async rejections. Both clauses are optional
and can be used independently.

### Reactive async with `await track(fn)`

For async operations that should re-run when reactive dependencies change, use
`await track(fn)`. Any tracked values read inside the function become dependencies
— when they change the operation re-runs and the component re-suspends to the
nearest `@try/pending` boundary.

```ripple
import { track } from 'ripple';

export const CitySearch = () => <>
  let &[query] = track('');
  const city = await track(() => fetchCity(query));

  <>
    <input type="text" value={query} onInput={(e) => (query = e.target.value)} />
    <p>Showing: {query}</p>
    <CityCard {city} />
  </>
</>;
```

::: info Note When `query` changes, `await track` re-runs and re-suspends to the
nearest `@try/pending` boundary until the new fetch resolves.
:::

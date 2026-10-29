---
title: Control flow in Ripple
---

# Control flow

## If statements

Use `@if` blocks for inline conditional rendering inside TSRX templates. Every
control-flow body is an implicit statement container, so `@if`, `@for`,
`@switch`, and `@try` arms always use `{...}` blocks. Direct `return`,
`continue`, and `break` statements are not valid inside `@if` template branches;
use ordinary JavaScript `if` statements in setup for guard exits.

<Code>

```tsrx
export function Truthy({ x }) {
  return <div>
    @if (x) {
      <span>x is truthy</span>
    } @else {
      <span>x is falsy</span>
    }
  </div>
}
```

</Code>

## Guard returns

Use normal JavaScript guard clauses before returning TSRX when a component should
render nothing or return another value.

<Code>

```tsrx
import { track } from 'ripple';

export function AuthGate() @{
  const is_logged_in = track(false);

  if (!is_logged_in.value) {
    return <p>Please sign in.</p>;
  }

  <>
    <h1>Dashboard</h1>
    <p>Private content</p>
  </>
}
```

</Code>

`return` is a real function exit inside a statement container. Use it for guard
exits; use `@if`/`else`, ternaries, or extracted helper functions when you want
to render inline.

## Switch statements

Use `@switch` to conditionally render content based on a value. It works with
both static and reactive values. Each `case` has its own `{...}`
body. Cases do not fall through, and `break`/`return` are not used inside `@switch`.

<Code>

```tsrx
export function StatusIndicator({ status }) {
  return <div>
    @switch (status) {
      @case 'init': {
        <p>Starting...</p>
      }
      @case 'loading': {
        <p>Loading...</p>
      }
      @case 'success': {
        <p>Success!</p>
      }
      @case 'error': {
        <p>Error!</p>
      }
      @default: {
        <p>Unknown status</p>
      }
    }
  </div>;
}
```

</Code>

You can also use reactive values with switch statements.

<Code>

```tsrx
import { track } from 'ripple';

export function InteractiveStatus() @{
  const status = track('loading');

  <>
    <button onClick={() => (status.value = 'success')}>Success</button>
    <button onClick={() => (status.value = 'error')}>Error</button>

    <div>
      @switch (status.value) {
        @case 'init': {
          <p>Init</p>
        }
        @case 'loading': {
          <p>Loading...</p>
        }
        @case 'success': {
          <p>Success!</p>
        }
        @case 'error': {
          <p>Error!</p>
        }
        @default: {
          <p>Unknown status</p>
        }
      }
    </div>
  </>
}
```

</Code>

## For statements

Use `@for (... of ...)` to render collections. The loop body must be a `{...}`
template block.

<Code>

```tsrx
function ListView({ title, items }) @{
  <>
    <h2>{title}</h2>
    <ul>
      @for (const item of items) {
        <li>{item.text}</li>
      }
    </ul>
  </>
}

// usage
function App() {
  return <ListView
    title="My List"
    items={[
      { text: 'Item 1' },
      { text: 'Item 2' },
      { text: 'Item 3' },
    ]}
  />;
}

export default App;
```

</Code>

The `for...of` loop has also a built-in support for accessing the loops numerical
index. The `label` index declares a variable that will used to assign the loop's
index.

```tsrx
@for (const item of items; index i) {
  <div>{item.label} at index {i}</div>
}
```

You can also provide a `key` for efficient list updates and reconciliation:

```tsrx
@for (const item of items; index i; key item.id) {
  <div>{item.label} at index {i}</div>
}
```

Use ` { ... }` for the fallback that should render when the iterable has no
items. If some items should be skipped, filter the iterable before passing it to
`@for`; direct `continue`, `break`, and `return` statements are not valid inside
template loop bodies.

```tsrx
export function FilteredList({ items }) @{
  const visibleItems = items.filter((item) => !item.hidden);

  <ul>
    @for (const item of visibleItems; key item.id) {
      <li>{item.label}</li>
    } @empty {
      <li>No items</li>
    }
  </ul>
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

```tsrx
import { RippleArray } from 'ripple';

export function Numbers() @{
  const array = new RippleArray(1, 2, 3);

  <>
    @for (const item of array; index i) {
      <div>{item} at index {i}</div>
    }

    <button onClick={() => array.push(array.length + 1)}>Add Item</button>
  </>
}
```

</Code>

Clicking the `<button>` will create a new item.

::: info Note `for...of` loops inside components must contain either dom elements
or components. Otherwise, the loop can be run inside an `effect` or function.
:::

## Try statements

`@try` blocks build the foundation for **error boundaries**. The `try`,
`pending`, and `catch` arms must be `{...}` template blocks. When the runtime
encounters an error in the `try` block, you can easily render a fallback in the
`catch` block.

```tsrx
import { reportError } from 'some-library';

export function ErrorBoundary() @{
  <div>
    @try {
      <ComponentThatFails />
    } @catch (e) {
      reportError(e);

      <div>An error occurred! {e.message}</div>
    }
  </div>
}
```

The `catch` block also receives a `reset` function as its second argument.
Calling `reset()` clears the error state and re-renders the children, which is
useful for building retry UIs:

```tsrx
export function RetryBoundary() @{
  <div>
    @try {
      <ComponentThatMightFail />
    } @catch (e, reset) {
      <div>
        <p>Error: {e.message}</p>
        <button onClick={() => reset()}>Try again</button>
      </div>
    }
  </div>
}
```

## Dynamic Elements

You can render dynamic HTML elements or components by writing the tag as an
expression in braces — `<{expression}>`. The expression can be a tag name
string or a component, including one read from a tracked value:

```tsrx
import { track } from 'ripple';

export function App() @{
  const tag = track('div');

  <>
    <{tag.value} class="dynamic">Hello World</{tag.value}>
    <button onClick={() => (tag.value = tag.value === 'div' ? 'span' : 'div')}>
      Toggle Element
    </button>
  </>
}
```

## Async boundaries

Use `trackAsync` to read promises or async iterables through a tracked handle.
`@pending` supplies the initial loading UI, and `@catch` handles failures:

```tsrx
import { trackAsync } from 'ripple';

export function Greeting() @{
  @try {
    const message = trackAsync(() => Promise.resolve('Hello'));
    <p>{message.value}</p>
  } @pending {
    <p>Loading…</p>
  } @catch (error, reset) {
    <button onClick={() => reset()}>Try again</button>
  }
}
```

Do not use `await` directly in a component body or `await track(...)`. Read reactive
inputs synchronously in the `trackAsync` callback. Changed inputs start new work;
reads of that new query can suspend until its first result, while existing ready
DOM can remain in place. Use `getTrackedStatus` when you need an explicit loading
indicator or a safe-access guard.

An iterable keeps its latest accepted `.value` readable between yields and during
same-source recovery. Natural completion changes its status without publishing
another data value. `reset()` recreates the failed branch and its owned sources;
it does not refetch a source owned by an ancestor.

See [Async Data](./async-data) for iterable sources, status inspection, migration
from `trackPending`, and server-to-client continuation.

---
title: State management in Ripple
---

# State management

## Context

Ripple has the concept of `context` where a value or reactive object can be shared
through the component tree – like in other frameworks. This all happens from the
`Context` class that is imported from `ripple`.

Creating contexts may take place anywhere. Contexts can contain anything including
tracked values or objects. However, context cannot be read via `get` or written to
via `set` inside an event handler or at the module level as it must happen within
the context of a component. A good strategy is to assign the contents of a context
to a variable via the `.get()` method during the component initialization and use
this variable for reading and writing.

When Child components overwrite a context's value via `.set()`, this new value
will only be seen by its descendants. Components higher up in the tree will
continue to see the original value.

Example with tracked / reactive contents:

<Code>

```tsrx
import { Context, track } from 'ripple';

// create context with an empty object
const context = new Context({});
const context2 = new Context();

export function App() @{
  // get reference to the object
  const obj = context.get();
  // set your reactive value
  const count = track(0);
  obj.count = count;

  // create another tracked variable
  const count2 = track(0);
  // context2 now contains a tracked variable
  context2.set(count2);

  <>
    <button onClick={() => {
      count.value++;
      count2.value++;
    }}>Click Me</button>

    // context's reactive property count gets updated
    <pre>Context: {count.value}</pre>
    <pre>Context2: {count2.value}</pre>
  </>
}
```

</Code>

Passing data between components:

<Code console>

```tsrx
import { Context } from 'ripple';

const MyContext = new Context(null);

function Child() {
  // Context is read in the Child component
  const value = MyContext.get();

  // value is "Hello from context!"
  console.log(value);

  return <p>Value in Child: {value}</p>;
}

export function Parent() {
  const value = MyContext.get();

  // Context is read in the Parent component, but hasn't yet
  // been set, so we fallback to the initial context value.
  // So the value is `null`
  console.log(value);

  // Context is set in the Parent component
  MyContext.set('Hello from context!');

  return <Child />
}
```

</Code>

### Sharing context across files

Create and export a context instance from a shared module, then import that same
instance in the components that provide or consume it. Each `new Context()`
creates a separate context, even if its type or default value is the same.
Keeping the instance in a shared module also avoids circular imports between
components.

```ts
// theme-context.ts
import { Context, type Tracked } from 'ripple';

export type ThemeStore = {
  theme: Tracked<string>;
};

export const ThemeContext = new Context<ThemeStore>();
```

```tsrx
// App.tsrx
import { track } from 'ripple';
import { ThemeContext } from './theme-context';
import { Button } from './Button.tsrx';

export function App() @{
  const store = { theme: track('light') };
  ThemeContext.set(store);

  <>
    <p>Theme in App: {store.theme.value}</p>
    <Button />
  </>
}
```

```tsrx
// Button.tsrx
import { ThemeContext } from './theme-context';

export function Button() @{
  const store = ThemeContext.get();

  <button onClick={() => {
    store.theme.value = store.theme.value === 'light' ? 'dark' : 'light';
  }}>
    Toggle theme: {store.theme.value}
  </button>
}
```

`App` provides a store object whose `theme` property is a tracked value before
rendering `Button`. Both components read the same `store.theme.value`, so
clicking the button updates the theme displayed in both. The button changes
`store.theme.value`; it does not replace the store with `.set()`.
Context lookup follows the component tree regardless of which files define the
components, so descendants can import and read `ThemeContext` without intermediate
components passing it along.

### Passing a context as a prop

You can also pass the same context instance to a component in another file. In
the example above, keep `ThemeContext.set(store)` in `App` and change the button
usage to `<Button context={ThemeContext} />`. Then `Button.tsrx` can receive the
context as a prop instead of importing the instance:

```tsrx
// Button.tsrx
import type { Context } from 'ripple';
import type { ThemeStore } from './theme-context';

export function Button({ context }: { context: Context<ThemeStore> }) @{
  const store = context.get();

  <button onClick={() => {
    store.theme.value = store.theme.value === 'light' ? 'dark' : 'light';
  }}>
    Toggle theme: {store.theme.value}
  </button>
}
```

Passing the instance does not change context lookup: the component still reads
the nearest value provided for that instance in its component ancestry. Call
`.get()` during component initialization, then update the returned store's
tracked properties in event handlers.

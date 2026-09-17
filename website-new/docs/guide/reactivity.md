---
title: Reactivity in Ripple
---

# Reactivity

## Reactive Variables

You use `track` to create a single tracked value. The `track` function will create
a `Tracked<T>` object, and you read and write the tracked value through its
`.value` property. You can pass the `Tracked<T>` object between components,
functions and context to read and write to the value in different parts of your
codebase.

```ts
import { track } from 'ripple';

const name = track('World');
const count = track(0);

// Updates automatically trigger re-renders
count.value++;
```

Objects can also contain tracked values:

```ts
import { track } from 'ripple';

const current = track(0);
const counter = { current };

// Updates automatically trigger re-renders
counter.current.value++;
```

### Reading and Writing with `.value`

Read and write a tracked value using the `.value` property on the `Tracked<V>`
object:

```ts
import { track } from 'ripple';

const count = track(0);

// Read the current value
console.log(count.value); // 0

// Write a new value
count.value++;
console.log(count.value); // 1
```

Reading `.value` inside a template, effect or derived subscribes to the tracked
value, and assigning to `.value` updates everything that depends on it. Because
the `Tracked<V>` object stays around, you can store tracked values in data
structures, pass them as props typed as `Tracked<T>`, or share them through
context.

```ts
import { track } from 'ripple';

// Storing tracked values in an array — use .value to read/write
const items = [track(1), track(2), track(3)];
items[0].value++; // reactively updates
```

Derived values are `Derived<T>` objects: you pass a function to `track` rather
than a value, and their `.value` is read-only:

```ts
import { track } from 'ripple';

export function App() @{
  const count = track(10);
  const double = track(() => count.value * 2);
  const quadruple = track(() => double.value * 2);

  <>
    <p>Count: {count.value}</p>
    <p>Double: {double.value}</p>
    <p>Quadruple: {quadruple.value}</p>
    <button onClick={() => count.value++}>Increment Count</button>
  </>
}
```

A derived created with `true` in the setter position is a `WritableDerived<T>`
and can be written to for **optimistic state**. The written value is exposed
immediately, and when the next computation settles it takes precedence and
overrides it:

```ts
import { track } from 'ripple';

const count = track(0);
const double = track(() => count.value * 2, undefined, true);

// Write optimistically — shows 99 immediately
double.value = 99;

// When count next changes, double reverts to count * 2
```

If you want to use a tracked value inside a reactive context, such as an effect
but you don't want that value to be a tracked dependency, you can use `untrack`:

```ts
import { track, effect, untrack } from 'ripple';

const count = track(0);
const double = track(() => count.value * 2);
const quadruple = track(() => double.value * 2);

effect(() => {
  // This effect will never fire again, as we've untracked the only dependency it has
  console.log(untrack(() => quadruple.value));
})
```

::: info Note You cannot create `Tracked` objects in module/global scope, they
have to be created on access from an active component context.
:::

### track with get / set

The optional get and set parameters of the `track` function let you customize how
a tracked value is read or written, similar to property accessors but expressed as
pure functions. The get function receives the current stored value and its return
value is exposed when `.value` is read. The set function should return the value that will actually be stored and receives two
parameters: the first is the one being assigned and the second is the previous
value. The get and set functions may be useful for tasks such as logging,
validating, or transforming values before they are exposed or stored.

```tsrx
import { track } from 'ripple';

export function App() @{
  const count = track(
    0,
    (current) => {
      console.log(current);
      return current;
    },
    (next, prev) => {
      console.log(prev);
      if (typeof next === 'string') {
        next = Number(next);
      }
      return next;
    },
  );

  <button onClick={() => count.value++}>{count.value}</button>
}
```

::: info Note If no value is returned from either `get` or `set`, `undefined` is
either exposed (for get) or stored (for set). Also, if only supplying the `set`,
the `get` parameter must be set to `undefined`.
:::

## Transporting Reactivity

Ripple doesn't constrain reactivity to components only. `Tracked<T>` objects can
simply be passed by reference between boundaries:

<Code console>

```tsrx
import { track, effect, type Tracked } from 'ripple';

function createDouble(count: Tracked<number>) {
  const double = track(() => count.value * 2);

  effect(() => {
    console.log('Count:', count.value);
  });

  return double;
}

export function App() @{
  const count = track(0);
  const double = createDouble(count);

  <>
    <p>Count: {count.value}</p>
    <p>Double: {double.value}</p>
    <button onClick={() => count.value++}>Increment Count</button>
  </>
}
```

</Code>

Passing the `Tracked<T>` object lets the receiver write to it as well as read it.
To share a value read-only, pass `trackReadOnly(count)` instead: it produces a
`Derived<T>` whose `value` can be read but not written (a write warns in
development), the same as `track(() => count.value)`. The same applies to
component props:

```tsrx
import { track, type Derived } from 'ripple';

function Child({ count }: { count: Derived<number> }) {
  return <p>Count: {count.value}</p>;
}

export function App() @{
  const count = track(0);

  <>
    <Child count={trackReadOnly(count)} />
    <button onClick={() => count.value++}>Increment Count</button>
  </>
}
```

## Dynamic Components

Ripple has built-in support for dynamic components, a way to render different
components based on reactive state. Instead of hardcoding which component to show,
you can store a component in a writable derived, `track(() => Child1, undefined, true)`
(the third argument `true` makes it writable), and update it at runtime. Passing a
function to `track()` always creates a derived, so to hold a component (or any
function) in a plain `Tracked` instead, create the tracked empty and assign it:
`const swapMe = track<Component>(); swapMe.value = Child1;`.
When the tracked value changes, Ripple automatically unmounts the previous
component and mounts the new one. Dynamic components are rendered with the
`<{expression}>` tag syntax. Read the component from its tracked object explicitly,
for example `<{swapMe.value} />`. This makes it straightforward to pass components
as props or swap them directly within a component, enabling flexible, state-driven
UIs with minimal boilerplate.

<Code>

```tsrx
import { track, type Component, type Derived } from 'ripple';

export function App() @{
  const swapMe = track(() => Child1, undefined, true);
  // A plain Tracked works too. Create it empty and assign the component,
  // because track(Child1) would treat the function as a computation:
  // const swapMe = track<Component>();
  // swapMe.value = Child1;

  <>
    <Child {swapMe} />

    <button onClick={() => (swapMe.value = swapMe.value === Child1 ? Child2 : Child1)}>
      Swap Component
    </button>
  </>
}

function Child({ swapMe }: { swapMe: Derived<Component> }) {
  return <{swapMe.value} />
}

function Child1(props) {
  return <pre>I am child 1</pre>
}

function Child2(props) {
  return <pre>I am child 2</pre>
}
```

</Code>

## Effects

When dealing with reactive state, you might want to be able to create side-effects
based on changes that happen upon updates. To do this, you can use `effect`:

<Code console>

```tsrx
import { track, effect } from 'ripple';

export function App() @{
  const count = track(0);
  effect(() => {
    console.log(count.value);
  });

  <button onClick={() => count.value++}>Increment</button>
}
```

</Code>

## After Update tick()

The `tick()` function returns a Promise that resolves after all pending reactive
updates have been applied to the DOM. This is useful when you need to ensure that
DOM changes are complete before executing subsequent code, similar to Vue's
`nextTick()` or Svelte's `tick()`.

<Code console>

```tsrx
import { tick, track, effect } from 'ripple';

export function App() @{
  const count = track(0);

  effect(() => {
    if (count.value === 0) {
      console.log('initial run, skipping');
      return;
    }

    tick().then(() => {
      console.log('after the update');
    });
  });

  <button onClick={() => count.value++}>Increment</button>
}
```

</Code>

## Untracking Reactivity

<Code console>

```tsrx
import { track, effect, untrack } from 'ripple';

export function App() @{
  const count = track(10);
  const double = track(() => count.value * 2);
  const quadruple = track(() => double.value * 2);

  effect(() => {
    // This effect will never fire again, as we've untracked the only dependency it has
    console.log(untrack(() => quadruple.value));
  });

  <>
    <p>Count: {count.value}</p>
    <p>Double: {double.value}</p>
    <p>Quadruple: {quadruple.value}</p>
    <button onClick={() => count.value++}>Increment Count</button>
  </>
}
```

</Code>

## Snapshotting State

Sometimes you need the current data behind a reactive array or object as plain,
non-reactive data — for example to log it, serialize it, send it over the network,
or hand it to non-Ripple code. Use `snapshot` to take a detached shallow copy.

The values are read _without_ subscribing, so calling `snapshot` inside an effect
or derived will not create a dependency. The result is a plain array or object
(not a Ripple proxy), so later mutations to the source don't affect it. The copy
is shallow: nested values are shared by reference, which matches Ripple's shallow
reactivity.

<Code console>

```tsrx
import { RippleObject, effect, snapshot } from 'ripple';

export function App() @{
  const settings = new RippleObject({ theme: 'dark', fontSize: 14 });

  effect(() => {
    // Reads the current values without subscribing — this effect runs once.
    console.log(snapshot(settings));
  });

  <button onClick={() => settings.fontSize++}>{'Bigger'}</button>
}
```

</Code>

## Reactive Collection Primitives

Because Ripple isn't based on Signals, there is no mechanism with which we can
hijack collection mutations. Thus, you'll need to use the reactive collection
primitives that Ripple offers for reactivity for an entire collection.

#### Simple Reactive Array

Just like objects, you can use the `Tracked<T>` objects in any standard JavaScript
object, like arrays:

<Code console>

```tsrx
import { track, effect } from 'ripple';

export function App() @{
  const first = track(1);
  const second = track(2);
  const arr = [first, second];

  const total = track(() => arr.reduce((sum, item) => sum + item.value, 0));

  effect(() => {
    console.log(total.value);
  });

  <>
    <p>First :{first.value}, Second: {second.value}, Total: {total.value}</p>
    <button onClick={() => first.value++}>Increment First</button>
    <button onClick={() => second.value++}>Increment Second</button>
  </>
}
```

</Code>

As shown in the above example, you can compose normal arrays with reactivity and
pass them through props or boundaries.

However, if you need the entire array to be fully reactive, including when new
elements get added, you should use the reactive array that Ripple provides.

#### Fully Reactive Array

`RippleArray` class from Ripple extends the standard JS `Array` class, and
supports all of its methods and properties. Import it from `'ripple'`. All
elements existing or new of the `RippleArray` are reactive and respond to the
various array operations such as push, pop, shift, unshift, etc. Even if you
reference a non-existent element, once it is added, the original reference will
react to the change.

```tsrx
import { RippleArray } from 'ripple';

// using the constructor
const arr = new RippleArray(1, 2, 3);

// using static from method
const arr = RippleArray.from([1, 2, 3]);

// using static of method
const arr = RippleArray.of(1, 2, 3);
```

Usage Example:

```tsrx
import { RippleArray } from 'ripple';

export function App() @{
  const items = new RippleArray(1, 2, 3);

  <div>
    <p>Length: {items.length}</p> // Reactive length
    @for (const item of items) {
      <div>{item}</div>
    }
    <button onClick={() => items.push(items.length + 1)}>Add</button>
  </div>
}
```

#### Reactive Object

`RippleObject` class extends the standard JS `Object` class, and supports all of
its methods and properties. Import it from `'ripple'`. `RippleObject` fully
supports shallow reactivity and any property on the root level is reactive. You
can even reference non-existent properties and once added the original reference
reacts to the change.

```tsrx
import { RippleObject } from 'ripple';

const obj = new RippleObject({ a: 1, b: 2, c: 3 });
```

Usage Example:

<Code>

```tsrx
import { RippleObject } from 'ripple';

export function App() @{
  const obj = new RippleObject({ a: 0 });
  obj.a = 0;

  <>
    <pre>obj.a is: {obj.a}</pre>
    <pre>obj.b is: {obj.b}</pre>
    <button onClick={() => {
      obj.a++;
      obj.b = obj.b ?? 5;
      obj.b++;
    }}>Increment</button>
  </>
}
```

</Code>

#### Reactive Set

The `RippleSet` extends the standard JS `Set` class, and supports all of its
methods and properties.

```tsrx
import { RippleSet } from 'ripple';

const set = new RippleSet([1, 2, 3]);
```

RippleSet's reactive methods or properties can be used directly or assigned to
reactive variables.

<Code>

```tsrx
import { RippleSet, track } from 'ripple';

export function App() @{
  const set = new RippleSet([1, 2, 3]);
  const has = track(() => set.has(2));

  <>
    // direct usage
    <p>Direct usage: set contains 2: {set.has(2)}</p>

    // reactive assignment
    <p>Assigned usage: set contains 2: {has.value}</p>

    <button onClick={() => set.delete(2)}>Delete 2</button>
    <button onClick={() => set.add(2)}>Add 2</button>
  </>
}
```

</Code>

#### Reactive Map

The `RippleMap` extends the standard JS `Map` class, and supports all of its
methods and properties.

```tsrx
import { RippleMap } from 'ripple';

const map = new RippleMap([[1, 1], [2, 2], [3, 3], [4, 4]]);
```

RippleMap's reactive methods or properties can be used directly or assigned to
reactive variables.

<Code>

```tsrx
import { RippleMap, track } from 'ripple';

export function App() @{
  const map = new RippleMap([[1, 1], [2, 2], [3, 3], [4, 4]]);
  const has = track(() => map.has(2));

  <>
    // direct usage
    <p>Direct usage: map has an item with key 2: {map.has(2)}</p>

    // reactive assignment
    <p>Assigned usage: map has an item with key 2: {has.value}</p>

    <button onClick={() => map.delete(2)}>Delete item with key 2</button>
    <button onClick={() => map.set(2, 2)}>Add key 2 with value 2</button>
  </>
}
```

</Code>

#### Reactive Date

The `RippleDate` extends the standard JS `Date` class, and supports all of its
methods and properties.

```tsrx
import { RippleDate } from 'ripple';

const date = new RippleDate(2026, 0, 1); // January 1, 2026
```

RippleDate's reactive methods or properties can be used directly or assigned to
reactive variables. All getter methods (`getFullYear()`, `getMonth()`,
`getDate()`, etc.) and formatting methods (`toISOString()`, `toDateString()`,
etc.) are reactive and will update when the date is modified.

<Code>

```tsrx
import { RippleDate, track } from 'ripple';

export function App() @{
  const date = new RippleDate(2025, 0, 1, 12, 0, 0);
  const year = track(() => date.getFullYear());
  const month = track(() => date.getMonth());

  <>
    // direct usage
    <p>Direct usage: Current year is {date.getFullYear()}</p>
    <p>ISO String: {date.toISOString()}</p>

    // reactive assignment
    <p>Assigned usage: Year {year.value}, Month {month.value}</p>

    <button onClick={() => date.setFullYear(2026)}>Change to 2026</button>
    <button onClick={() => date.setMonth(11)}>Change to December</button>
  </>
}
```

</Code>

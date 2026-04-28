---
title: Reactivity in Ripple
---

# Reactivity

## Reactive Variables

You use `track` to create a single tracked value. The `track` function will create
a `Tracked<T>` object, and with `&[]` lazy destructuring you get a variable that
reads and writes to the tracked value directly. You can pass the `Tracked<T>`
object between components, functions and context to read and write to the value in
different parts of your codebase.

```ts
import { track } from 'ripple';

let &[name] = track('World');
let &[count] = track(0);

// Updates automatically trigger re-renders
count++;
```

Objects can also contain tracked values:

```ts
import { track } from 'ripple';

let &[current] = track(0);
let counter = { current };

// Updates automatically trigger re-renders
current++;
```

### Accessing Tracked Values with `.value`

As an alternative to lazy destructuring, you can read and write a tracked value
directly using the `.value` property on the `Tracked<V>` object:

```ts
import { track } from 'ripple';

const count = track(0);

// Read the current value
console.log(count.value); // 0

// Write a new value
count.value++;
console.log(count.value); // 1
```

Using `&[...]` lazy destructuring is preferred in most cases because it produces
cleaner, more readable code. However, `.value` is useful when you need to keep the
`Tracked<V>` object around — for example, when storing tracked values in data
structures, passing them as props typed as `Tracked<T>`, or when you need both the
tracked object and its value in different contexts:

```ts
import { track } from 'ripple';

// Storing tracked values in an array — use .value to read/write
const items = [track(1), track(2), track(3)];
items[0].value++;  // reactively updates

// Using &[value, trackedValue] gives you both:
let &[count, countTracked] = track(0);
count++;                    // convenient direct access via lazy destructuring
console.log(countTracked.value);  // equivalent: read via .value on the tracked object
```

::: info When to use `.value` Use `.value` when you need to work with the
`Tracked<V>` object directly, such as storing tracked values in arrays or objects,
or passing them to functions and components that expect `Tracked<T>`. Use `&[...]`
lazy destructuring for everyday reactive variables where you want clean, direct
access.
:::

Tracked derived values are also `Tracked<T>` objects, except that you pass a
function to `track` rather than a value:

```ts
import { track } from 'ripple';

let &[count] = track(0);
let &[double] = track(() => count * 2);
let &[quadruple] = track(() => double * 2);

console.log(quadruple);
```

Derived tracked values can also be written to for **optimistic state**. The
written value is exposed immediately, and when the next computation settles it
takes precedence and overrides it:

```ts
import { track } from 'ripple';

let &[count] = track(0);
let &[double] = track(() => count * 2);

// Write optimistically — shows 99 immediately
double = 99;

// When count next changes, double reverts to count * 2
```

If you want to use a tracked value inside a reactive context, such as an effect
but you don't want that value to be a tracked dependency, you can use `untrack`:

```ts
import { track, effect, untrack } from 'ripple';

let &[count] = track(0);
let &[double] = track(() => count * 2);
let &[quadruple] = track(() => double * 2);

effect(() => {
  // This effect will never fire again, as we've untracked the only dependency it has
  console.log(untrack(() => quadruple));
})
```

::: info Note You cannot create `Tracked` objects in module/global scope, they
have to be created on access from an active component context.
:::

### track with get / set

The optional get and set parameters of the `track` function let you customize how
a tracked value is read or written, similar to property accessors but expressed as
pure functions. The get function receives the current stored value and its return
value is exposed when the tracked value is read via `&[]` lazy destructuring. The
set function should return the value that will actually be stored and receives two
parameters: the first is the one being assigned and the second is the previous
value. The get and set functions may be useful for tasks such as logging,
validating, or transforming values before they are exposed or stored.

```ripple
import { track } from 'ripple';

export component App() {
  let &[count] = track(
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
}
```

::: info Note If no value is returned from either `get` or `set`, `undefined` is
either exposed (for get) or stored (for set). Also, if only supplying the `set`,
the `get` parameter must be set to `undefined`.
:::

#### Lazy Destructuring (`&{...}` / `&[...]`)

Lazy destructuring uses the `&` prefix directly before `{` or `[` in a
destructuring pattern. Instead of eagerly pulling values out of the source object,
lazy destructuring compiles each variable access to a deferred property/index
lookup on the source. This preserves reactivity for reactive props and other
tracked objects.

```ripple
// Lazy object destructuring — a and b are accessed lazily from props
const &{ a, b } = props;

// Lazy array destructuring
const &[first, second] = items;

// With default values
const &{ x = 10 } = props;

// With rest patterns
const &{ a, ...rest } = props;
```

**Component props** — use `&{...}` to lazily destructure props, preserving
reactivity:

```ripple
component Child(&{ count, className, children }: Props) {
  // count, className, children are lazily read from the props object
  <button class={className}>{children}</button>
  <pre>{`Count is: ${count}`}</pre>
}
```

**Function parameters** — works in regular functions too:

```ripple
function process(&{ x, y }: Point) {
  return x + y; // lazily reads from the parameter object
}
```

**Variable declarations** — works with `const`, `let`, and `var`:

```ripple
const &{ a, b } = someObject; // read-only lazy access
let &{ x, y } = mutableObject; // supports assignment: x = 5 writes back
```

::: tip When to use lazy destructuring Use `&{...}` whenever you destructure
reactive props or tracked objects and need the variables to remain reactive.
Regular destructuring (`{ a, b } = obj`) eagerly copies values and loses
reactivity.
:::

## Transporting Reactivity

Ripple doesn't constrain reactivity to components only. `Tracked<T>` objects can
simply be passed by reference between boundaries:

<Code console>

```ripple
import { track, effect } from 'ripple';

function createDouble(&[count]) {
  const double = track(() => count * 2);

  effect(() => {
    console.log('Count:', count);
  });

  return double;
}

export component App() {
  let &[count, countTracked] = track(0);

  const &[double] = createDouble(countTracked);

  <div>"Double: "{double}</div>
  <button
    onClick={() => {
      count++;
    }}
  >
    "Increment"
  </button>
}
```

</Code>

## Dynamic Components

Ripple has built-in support for dynamic components, a way to render different
components based on reactive state. Instead of hardcoding which component to show,
you can store a component in a `Tracked` via `track()`, and update it at runtime.
When the tracked value changes, Ripple automatically unmounts the previous
component and mounts the new one. Dynamic components are written with the
`<@Component />` tag, where `@` is a special marker that tells the compiler the
component or element is dynamic — it does not dereference or unwrap the value. The
expression after `@` is treated as a `Tracked` value, and the runtime handles
unwrapping it internally. This makes it straightforward to pass components as
props or swap them directly within a component, enabling flexible, state-driven
UIs with minimal boilerplate.

<Code>

```ripple
import { track } from 'ripple';

export component App() {
  let &[swapMe, swapMeTracked] = track(() => Child1);

  <Child swapMe={swapMeTracked} />

  <button onClick={() => (swapMe = swapMe === Child1 ? Child2 : Child1)}>
    "Swap Component"
  </button>
}

component Child(&{ swapMe }: { swapMe: Tracked<Component> }) {
  <@swapMe />
}

component Child1(props) {
  <pre>"I am child 1"</pre>
}

component Child2(props) {
  <pre>"I am child 2"</pre>
}
```

</Code>

## Effects

When dealing with reactive state, you might want to be able to create side-effects
based on changes that happen upon updates. To do this, you can use `effect`:

<Code console>

```ripple
import { track, effect } from 'ripple';

export component App() {
  let &[count] = track(0);

  effect(() => {
    console.log(count);
  });

  <button onClick={() => count++}>"Increment"</button>
}
```

</Code>

## After Update tick()

The `tick()` function returns a Promise that resolves after all pending reactive
updates have been applied to the DOM. This is useful when you need to ensure that
DOM changes are complete before executing subsequent code, similar to Vue's
`nextTick()` or Svelte's `tick()`.

<Code console>

```ripple
import { tick, track, effect } from 'ripple';

export component App() {
  let &[count] = track(0);

  effect(() => {
    count;

    if (count === 0) {
      console.log('initial run, skipping');
      return;
    }

    tick().then(() => {
      console.log('after the update');
    });
  });

  <button onClick={() => count++}>"Increment"</button>
}
```

</Code>

## Untracking Reactivity

<Code console>

```ripple
import { track, effect, untrack } from 'ripple';

export component App() {
  let &[count] = track(10);
  let &[double] = track(() => count * 2);
  let &[quadruple] = track(() => double * 2);

  effect(() => {
    // This effect will never fire again, as we've untracked the only dependency it has
    console.log(untrack(() => quadruple));
  });
}
```

</Code>

## Reactive Collection Primitives <Badge type="warning" text="Experimental" />

Because Ripple isn't based on Signals, there is no mechanism with which we can
hijack collection mutations. Thus, you'll need to use the reactive collection
primitives that Ripple offers for reactivity for an entire collection.

#### Simple Reactive Array

Just like objects, you can use the `Tracked<T>` objects in any standard JavaScript
object, like arrays:

<Code console>

```ripple
import { track, effect } from 'ripple';

export component App() {
  let &[first] = track(1);
  let &[second] = track(2);
  const arr = [first, second];

  const &[total] = track(() => arr.reduce((a, b) => a + b, 0));

  effect(() => {
    console.log(total);
  });
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

```ripple
import { RippleArray } from 'ripple';

// using the constructor
const arr = new RippleArray(1, 2, 3);

// using static from method
const arr = RippleArray.from([1, 2, 3]);

// using static of method
const arr = RippleArray.of(1, 2, 3);
```

Usage Example:

```ripple
import { RippleArray } from 'ripple';

export component App() {
  const items = new RippleArray(1, 2, 3);

  <div>
    <p>
      "Length: "
      {items.length}
    </p> // Reactive length
    for (const item of items) {
      <div>{item}</div>
    }
    <button onClick={() => items.push(items.length + 1)}>"Add"</button>
  </div>
}
```

#### Reactive Object

`RippleObject` class extends the standard JS `Object` class, and supports all of
its methods and properties. Import it from `'ripple'`. `RippleObject` fully
supports shallow reactivity and any property on the root level is reactive. You
can even reference non-existent properties and once added the original reference
reacts to the change.

```ripple
import { RippleObject } from 'ripple';

const obj = new RippleObject({ a: 1, b: 2, c: 3 });
```

Usage Example:

<Code>

```ripple
import { RippleObject } from 'ripple';

export component App() {
  const obj = new RippleObject({ a: 0 });

  obj.a = 0;

  <pre>
    "obj.a is: "
    {obj.a}
  </pre>
  <pre>
    "obj.b is: "
    {obj.b}
  </pre>
  <button
    onClick={() => {
      obj.a++;
      obj.b = obj.b ?? 5;
      obj.b++;
    }}
  >
    "Increment"
  </button>
}
```

</Code>

#### Reactive Set

The `RippleSet` extends the standard JS `Set` class, and supports all of its
methods and properties.

```ripple
import { RippleSet } from 'ripple';

const set = new RippleSet([1, 2, 3]);
```

RippleSet's reactive methods or properties can be used directly or assigned to
reactive variables.

<Code>

```ripple
import { RippleSet, track } from 'ripple';

export component App() {
  const set = new RippleSet([1, 2, 3]);

  // direct usage
  <p>
    "Direct usage: set contains 2: "
    {set.has(2)}
  </p>

  // reactive assignment
  let &[has] = track(() => set.has(2));
  <p>
    "Assigned usage: set contains 2: "
    {has}
  </p>

  <button onClick={() => set.delete(2)}>"Delete 2"</button>
  <button onClick={() => set.add(2)}>"Add 2"</button>
}
```

</Code>

#### Reactive Map

The `RippleMap` extends the standard JS `Map` class, and supports all of its
methods and properties.

```ripple
import { RippleMap } from 'ripple';

const map = new RippleMap([[1, 1], [2, 2], [3, 3], [4, 4]]);
```

RippleMap's reactive methods or properties can be used directly or assigned to
reactive variables.

<Code>

```ripple
import { RippleMap, track } from 'ripple';

export component App() {
  const map = new RippleMap([[1, 1], [2, 2], [3, 3], [4, 4]]);

  // direct usage
  <p>
    "Direct usage: map has an item with key 2: "
    {map.has(2)}
  </p>

  // reactive assignment
  let &[has] = track(() => map.has(2));
  <p>
    "Assigned usage: map has an item with key 2: "
    {has}
  </p>

  <button onClick={() => map.delete(2)}>"Delete item with key 2"</button>
  <button onClick={() => map.set(2, 2)}>"Add key 2 with value 2"</button>
}
```

</Code>

#### Reactive Date

The `RippleDate` extends the standard JS `Date` class, and supports all of its
methods and properties.

```ripple
import { RippleDate } from 'ripple';

const date = new RippleDate(2026, 0, 1); // January 1, 2026
```

RippleDate's reactive methods or properties can be used directly or assigned to
reactive variables. All getter methods (`getFullYear()`, `getMonth()`,
`getDate()`, etc.) and formatting methods (`toISOString()`, `toDateString()`,
etc.) are reactive and will update when the date is modified.

<Code>

```ripple
import { RippleDate, track } from 'ripple';

export component App() {
  const date = new RippleDate(2025, 0, 1, 12, 0, 0);

  // direct usage
  <p>
    "Direct usage: Current year is "
    {date.getFullYear()}
  </p>
  <p>
    "ISO String: "
    {date.toISOString()}
  </p>

  // reactive assignment
  let &[year] = track(() => date.getFullYear());
  let &[month] = track(() => date.getMonth());
  <p>
    "Assigned usage: Year "
    {year}
    ", Month "
    {month}
  </p>

  <button onClick={() => date.setFullYear(2026)}>"Change to 2026"</button>
  <button onClick={() => date.setMonth(11)}>"Change to December"</button>
}
```

</Code>

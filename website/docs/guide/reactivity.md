---
title: Reactivity in Ripple
---

# Reactivity

## Reactive Variables

You use `track` to create a single tracked value. The `track` function will
create a `Tracked<T>` object that is not accessible from the outside, and
instead you must use `@` to read or write to the tracked value. You can pass the
`Tracked<T>` object between components, functions and context to read and write
to the value in different parts of your codebase.

```ts

let name = #ripple.track('World');
let count = #ripple.track(0);

// Updates automatically trigger re-renders
@count++;
```

Objects can also contain tracked values with `@` to access the reactive object
property:

```ts

let counter = { current: #ripple.track(0) };

// Updates automatically trigger re-renders
counter.@current++;
```

Tracked derived values are also `Tracked<T>` objects, except that you pass a function
to `track` rather than a value:

```ts
let count = #ripple.track(0);
let double = #ripple.track(() => @count * 2);
let quadruple = #ripple.track(() => @double * 2);

console.log(@quadruple);
```

Derived tracked values can also be written to for **optimistic state**. The
written value is exposed immediately, and when the next computation settles it
takes precedence and overrides it:

```ts
let count = #ripple.track(0);
let double = #ripple.track(() => @count * 2);

// Write optimistically — shows 99 immediately
@double = 99;

// When @count next changes, double reverts to @count * 2
```

If you want to use a tracked value inside a reactive context, such as an effect
but you don't want that value to be a tracked dependency, you can use `untrack`:

```ts
let count = #ripple.track(0);
let double = #ripple.track(() => @count * 2);
let quadruple = #ripple.track(() => @double * 2);

effect(() => {
  // This effect will never fire again, as we've untracked the only dependency it has
  console.log(untrack(() => @quadruple));
})
```

::: info Note
You cannot create `Tracked` objects in module/global scope, they have to be
created on access from an active component context.
:::

## The #ripple.\* Namespace

Ripple provides a built-in `#ripple.*` namespace that gives access to all
reactive primitives **without any imports**. Every `#ripple.*` keyword is
resolved at compile time.

```ripple
// With import
let count = #ripple.track(0);

// With #ripple.* — no import needed
let count = #ripple.track(0);
```

The `#ripple.*` namespace supports all the same APIs:

```ripple
component App() {
  // Reactive state
  let count = #ripple.track(0);
  let double = #ripple.track(() => @count * 2);

  // Reactive collections — no imports
  const items = #ripple[1, 2, 3];           // RippleArray literal
  const config = #ripple{ theme: 'dark' };  // RippleObject literal
  const map = #ripple.map([['a', 1]]); // RippleMap
  const set = #ripple.set([1, 2, 3]);  // RippleSet

  // Async derived
  let data = #ripple.track(async () => fetchData(@count));

  // Context
  const ctx = #ripple.context('default');

  // Reactive platform types
  const today = #ripple.date();
  const url = #ripple.url('https://example.com');
  const mq = #ripple.mediaQuery('(max-width: 768px)');

  <div style={{ color: config.theme === 'dark' ? 'white' : 'black' }}>
    for (const item of items) {
      <p>{item}</p>
    }
  </div>
}
```

### Prop Splitting

`#ripple.trackSplit` destructures props while preserving reactivity — the
import-free equivalent of `trackSplit`:

```ripple
component Button(props) {
  const [children, rest] = #ripple.trackSplit(props, ['children']);
  <button {...rest}>{children}</button>
}
```

### #ripple.\* vs imports — when to use which

| Situation                         | Recommendation                                                   |
| --------------------------------- | ---------------------------------------------------------------- |
| Inside `.ripple` files            | Prefer `#ripple.*` — zero imports, discoverable via autocomplete |
| Shared utilities in `.ts` files   | Use explicit imports from `'ripple'`                             |
| Teaching / documentation examples | Show both forms for clarity                                      |

### track with get / set

The optional get and set parameters of the `track` function let you customize
how a tracked value is read or written, similar to property accessors but
expressed as pure functions. The get function receives the current stored value
and its return value is exposed when the tracked value is accessed / unboxed
with `@`. The set function should return the value that will actually be stored
and receives two parameters: the first is the one being assigned and the second
is the previous value. The get and set functions may be useful for tasks such
as logging, validating, or transforming values before they are exposed or stored.

```ripple

export component App() {
  let count = #ripple.track(0,
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
    }
  );
}
```

::: info Note
If no value is returned from either `get` or `set`, `undefined` is either
exposed (for get) or stored (for set). Also, if only supplying the `set`, the
`get` parameter must be set to `undefined`.
:::

#### trackSplit Function

The `trackSplit` "splits" a plain object — such as component props — into
specified tracked variables and an extra `rest` property containing the
remaining unspecified object properties.

```ripple
const [children, count, rest] = #ripple.trackSplit(props, ['children', 'count']);
```

When working with component props, destructuring is often useful — both for
direct use as variables and for collecting remaining properties into a `rest`
object (which can be named arbitrarily). If destructuring happens in the
component argument, e.g. `component Child({ children, value, ...rest })`, Ripple
automatically links variable access to the original props — for example, `value`
is compiled to `props.value`, preserving reactivity.

However, destructuring inside the component body, e.g.
`const { children, value, ...rest } = props`, for read-only reactive props, does
not preserve reactivity (too complicated to implement due to many edge cases).
To ensure destructured read-only reactive props remain reactive in this case,
use the `trackSplit` function.

::: info Note
boxed / wrapped `Tracked` objects are always reactive since they cross function boundaries by reference. Props that were not declared with `#ripple.track()` are never reactive and always render the same value that was initially passed in.
:::

A full example utilizing various Ripple constructs demonstrates the `split`
option usage:

<Code console>

```ripple
import type { PropsWithChildren, Tracked } from 'ripple';

component Child(props: PropsWithChildren<{ count: Tracked<number>, className: string }>) {
  // children, count are always reactive
  // but className is passed in as a read-only reactive value
  const [children, count, className, rest] = #ripple.trackSplit(props, ['children', 'count', 'class']);

  <button class={@className} {...@rest}><@children /></button>
  <pre>{`Count is: ${@count}`}</pre>
  <button onClick={() => @count++}>{'Increment Count'}</button>
}

export component App() {
    let count = #ripple.track(0,
    (current) => {
      console.log('getter', current);
      return current;
    },
    (next) => {
      console.log('setter', next);
      return next;
    }
  );
  let className = #ripple.track('shadow');
  let name = #ripple.track('Click Me');

  function buttonRef(el) {
    console.log('ref called with', el);
    return () => {
      console.log('cleanup ref for', el);
    };
  }

  <Child
    class={@className}
    onClick={() => { @name === 'Click Me' ? @name = 'Clicked' : @name = 'Click Me'; @className = ''}}
    {count}
    {ref buttonRef}
  >{@name}</Child>;
}
```

</Code>

With the regular destructuring, such as the one below, the `class`
property would lose its reactivity:

```ripple
// ❌ WRONG class / className reactivity would be lost
let { children, count, class: className, ...rest } = props;
```

::: info Note
Make sure the resulting `rest`, if it's going to be spread onto a dom element,
does not contain `Tracked` values. Otherwise, you'd be spreading not the actual
values but the boxed ones, which are objects that will appear as
`[Object object]` on the dom element.
:::

## Transporting Reactivity

Ripple doesn't constrain reactivity to components only. `Tracked<T>` objects can
simply be passed by reference between boundaries:

<Code console>

```ripple
import { effect } from 'ripple';

function createDouble(count) {
  const double = #ripple.track(() => @count * 2);

  effect(() => {
    console.log('Count:', @count)
  });

  return double;
}

export component App() {
  let count = #ripple.track(0);

  const double = createDouble(count);

  <div>{'Double: ' + @double}</div>
  <button onClick={() => { @count++; }}>{'Increment'}</button>
}
```

</Code>

## Dynamic Components

Ripple has built-in support for dynamic components, a way to render different
components based on reactive state. Instead of hardcoding which component to
show, you can store a component in a `Tracked` via `#ripple.track()`, and update it at
runtime. When the tracked value changes, Ripple automatically unmounts the
previous component and mounts the new one. Dynamic components are written with
the `<@Component />` tag, where the @ both unwraps the tracked reference and
tells the compiler that the component is dynamic. This makes it straightforward
to pass components as props or swap them directly within a component, enabling
flexible, state-driven UIs with minimal boilerplate.

<Code>

```ripple

export component App() {
  let swapMe = #ripple.track(() => Child1);

  <Child {swapMe} />

  <button onClick={() => @swapMe = @swapMe === Child1 ? Child2 : Child1}>
		{'Swap Component'}
	</button>
}

component Child({ swapMe }: {swapMe: Tracked<Component>}) {
  <@swapMe />
}

component Child1(props) {
  <pre>{'I am child 1'}</pre>
}

component Child2(props) {
  <pre>{'I am child 2'}</pre>
}
```

</Code>

## Effects

When dealing with reactive state, you might want to be able to create
side-effects based on changes that happen upon updates. To do this, you can
use `effect`:

<Code console>

```ripple
import { effect } from 'ripple';

export component App() {
  let count = #ripple.track(0);

  effect(() => {
    console.log(@count);
  });

  <button onClick={() => @count++}>{'Increment'}</button>
}
```

</Code>

## After Update tick()

The `tick()` function returns a Promise that resolves after all pending reactive updates have been applied to the DOM. This is useful when you need to ensure that DOM changes are complete before executing subsequent code, similar to Vue's `nextTick()` or Svelte's `tick()`.

<Code console>

```ripple
import { effect, tick } from 'ripple';

export component App() {
  let count = #ripple.track(0);

  effect(() => {
    @count;

    if (@count === 0) {
      console.log('initial run, skipping');
      return;
    }

    tick().then(() => {
      console.log('after the update');
    });
  });

  <button onClick={() => @count++}>{'Increment'}</button>
}
```

</Code>

## Untracking Reactivity

<Code console>

```ripple
import { effect, untrack } from 'ripple';

export component App() {
  let count = #ripple.track(10);
  let double = #ripple.track(() => @count * 2);
  let quadruple = #ripple.track(() => @double * 2);

  effect(() => {
    // This effect will never fire again, as we've untracked the only dependency it has
    console.log(untrack(() => @quadruple));
  })
}
```

</Code>

## Reactive Collection Primitives <Badge type="warning" text="Experimental" />

Because Ripple isn't based on Signals, there is no mechanism with which we can
hijack collection mutations. Thus, you'll need to use the reactive collection
primitives that Ripple offers for reactivity for an entire collection.

#### Simple Reactive Array

Just like objects, you can use the `Tracked<T>` objects in any standard
JavaScript object, like arrays:

<Code console>

```ripple
import { effect } from 'ripple';

export component App() {
	let first = #ripple.track(1);
	let second = #ripple.track(2);
	const arr = [first, second];

	const total = #ripple.track(() => arr.reduce((a, b) => a + @b, 0));

	effect(() => {
		console.log(@total);
	})
}
```

</Code>

As shown in the above example, you can compose normal arrays with reactivity
and pass them through props or boundaries.

However, if you need the entire array to be fully reactive, including when new
elements get added, you should use the reactive array that Ripple provides.

#### Fully Reactive Array

`RippleArray` class from Ripple extends the standard JS `Array` class, and
supports all of its methods and properties. Import it from the `'ripple'`
namespace or use the provided syntactic sugar for a quick creation via the
bracketed notation. All elements existing or new of the `RippleArray` are
reactive and respond to the various array operations such as push, pop, shift,
unshift, etc. Even if you reference a non-existent element, once it is added, the
original reference will react to the change. You do NOT need to use the unboxing
`@` with the elements of the array.

```ripple

// using syntactic sugar `#`
const arr = #ripple[1, 2, 3];

// using the new constructor
const arr = #ripple.array(1, 2, 3);

// using static from method
const arr = #ripple.array.from([1, 2, 3]);

// using static method
const arr = #ripple.array.of(1, 2, 3);
```

Usage Example:

```ripple
export component App() {
  const items = #ripple[1, 2, 3];

  <div>
    <p>{"Length: "}{items.length}</p>  // Reactive length
    for (const item of items) {
      <div>{item}</div>
    }
    <button onClick={() => items.push(items.length + 1)}>{"Add"}</button>
  </div>
}
```

#### Reactive Object

`RippleObject` class extends the standard JS `Object` class, and supports all
of its methods and properties. Import it from the `'ripple'` namespace or use
the provided syntactic sugar for a quick creation via the curly brace notation.
`RippleObject` fully supports shallow reactivity and any property on the root
level is reactive. You can even reference non-existent properties and once added
the original reference reacts to the change. You do NOT need to use the unboxing
`@` with the properties of the `RippleObject`.

```ripple

// using syntactic sugar `#`
const obj = #ripple{a: 1, b: 2, c: 3};

// using the new constructor
const obj = #ripple.object({a: 1, b: 2, c: 3});
```

Usage Example:

<Code>

```ripple
export component App() {
  const obj = #ripple{a: 0}

  obj.a = 0;

  <pre>{'obj.a is: '}{obj.a}</pre>
  <pre>{'obj.b is: '}{obj.b}</pre>
  <button onClick={() => { obj.a++; obj.b = obj.b ?? 5; obj.b++; }}>{'Increment'}</button>
}
```

</Code>

#### Reactive Set

The `RippleSet` extends the standard JS `Set` class, and supports all of its
methods and properties.

```ripple

const set = #ripple.set([1, 2, 3]);
```

RippleSet's reactive methods or properties can be used directly or assigned to
reactive variables.

<Code>

```ripple

export component App() {
  const set = #ripple.set([1, 2, 3]);

  // direct usage
  <p>{"Direct usage: set contains 2: "}{set.has(2)}</p>

  // reactive assignment
  let has = #ripple.track(() => set.has(2));
  <p>{"Assigned usage: set contains 2: "}{@has}</p>

  <button onClick={() => set.delete(2)}>{"Delete 2"}</button>
  <button onClick={() => set.add(2)}>{"Add 2"}</button>
}
```

</Code>

#### Reactive Map

The `RippleMap` extends the standard JS `Map` class, and supports all of its
methods and properties.

```ripple

const map = #ripple.map([[1,1], [2,2], [3,3], [4,4]]);
```

RippleMap's reactive methods or properties can be used directly or assigned to
reactive variables.

<Code>

```ripple

export component App() {
  const map = #ripple.map([[1,1], [2,2], [3,3], [4,4]]);

  // direct usage
  <p>{"Direct usage: map has an item with key 2: "}{map.has(2)}</p>

  // reactive assignment
  let has = #ripple.track(() => map.has(2));
  <p>{"Assigned usage: map has an item with key 2: "}{@has}</p>

  <button onClick={() => map.delete(2)}>{"Delete item with key 2"}</button>
  <button onClick={() => map.set(2, 2)}>{"Add key 2 with value 2"}</button>
}
```

</Code>

#### Reactive Date

The `RippleDate` extends the standard JS `Date` class, and supports all of its
methods and properties.

```ripple

const date = #ripple.date(2026, 0, 1); // January 1, 2026
```

RippleDate's reactive methods or properties can be used directly or assigned to
reactive variables. All getter methods (`getFullYear()`, `getMonth()`,
`getDate()`, etc.) and formatting methods (`toISOString()`, `toDateString()`,
etc.) are reactive and will update when the date is modified.

<Code>

```ripple

export component App() {
  const date = #ripple.date(2025, 0, 1, 12, 0, 0);

  // direct usage
  <p>{"Direct usage: Current year is "}{date.getFullYear()}</p>
  <p>{"ISO String: "}{date.toISOString()}</p>

  // reactive assignment
  let year = #ripple.track(() => date.getFullYear());
  let month = #ripple.track(() => date.getMonth());
  <p>{"Assigned usage: Year "}{@year}{", Month "}{@month}</p>

  <button onClick={() => date.setFullYear(2026)}>{"Change to 2026"}</button>
  <button onClick={() => date.setMonth(11)}>{"Change to December"}</button>
}
```

</Code>

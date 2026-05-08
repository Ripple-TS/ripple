---
title: Referencing DOM Elements in Ripple
---

# DOM Refs

Refs let you capture the DOM node behind an element. Ripple supports three ref
forms:

| Syntax                 | Use it for                                                       |
| ---------------------- | ---------------------------------------------------------------- |
| `{ref value}`          | A direct TSRX keyword ref on the current element or component.   |
| `ref={value}`          | A native-like ref attribute on the current element or component. |
| `inputRef={ref value}` | A named ref prop that can be forwarded through components.       |

The direct `{ref expr}` and `ref={expr}` forms attach a ref to the current
template. Named refs, such as `inputRef={ref expr}`, are regular string-keyed
props that carry ref behavior with them. On DOM elements, Ripple applies named ref
props as refs instead of emitting them as attributes.

Ref values can be callbacks, `Tracked` values from `track()`, or mutable
identifiers/member expressions. Mutable refs are assigned when the element mounts
and cleared when it unmounts.

<Code console>

```ripple
import { track } from 'ripple';

export default component App() {
  let div: HTMLDivElement | undefined;
  const input = track<HTMLInputElement | null>(null);
  const state: { button?: HTMLButtonElement } = {};

  <div {ref div}>"Hello world"</div>
  <input ref={input} type="text" />
  <button {ref state.button}>"Save"</button>
}
```

</Code>

## Callback Refs

Callback refs receive the DOM node when the element mounts. Return a cleanup
function to run when the element is removed.

<Code console>

```ripple
export component App() {
  function setup(node: HTMLDivElement) {
    console.log('mounted', node);

    return () => {
      console.log('unmounted', node);
    };
  }

  <div {ref setup}>"Hello world"</div>
}
```

</Code>

You can also create callback refs inline.

<Code console>

```ripple
export component App() {
  let div: HTMLDivElement | undefined;

  <div
    {ref (node) => {
      div = node;
      console.log('mounted', node);
      return () => {
        div = undefined;
      };
    }}
  >
    "Hello world"
  </div>
}
```

</Code>

Function factories work well when a library returns the ref callback for you, or
when the ref setup needs configuration.

```ripple
import { fadeIn } from 'some-library';

export component App({ ms }) {
  <div {ref fadeIn({ ms })}>"Hello world"</div>
}
```

## Native-Like `ref={...}`

Use `ref={value}` when you want the ref to look like the host runtime's native
ref attribute. In Ripple it accepts the same values as `{ref value}`.

```ripple
export component App() {
  let input: HTMLInputElement | undefined;
  const state: { wrapper?: HTMLDivElement } = {};

  <div ref={state.wrapper}>
    <input ref={input} type="text" />
  </div>
}
```

You can combine one `ref={...}` with any number of `{ref ...}` or named
`anyName={ref ...}` props on the same DOM element. Ripple applies all of them.

```ripple
import { track } from 'ripple';

export component App() {
  let input: HTMLInputElement | undefined;
  const trackedInput = track<HTMLInputElement | null>(null);

  <input
    ref={input}
    {ref trackedInput}
    logRef={ref (node) => console.log(node)}
    type="text"
  />
}
```

## Named Ref Props

Named ref props are the preferred form for reusable component APIs because the
component can decide where the ref lands. They can be forwarded explicitly or
through a spread.

<Code console>

```ripple
export component Field({ inputRef, ...rest }) {
  <label>
    "Search"
    <input type="search" ref={inputRef} {...rest} />
  </label>
}

export component App() {
  let input: HTMLInputElement | undefined;

  <Field inputRef={ref input} placeholder="Search docs" />
}
```

</Code>

Named ref props also work directly on DOM elements. Ripple recognizes the ref
value and does not emit the prop name as an attribute.

```ripple
export component App() {
  let input: HTMLInputElement | undefined;

  <input inputRef={ref input} type="text" />
}
```

Anonymous `{ref ...}` props are forwarded with a unique symbol key. That makes
them easy to spread through a component, but impossible to inspect by a public
prop name. Use a named ref prop when a component API should expose a specific ref
slot.

```ripple
component Input({ id, ...rest }) {
  <input {id} {...rest} />
}

export component App() {
  let input: HTMLInputElement | undefined;

  <Input id="email" {ref input} />
}
```

## Inspecting Ref Props

Named ref props are marked at runtime. Use `isRefProp(value)` when a component
needs to distinguish a named ref prop from an ordinary prop.

```ripple
import { isRefProp } from 'ripple';

component Field({ inputRef, ...rest }) {
  if (isRefProp(inputRef)) {
    console.log('received a ref prop');
  }

  <input ref={inputRef} {...rest} />
}
```

Anonymous `{ref ...}` props are intentionally not publicly inspectable because
their keys are unique symbols.

## createRefKey

Creates a unique object key that will be recognised as a ref when the object is
spread onto an element. This allows programmatic assignment of refs without
relying directly on template syntax.

<Code console>

```ripple
import { createRefKey, track } from 'ripple';

export component App() {
  let &[value] = track('');
  let input: HTMLInputElement | undefined;

  const props = {
    id: 'example',
    value,
    [createRefKey()]: (node: HTMLInputElement) => {
      input = node;

      const onInput = () => {
        value = node.value;
        console.log(value);
      };

      node.addEventListener('input', onInput);

      return () => {
        input = undefined;
        node.removeEventListener('input', onInput);
      };
    },
  };

  // applied to an element
  <input type="text" {...props} />

  // with composite component
  <Input {...props} />
}

component Input({ id, value, ...rest }) {
  <input type="text" {id} {value} {...rest} />
}
```

</Code>

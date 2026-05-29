---
title: Referencing DOM Elements in Ripple
---

# DOM Refs

Refs let you capture the DOM node behind an element. Ripple uses the normal JSX
attribute shape:

| Syntax         | Use it for                                    |
| -------------- | --------------------------------------------- |
| `ref={value}`  | One ref for the current element or component. |
| `ref={[a, b]}` | Multiple refs for the same element.           |

Ref values can be callbacks, `Tracked` values from `track()`, or mutable
identifiers/member expressions. Mutable refs are assigned when the element mounts
and cleared when it unmounts.

<Code console>

```ripple
import { track } from 'ripple';

export default function App() {
  return <>
  let div: HTMLDivElement | undefined;
  const input = track<HTMLInputElement | null>(null);
  const state: { button?: HTMLButtonElement } = {};

  <div ref={div}>"Hello world"</div>
  <input ref={input} type="text" />
  <button ref={state.button}>"Save"</button>

  </>;
}
```

</Code>

## Callback Refs

Callback refs receive the DOM node when the element mounts. Return a cleanup
function to run when the element is removed.

<Code console>

```ripple
export function App() {
  return <>
  function setup(node: HTMLDivElement) {
    console.log('mounted', node);

    return () => {
      console.log('unmounted', node);
    };
  }

  <div ref={setup}>"Hello world"</div>

  </>;
}
```

</Code>

You can also create callback refs inline.

<Code console>

```ripple
export function App() {
  return <>
  let div: HTMLDivElement | undefined;

  <div
    ref={(node) => {
      div = node;
      console.log('mounted', node);
      return () => {
        div = undefined;
      };
    }}
  >
    "Hello world"
  </div>

  </>;
}
```

</Code>

Function factories work well when a library returns the ref callback for you, or
when the ref setup needs configuration.

```ripple
import { fadeIn } from 'some-library';

export function App({ ms }) {
  return <>
  <div ref={fadeIn({ ms })}>"Hello world"</div>

  </>;
}
```

## Multiple Refs

Use an array when one DOM element needs more than one ref.

```ripple
import { track } from 'ripple';

export function App() {
  return <>
  let input: HTMLInputElement | undefined;
  const trackedInput = track<HTMLInputElement | null>(null);

  <input
    ref={[input, trackedInput, (node) => console.log(node)]}
    type="text"
  />

  </>;
}
```

## Component Forwarding

Components receive `ref={...}` as a prop. Forward it explicitly or include it in
a spread onto the host element that should be exposed.

<Code console>

```ripple
function Input({ id, ...rest }) {
  return <>
  <input {id} {...rest} />

  </>;
}

export function App() {
  return <>
  let input: HTMLInputElement | undefined;

  <Input id="email" ref={input} />

  </>;
}
```

</Code>

Named props such as `inputRef` are ordinary component API props. Pass them into
`ref={...}` inside the receiving component when you want to forward them.

<Code console>

```ripple
export function Field({ inputRef, ...rest }) {
  return <>
  <label>
    "Search"
    <input type="search" ref={inputRef} {...rest} />
  </label>

  </>;
}

export function App() {
  return <>
  let input: HTMLInputElement | undefined;

  <Field inputRef={input} placeholder="Search docs" />

  </>;
}
```

</Code>

## createRefKey

`createRefKey()` creates a unique object key that Ripple recognizes as a ref
when the object is spread onto an element. This is useful when refs need to be
assembled programmatically.

<Code console>

```ripple
import { createRefKey, track } from 'ripple';

export function App() {
  return <>
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

  <input type="text" {...props} />
  <Input {...props} />

  </>;
}

function Input({ id, value, ...rest }) {
  return <>
  <input type="text" {id} {value} {...rest} />

  </>;
}
```

</Code>

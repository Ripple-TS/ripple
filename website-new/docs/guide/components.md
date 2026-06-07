---
title: Components in Ripple
---

# Components

## Detection

Direct calls keep ordinary helper semantics. A PascalCase helper such as
`StatusCode()` or `FormatName()` is left as a normal function when called
directly; component compilation applies to functions used as components or render
entries, and to functions that return native TSRX without being directly called.

## Lifecycle

::: details Glossary

- **Pure**: The idea that a function should produce no side-effects.
- **Side-effect**: A permanent, externally observable state change.

:::

Ripple's component lifecycle is akin to Vue/Svelte/Solid. The root scope of your
component only runs once, akin to the "setup" scope in Vue/Svelte/Solid. However,
all child scopes such as statement containers, and blocks like `@if` and `@for`,
may rerun if they contain reactive variables within them. Therefore, it is
advisable to only write pure code within your components, and place side-effects
within `effect()` to ensure they only run when intended.

## Children

To pass elements to be nested within a component, simply nest them as you would
write HTML. By default, Ripple will make the content available as the `children`
prop, which you can then render using `{props.children}` (or simply `{children}`
if you destructured your props).

```tsrx
import type { Children } from 'ripple';

function Card(props: { children: Children }) {
  return <div class="card">{props.children}</div>
}

export function App() @{
  function children() {
    return <p>Card content here</p>
  }

  <>
    // Use implicitly...
    <Card>
      <p>Card content here</p>
    </Card>

    // or pass children explicitly as a prop.
    <Card {children} />
  </>
}
```

## Passing Components as Props

Components can only be passed to other components as **explicit props**. You can
declare a component at any lexical scope — including inside a composite component
element — but you must pass it as a prop to the component that needs it.

::: warning Scoping Rule Components follow normal lexical scoping. A parent
component **cannot** see components declared inside a child's scope. Components
declared inside a composite component element are only visible to the children of
that element, not to the element's component itself.
:::

### Basic Example

Define components in scope and pass them as explicit props:

<Code>

```tsrx
import type { Component } from 'ripple';

function Composite({ PropComp }: { PropComp: Component }) {
  return <PropComp />
}

function Separate() {
  return <p>I'm a separate component.</p>
}

export function App() {
  return <Composite PropComp={Separate} />
}
```

</Code>

## Example: Card Component Using Child Composition

This pattern is commonly achieved with "slots" from Vue/Web Components, "render
props" from React, and "snippets" from Svelte.

<Code>

```tsrx
import type { Children, Component } from 'ripple';

function Card({
  children,
  Header,
  Footer,
}: {
  children: Children;
  Header?: Component;
  Footer?: Component;
}) {
  return <fieldset>
    @if (Header) {
      <>
        <Header />
        <hr />
      </>
    }
    {children}
    @if (Footer) {
      <>
        <hr />
        <Footer />
      </>
    }
  </fieldset>;
}

function CustomHeader() {
  return <h1>Card Title</h1>
}

function CustomFooter() {
  return <>
    <button>Cancel</button>
    <button>OK</button>
  </>;
}

export function App() {
  return <Card Header={CustomHeader} Footer={CustomFooter}>
    <p>Card content here</p>
  </Card>;
}
```

</Code>

## Component Scoping and Nesting

Components can be declared at any lexical scope, including inside composite
component elements. However, they are only visible within that scope — a parent
component cannot access components declared inside a child's scope.

### ✅ Correct: Declaring Components Inside Composite Elements for Children

Components declared inside a composite component element can be passed as props to
**nested** component calls within that scope:

<Code>

```tsrx
import type { Component } from 'ripple';

function Inner({ Greeting }: { Greeting: Component }) {
  return <div class="inner"><Greeting /></div>
}

function Outer({ children }: { children: Children }) {
  return <div class="outer">{children}</div>
}

export function App() @{
  <Outer>@{
    function HelloGreeting() {
      return <p>Hello from inside!</p>
    }

    // It can be passed as a prop to <Inner>, which is also in this scope
    <Inner Greeting={HelloGreeting} />
  }</Outer>
}
```

</Code>

### ❌ Wrong: Trying to Pass a Child-Scoped Component to a Parent

A component declared inside a composite element's children is **not visible** to
the parent component itself — it only exists in the child scope:

```tsrx
import type { Component } from 'ripple';

function Outer({ Footer }: { Footer: Component }) {
  // Outer expects Footer as a prop
  return <div class="outer"><Footer /></div>
}

export function App() @{
  // ❌ WRONG — Footer is declared inside Outer's children,
  // but Outer cannot see it. Footer is not in scope for the
  // <Outer> component call.
  <Outer {Footer}>@{
    function Footer() {
      return <button>OK</button>
    }

    <p>Child content</p>
  }</Outer>
}
```

## Reactive Props

See [Reactivity](/docs/guide/reactivity#Props-and-Attributes).

## Prop Shorthands

```tsrx
// Object spread
<div {...properties}>Content</div>

// Shorthand props (when variable name matches prop name)
<div {onClick} {id}>Content</div>

// Equivalent to:
<div onClick={onClick} id={id}>Content</div>
```

## Portal Component

The `Portal` component allows you to render (teleport) content anywhere in the DOM
tree, breaking out of the normal component hierarchy. This is particularly useful
for modals, tooltips, and notifications.

```tsrx
import { Portal } from 'ripple';

export function App() {
  return <div class="app">
    <h1>My App</h1>
    {/* This will render inside document.body, not inside the .app div */}
    <Portal target={document.body}>
      <div class="modal">
        <h2>I am rendered in document.body!</h2>
        <p>This content escapes the normal component tree.</p>
      </div>
    </Portal>
  </div>;
}
```

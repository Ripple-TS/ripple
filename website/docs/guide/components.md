---
title: Components in Ripple
---

# Components

## Lifecycle

::: details Glossary

- **Pure**: The idea that a function should produce no side-effects.
- **Side-effect**: A permanent, externally observable state change.

:::

Ripple's component lifecycle is akin to Vue/Svelte/Solid. The root scope of your
component only runs once, akin to the "setup" scope in Vue/Svelte/Solid. However,
all child scopes such as nested template scopes, and blocks like `if` and `for`,
may rerun if they contain reactive variables within them. Therefore, it is
advisable to only write pure code within your components, and place side-effects
within `effect()` to ensure they only run when intended.

## Children

To pass elements to be nested within a component, simply nest them as you would
write HTML. By default, Ripple will make the content available as the `children`
prop, which you can then render using `{props.children}` (or simply `{children}`
if you destructured your props).

```ripple
import type { Children } from 'ripple';

component Card(props: { children: Children }) {
  <div class="card">
    {props.children}
  </div>
}

export component App() {
  // Use implicitly...
  <Card>
    <p>"Card content here"</p>
  </Card>

  // or pass children explicitly as a prop.
  component children() {
    <p>"Card content here"</p>
  }

  <Card {children} />
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

```ripple
import type { Component } from 'ripple';

component Composite({ PropComp }: { PropComp: Component }) {
  <PropComp />
}

component Separate() {
  <p>{`I'm a separate component.`}</p>
}

export component App() {
  <Composite PropComp={Separate} />
}
```

</Code>

## Example: Card Component Using Child Composition

This pattern is commonly achieved with "slots" from Vue/Web Components, "render
props" from React, and "snippets" from Svelte.

<Code>

```ripple
import type { Children, Component } from 'ripple';

component Card({
  children,
  Header,
  Footer,
}: {
  children: Children;
  Header?: Component;
  Footer?: Component;
}) {
  <fieldset>
    if (Header) {
      <Header />
      <hr />
    }
    {children}
    if (Footer) {
      <hr />
      <Footer />
    }
  </fieldset>
}

component CustomHeader() {
  <h1>"Card Title"</h1>
}

component CustomFooter() {
  <button>"Cancel"</button>
  <button>"OK"</button>
}

export component App() {
  <Card Header={CustomHeader} Footer={CustomFooter}>
    <p>"Card content here"</p>
  </Card>
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

```ripple
import type { Component } from 'ripple';

component Inner({ Greeting }: { Greeting: Component }) {
  <div class="inner">
    <Greeting />
  </div>
}

component Outer({ children }: { children: Children }) {
  <div class="outer">
    {children}
  </div>
}

export component App() {
  <Outer>
    component HelloGreeting() {
      <p>{'Hello from inside!'}</p>
    }

    // It can be passed as a prop to <Inner>, which is also in this scope
    <Inner Greeting={HelloGreeting} />
  </Outer>
}
```

</Code>

### ❌ Wrong: Trying to Pass a Child-Scoped Component to a Parent

A component declared inside a composite element's children is **not visible** to
the parent component itself — it only exists in the child scope:

```ripple
import type { Component } from 'ripple';

component Outer({ Footer }: { Footer: Component }) {
  // Outer expects Footer as a prop
  <div class="outer">
    <Footer />
  </div>
}

export component App() {
  // ❌ WRONG — Footer is declared inside Outer's children,
  // but Outer cannot see it. Footer is not in scope for the
  // <Outer> component call.
  <Outer {Footer}>
    component Footer() {
      <button>{'OK'}</button>
    }
  </Outer>

  component Footer() {
    <button>{'OK'}</button>
  }

  <Outer {Footer} />
}
```

## Reactive Props

See [Reactivity](/docs/guide/reactivity#Props-and-Attributes).

## Prop Shorthands

```ripple
// Object spread
<div {...properties}>"Content"</div>

// Shorthand props (when variable name matches prop name)
<div {onClick} {className}>"Content"</div>

// Equivalent to:
<div {onClick} {className}>"Content"</div>
```

## Portal Component

The `Portal` component allows you to render (teleport) content anywhere in the DOM
tree, breaking out of the normal component hierarchy. This is particularly useful
for modals, tooltips, and notifications.

```ripple
import { Portal } from 'ripple';

export component App() {
  <div class="app">
    <h1>"My App"</h1>

    {/* This will render inside document.body, not inside the .app div */}
    <Portal target={document.body}>
      <div class="modal">
        <h2>"I am rendered in document.body!"</h2>
        <p>"This content escapes the normal component tree."</p>
      </div>
    </Portal>
  </div>
}
```

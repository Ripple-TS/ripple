---
title: Styling in Ripple
---

# Styling

Ripple supports native CSS styling that's scoped (localized) to the returned
TSRX template using the `<style>` element.

```ripple
function MyComponent() {
  return <>
    <div class="container">
      <h1>"Hello World"</h1>
    </div>

    <style>
      .container {
        background: blue;
        padding: 1rem;
      }
      h1 {
        color: white;
        font-size: 2rem;
      }
    </style>
  </>;
}
```

::: info Bare scoped `<style>` blocks should be top-level within a returned TSRX template. Assign a `<style>` expression to a variable when you want a reusable class map.
:::

`<style>` blocks contain static CSS. TSRX template rules for JavaScript
statements and expressions do not apply inside them, so do not put `{expr}`,
`if`, `for`, or declarations in a style block. Use CSS custom properties for
runtime values.

## Dynamic Classes

In Ripple, the `class` attribute can accept more than just a string — it also
supports objects and arrays. Truthy values are included as class names, while
falsy values are omitted. This behavior is powered by the `clsx` library.

Examples:

```ripple
import { track } from 'ripple';

let &[includeBaz] = track(true);
<div class={{ foo: true, bar: false, baz: includeBaz }} />
// becomes: class="foo baz"

<div class={['foo', { baz: false }, 0 && 'bar', [true && 'bat']]} />
// becomes: class="foo bat"

let &[count] = track(3);
<div class={['foo', { bar: count > 2 }, count > 3 && 'bat']} />
// becomes: class="foo bar"
```

## Dynamic CSS Values

Styles in `<style>` blocks are static CSS. When a value needs to change at
runtime, put that value in a CSS custom property on the element and read it with
`var(...)` from your static CSS:

```ripple
import { track } from 'ripple';

function App() {
  let &[color] = track('red');

  return <>
    <div class="notice" style={{ '--notice-color': color }}>
      "Styled text"
    </div>
    <button onClick={() => (color = color === 'red' ? 'blue' : 'red')}>
      "Toggle Color"
    </button>

    <style>
      .notice {
        color: var(--notice-color);
        font-weight: bold;
        background-color: gray;
      }
    </style>
  </>;
}
```

## Global Styles

By default, all styles in Ripple are scoped to the component. To apply global
styles, use the `:global()` pseudo-class or `:global` block:

<Code>

```ripple
export function App() {
  return <>
    <div class="container">
      <Child />
    </div>

    <style>
      /* Scoped to Parent only */
      .container {
        padding: 1rem;
      }

      /* Global - Not Recommended - applies to any .highlight in any component */
      :global(.highlight) {
        color: red;
        font-weight: bold;
      }

      /* Global: - Recommended - scoped parent with global child selector */
      .container :global(.nested) {
        margin-left: 2rem;
      }

      /* Global block - everything inside is global */
      div :global {
        .header {
          font-size: 3rem;
        }
      }
    </style>
  </>;
}

function Child() {
  // The div should have its font-size at 2rem from parent
  return <div>
    <h2 class="header">"This is a header with font-size 3rem"</h2>
    <span class="highlight">"This will be red and bold"</span>
    <p class="nested">"This will have left margin"</p>
  </div>
}
```

</Code>

### Global Keyframes

Keyframes are scoped by default. To create global keyframes that can be shared
across components, prefix the animation name with `-global-`:

<Code>

```ripple
export function App() {
  return <>
    <div class="parent">
      <Child />
    </div>

    <style>
      /* Scoped keyframe - only usable within Parent */
      @keyframes slideIn {
        from {
          transform: translateX(-100%);
        }
        to {
          transform: translateX(0);
        }
      }

      /* Global keyframe - usable in any component */
      @keyframes -global-fadeIn {
        0% {
          opacity: 0;
        }
        100% {
          opacity: 1;
        }
      }

      .parent {
        animation: slideIn 1s;
      }
    </style>
  </>;
}

function Child() {
  return <>
    <div class="child">"Child content"</div>

    <style>
      .child {
        animation: fadeIn 1s; /* Uses global fadeIn from Parent */
      }
    </style>
  </>;
}
```

</Code>

## Passing Scoped Classes to Child Components (`<style>` Expressions)

Scoped styles only apply to DOM elements within the same component. If you want a
parent to influence how a child component looks, assign a `<style>` expression to
a variable and pass entries from that class map as props.

Each map entry contains both the CSS scope hash and the class name (for example
`"ripple-abc123 highlight"`), which the child applies to its own elements via the
`class` attribute.

### Basic Usage

```ripple
function Child({ class: className }: { class: string }) {
  return <div class={className}>"styled child"</div>
}

function Parent() {
  const styles = <style>
    .highlight {
      color: red;
    }
  </style>;

  return <Child class={styles.highlight} />;
}
```

You can pass multiple classes:

```ripple
function Child({ primary, secondary }: { primary: string; secondary: string }) {
  return <>
    <div class={primary}>"primary"</div>
    <span class={secondary}>"secondary"</span>
  </>;
}

function Parent() {
  const styles = <style>
    .primary {
      color: blue;
    }
    .secondary {
      color: gray;
    }
  </style>;

  return <Child primary={styles.primary} secondary={styles.secondary} />;
}
```

### With Dynamic Components

Style expression maps also work when rendering dynamic components with `<@Component />`:

```ripple
import { track } from 'ripple';

function Child({ cls }: { cls: string }) {
  return <span class={cls}>"text"</span>
}

function Parent() {
  const styles = <style>
    .text {
      color: red;
    }
  </style>;

  let &[Dynamic] = track(() => Child);
  return <@Dynamic cls={styles.text} />
}
```

### Combining Parent and Child Styles

A child component can combine classes it receives from a parent with its own
scoped classes:

```ripple
function Card({ class: className }: { class?: string }) {
  return <>
    <div class={['card-base', className ?? '']}>"card content"</div>

    <style>
      .card-base {
        border: 1px solid black;
      }
    </style>
  </>;
}

function App() {
  const styles = <style>
    .themed {
      background: purple;
    }
  </style>;

  return <Card class={styles.themed} />;
}
```

### Standalone Requirement

Classes exposed by a style expression map come from **standalone** selectors in
the `<style>` block. Classes that only appear inside compound, descendant, or
combinator selectors are not exported on the map.

If a class appears both standalone and in a descendant selector, it can still be
used through the style expression map:

```ripple
function App() {
  const styles = <style>
    /* Standalone rule — exposes styles.dual */
    .dual {
      color: blue;
    }

    /* Also applies when .dual is inside .parent */
    .parent .dual {
      font-weight: bold;
    }
  </style>;

  return <div class="parent">
    <Child cls={styles.dual} />
  </div>
}
```

The following will **not** work because the class has no standalone rule:

```ripple
// ❌ .nested only exists in a descendant selector
function App() {
  const styles = <style>
    .wrapper .nested {
      color: red;
    }
  </style>;

  return <Child cls={styles.nested} />;
}
```

The map is available wherever the variable is in scope, so declare it before the
returned template when you need to pass classes into child components.

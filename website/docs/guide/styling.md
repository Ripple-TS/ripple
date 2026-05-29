---
title: Styling in Ripple
---

# Styling

Ripple supports native CSS styling that's scoped (localized) to the given
component using the `<style>` element.

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

::: info The `<style>` element must be top-level within a returned TSRX template.
:::

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

## Dynamic Inline Styles

Sometimes you might need to dynamically set inline styles. For this, you can use
the `style` attribute, passing either a string or an object to it:

```ripple
import { track } from 'ripple';

let &[color] = track('red');

<div style={`color: ${color}; font-weight: bold; background-color: gray`} />
<div style={{ color: color, fontWeight: 'bold', 'background-color': 'gray' }} />

const style = {
  color,
  fontWeight: 'bold',
  'background-color': 'gray',
};

// using object spread
<div style={{ ...style }} />

// using object directly
<div {style} />
```

Both examples above will render the same inline styles, however, it's recommended
to use the object notation as it's typically more performance optimized.

::: info When passing an object to the `style` attribute, you can use either
camelCase or kebab-case for CSS property names.
:::

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
  return <>
  // The div should have its font-size at 2rem from parent
  <div>
    <h2 class="header">"This is a header with font-size 3rem"</h2>
    <span class="highlight">"This will be red and bold"</span>
    <p class="nested">"This will have left margin"</p>
  </div>

  </>;
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

## Passing Scoped Classes to Child Components (`<style ref>`)

Scoped styles only apply to DOM elements within the same component. If you want a
parent to influence how a child component looks, expose the scoped class map from
the component's `<style>` block with a ref and pass entries from that map as
props.

Each map entry contains both the CSS scope hash and the class name (for example
`"ripple-abc123 highlight"`), which the child applies to its own elements via the
`class` attribute.

### Basic Usage

```ripple
function Child({ className }: { className: string }) {
  return <>
  <div class={className}>"styled child"</div>

  </>;
}

function Parent() {
  let styles;
  return <>
  <Child className={styles.highlight} />

  <style ref={(s) => styles = s}>
    .highlight {
      color: red;
    }
  </style>

  </>;
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
  let styles;
  return <>
  <Child primary={styles.primary} secondary={styles.secondary} />

  <style ref={(s) => styles = s}>
    .primary {
      color: blue;
    }
    .secondary {
      color: gray;
    }
  </style>

  </>;
}
```

### With Dynamic Components

Style refs also work when rendering dynamic components with `<@Component />`:

```ripple
import { track } from 'ripple';

function Child({ cls }: { cls: string }) {
  return <>
  <span class={cls}>"text"</span>

  </>;
}

function Parent() {
  let styles;
  return <>
  let &[Dynamic] = track(() => Child);
  <@Dynamic cls={styles.text} />

  <style ref={(s) => styles = s}>
    .text {
      color: red;
    }
  </style>

  </>;
}
```

### Combining Parent and Child Styles

A child component can combine classes it receives from a parent with its own
scoped classes:

```ripple
function Card({ className }: { className?: string }) {
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
  let styles;
  return <>
  <Card className={styles.themed} />

  <style ref={(s) => styles = s}>
    .themed {
      background: purple;
    }
  </style>

  </>;
}
```

### Standalone Requirement

Classes exposed by a style ref map come from **standalone** selectors in the
`<style>` block. Classes that only appear inside compound, descendant, or
combinator selectors are not exported on the map.

If a class appears both standalone and in a descendant selector, it can still be
used through the style ref map:

```ripple
function App() {
  let styles;
  return <>
  <div class="parent">
    <Child cls={styles.dual} />
  </div>

  <style ref={(s) => styles = s}>
    /* Standalone rule — exposes styles.dual */
    .dual {
      color: blue;
    }

    /* Also applies when .dual is inside .parent */
    .parent .dual {
      font-weight: bold;
    }
  </style>

  </>;
}
```

The following will **not** work because the class has no standalone rule:

```ripple
// ❌ .nested only exists in a descendant selector
function App() {
  let styles;
  return <>
  <Child cls={styles.nested} />

  <style ref={(s) => styles = s}>
    .wrapper .nested {
      color: red;
    }
  </style>

  </>;
}
```

The map is available wherever you assign it, so declare the variable before the
returned template when you need to read it earlier in the markup.

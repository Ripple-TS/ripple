---
title: Styling in Ripple
---

# Styling

Ripple supports native CSS styling that's scoped (localized) to the given
component using the `<style>` element.

```ripple
component MyComponent() {
  <div class="container">
    <h1>{'Hello World'}</h1>
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
}
```

::: info The `<style>` element must be top-level within a `component`. :::

## Dynamic Classes

In Ripple, the `class` attribute can accept more than just a string — it also
supports objects and arrays. Truthy values are included as class names, while
falsy values are omitted. This behavior is powered by the `clsx` library.

Examples:

```ripple
let includeBaz = #ripple.track(true);
<div class={{ foo: true, bar: false, baz: @includeBaz }} />
// becomes: class="foo baz"

<div class={['foo', { baz: false }, 0 && 'bar', [true && 'bat']]} />
// becomes: class="foo bat"

let count = #ripple.track(3);
<div class={['foo', { bar: @count > 2 }, @count > 3 && 'bat']} />
// becomes: class="foo bar"
```

## Dynamic Inline Styles

Sometimes you might need to dynamically set inline styles. For this, you can use
the `style` attribute, passing either a string or an object to it:

```ripple
let color = #ripple.track('red');

<div style={`color: ${@color}; font-weight: bold; background-color: gray`} />
<div style={{ color: @color, fontWeight: 'bold', 'background-color': 'gray' }} />

const style = {
  @color,
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
camelCase or kebab-case for CSS property names. :::

## Global Styles

By default, all styles in Ripple are scoped to the component. To apply global
styles, use the `:global()` pseudo-class or `:global` block:

<Code>

```ripple
export component App() {
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
}

component Child() {
  // The div should have its font-size at 2rem from parent
  <div>
    <h2 class="header">{'This is a header with font-size 3rem'}</h2>
    <span class="highlight">{'This will be red and bold'}</span>
    <p class="nested">{'This will have left margin'}</p>
  </div>
}
```

</Code>

### Global Keyframes

Keyframes are scoped by default. To create global keyframes that can be shared
across components, prefix the animation name with `-global-`:

<Code>

```ripple
export component App() {
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
}

component Child() {
  <div class="child">{'Child content'}</div>

  <style>
    .child {
      animation: fadeIn 1s; /* Uses global fadeIn from Parent */
    }
  </style>
}
```

</Code>

## Passing Scoped Classes to Child Components (`#ripple.style`)

Scoped styles only apply to DOM elements within the same component. If you want a
parent to influence how a child component looks, you can pass scoped class names
as props using the `#ripple.style` identifier (previously `#style`).

`#ripple.style.className` produces a string containing both the CSS scope hash
and the class name (e.g. `"ripple-abc123 highlight"`), which the child applies to
its own elements via the `class` attribute.

::: info `#style` (legacy) and `#ripple.style` are interchangeable. New code
should use `#ripple.style` for consistency with the rest of the `#ripple.*`
namespace. :::

### Basic Usage

```ripple
component Child({ className }: { className: string }) {
  <div class={className}>{'styled child'}</div>
}

component Parent() {
  <Child className={#ripple.style.highlight} />

  <style>
    .highlight {
      color: red;
    }
  </style>
}
```

You can pass multiple classes:

```ripple
component Child({ primary, secondary }: { primary: string; secondary: string }) {
  <div class={primary}>{'primary'}</div>
  <span class={secondary}>{'secondary'}</span>
}

component Parent() {
  <Child primary={#ripple.style.primary} secondary={#ripple.style.secondary} />

  <style>
    .primary {
      color: blue;
    }
    .secondary {
      color: gray;
    }
  </style>
}
```

### With Dynamic Components

`#ripple.style` also works when rendering dynamic components with `<@Component />`:

```ripple
component Child({ cls }: { cls: string }) {
  <span class={cls}>{'text'}</span>
}

component Parent() {
  let Dynamic = #ripple.track(() => Child);
  <@Dynamic cls={#ripple.style.text} />

  <style>
    .text {
      color: red;
    }
  </style>
}
```

### Combining Parent and Child Styles

A child component can combine classes it receives from a parent with its own
scoped classes:

```ripple
component Card({ className }: { className?: string }) {
  <div class={['card-base', className ?? '']}>{'card content'}</div>

  <style>
    .card-base {
      border: 1px solid black;
    }
  </style>
}

component App() {
  <Card className={#ripple.style.themed} />

  <style>
    .themed {
      background: purple;
    }
  </style>
}
```

### Standalone Requirement

A class referenced via `#style` must exist as a **standalone** selector in the
`<style>` block. Classes that only appear inside compound, descendant, or
combinator selectors cannot be passed.

If a class appears both standalone and in a descendant selector, it can still be
used with `#style`:

```ripple
component App() {
  <div class="parent">
    <Child cls={#ripple.style.dual} />
  </div>

  <style>
    /* ✅ Standalone rule — makes .dual valid for #style */
    .dual {
      color: blue;
    }

    /* Also applies when .dual is inside .parent */
    .parent .dual {
      font-weight: bold;
    }
  </style>
}
```

The following will **not** work because the class has no standalone rule:

```ripple
// ❌ .nested only exists in a descendant selector
component App() {
  <Child cls={#ripple.style.nested} />

  <style>
    .wrapper .nested {
      color: red;
    }
  </style>
}
```

### Syntax Rules

- **Dot notation:** `#ripple.style.className`
- **Bracket notation:** `#ripple.style['className']` (static string only)
- **No dynamic access:** `#ripple.style[variable]` is a compile error
- **Components only:** `#ripple.style` can only be used inside a `component` body
- **Props only:** `#ripple.style` cannot be used directly on DOM elements — pass
  it to a child component instead

::: info Legacy syntax: `#ripple.style.className` and `#ripple.style['className']` are still
accepted as aliases for `#ripple.style.*`. :::

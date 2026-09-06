---
title: Styling in Ripple
---

# Styling

A `<style>` block styles the elements beside it and everything below them, and
never the element that contains it. The CSS is scoped: the compiler adds a hash
class to every selector in the block and to every element the block reaches, so
the rules cannot leak into a parent, an outer sibling, a child component, or the
page around it.

```tsrx
export function Card({ title, summary }: { title: string; summary: string }) @{
  <>
    <style>
      .card {
        padding: 1.5rem;
        border: 1px solid gray;
      }
      h2 {
        margin: 0 0 0.5rem;
      }
    </style>
    <article class="card">
      <h2>{title}</h2>
      <p>{summary}</p>
    </article>
  </>
}
```

`.card` becomes `.card.tsrx-1a20093c`, `h2` becomes `h2.tsrx-1a20093c`, and the
article and its children get the class `tsrx-1a20093c`. That class is the block's
**hash class**: the class the compiler adds to an element so the block's selectors
match only there.

To style an element, put the block beside it, as siblings in a fragment. A block
written inside `<article>` would style the article's children, not the article.

## Wrap the block and its markup in a fragment

A `@{ … }` body and every `@if`, `@for`, `@switch`, and `@try` branch hold setup
statements and exactly one output node, and a `<style>` block counts as an output
node. Written beside the output node it is the multiple-outputs error; written as
the only output it styles nothing (`tsrx-style-standalone-needs-fragment`).

```tsrx
// Error: two output nodes.
export function Broken() @{
  <style>
    p {
      margin: 0;
    }
  </style>
  <p>Hello</p>
}

// Works: one fragment holding both.
export function Note() @{
  <>
    <style>
      p {
        margin: 0;
      }
    </style>
    <p>Hello</p>
  </>
}
```

A block with CSS text in it is TSRX template syntax, so it needs a `@{ … }` body
or a control-flow branch around it. In a plain function that returns JSX, a
`<style>` is an ordinary element whose content is an expression,
`<style>{css}</style>`, and the compiler leaves it alone
(`tsrx-style-standalone-outside-template` otherwise).

## The CSS is static

A block holds plain CSS. TSRX template rules for JavaScript expressions and
directives do not apply inside it, so do not put `{expr}`, `@if`, `@for`, or
declarations in a style block. Put a runtime value in a CSS custom property on the
element and read it with `var(...)`:

```tsrx
import { track } from 'ripple';

export function App() @{
  let &[color] = track('red');

  <>
    <div class="notice" style={{ '--notice-color': color }}>
      Styled text
    </div>
    <button onClick={() => (color = color === 'red' ? 'blue' : 'red')}>
      Toggle Color
    </button>

    <style>
      .notice {
        color: var(--notice-color);
        font-weight: bold;
        background-color: gray;
      }
    </style>
  </>
}
```

A scoped block accepts only two attributes, `ref` and `apply`.

## Dynamic Classes

The `class` attribute accepts more than a string: objects and arrays work too.
Truthy values are included as class names and falsy values are omitted, powered
by the `clsx` library. The scope's hash class is added after whatever the value
produces.

```tsrx
import { track } from 'ripple';

export function App() @{
  let &[includeBaz] = track(true);
  let &[count] = track(3);

  <>
    <div class={{ foo: true, bar: false, baz: includeBaz }} />
    // becomes: class="foo baz"

    <div class={['foo', { baz: false }, 0 && 'bar', [true && 'bat']]} />
    // becomes: class="foo bat"

    <div class={['foo', { bar: count > 2 }, count > 3 && 'bat']} />
    // becomes: class="foo bar"
  </>
}
```

## What a scope is

A scope is one list of children, the children of an element or of a fragment,
that holds at least one block. The block belongs to the list it is written in and
styles the other items of that list and their descendants. These lists count:

- The children of a DOM element.
- The children of a fragment, including the fragment that a `@{ … }` block or an
  `@if`, `@else if`, `@else`, `@for`, `@empty`, `@case`, `@default`, `@try`,
  `@pending`, or `@catch` branch renders.
- The children of an element or fragment used as a value inside a component
  body: a template assigned to a variable, or one written inside a `{ … }`
  expression.

Scopes nest. An element gets the hash class of every scope around it, outermost
first, so an outer block's rules reach into nested scopes and an inner block's
rules never reach out. A child component's own elements, and elements returned
from a callback such as `items.map((item) => <li />)`, get no hash class from
the parent.

```tsrx
export function Panel() @{
  <>
    <style>
      div {
        color: black;
      }
    </style>
    <div class="outer">Black</div>
    @{
      <>
        <style>
          div {
            font-weight: bold;
          }
        </style>
        <div class="inner">Black and bold</div>
      </>
    }
  </>
}
```

With `A` and `B` as the two hash classes, the compiled classes are `outer A` and
`inner A B`. The nested `div` matches both rules; the outer one matches only its
own.

## Several blocks, one scope

Blocks written among the same children share one hash class and behave like one
block split for readability. Use that to keep each rule next to the element it
styles:

```tsrx
export function Toolbar() @{
  <>
    <style>
      .toolbar {
        display: flex;
        gap: 0.5rem;
      }
    </style>
    <div class="toolbar">
      <style>
        .save {
          font-weight: 600;
        }
      </style>
      <button class="save">Save</button>
      <style>
        .cancel {
          opacity: 0.7;
        }
      </style>
      <button class="cancel">Cancel</button>
    </div>
  </>
}
```

The two blocks inside the toolbar share a hash and style the buttons beside them.
The `.toolbar` rule sits beside the toolbar in the fragment because a block never
styles the element that contains it. A scope's blocks always come out together as
one group in the CSS, even when other scopes sit between them in the source.

## Styles inside `@if` and `@for`

A `<style>` block inside a branch applies only to the elements that branch
renders. Its CSS is still always part of the file's stylesheet, whether or not the
branch ever renders, because CSS is static. Rules you want everywhere belong
outside the branch.

```tsrx
export function Status({ ready }: { ready: boolean }) @{
  <>
    <style>
      .status {
        padding: 0.5rem;
      }
    </style>
    <section class="status">
      @if (ready) {
        <>
          <style>
            .ok {
              color: green;
            }
          </style>
          <p class="ok">Ready</p>
        </>
      } @else {
        <>
          <style>
            .wait {
              color: gray;
            }
          </style>
          <p class="wait">Waiting</p>
        </>
      }
    </section>
  </>
}
```

With `A`, `B`, and `C` as the hash classes of the fragment and the two branches,
the compiled classes are `status A`, `ok A B`, and `wait A C`, and the three
sheets come out in that order. The same class name can mean different things in
`@if` and `@else`.

## Global Styles

By default, every rule is scoped. To reach outside the scope, use the
`:global(...)` pseudo-class or a `:global` block. Where the `:global` sits decides
how far the rule reaches:

<Code>

```tsrx
export function App() @{
  <>
    <div class="container">
      <Child />
    </div>

    <style>
      /* Scoped to App only */
      .container {
        padding: 1rem;
      }

      /* Global - Not Recommended - applies to any .highlight in any component */
      :global(.highlight) {
        color: red;
        font-weight: bold;
      }

      /* Global - Recommended - scoped parent with global child selector */
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
  </>
}

function Child() {
  return <div>
    <h2 class="header">This is a header with font-size 3rem</h2>
    <span class="highlight">This will be red and bold</span>
    <p class="nested">This will have left margin</p>
  </div>
}
```

</Code>

- **Bare** `:global(.toast)` becomes `.toast`: a page-wide rule that matches
  anywhere, exactly like a rule in a global stylesheet.
- **Prefixed** `.container :global(.nested)` becomes
  `.container.tsrx-1a20093c .nested`: only elements below your scoped
  container, a child component's internals included. It can never climb up.
- **Leading** `:global(.theme-dark) .card` becomes `.theme-dark .card.tsrx-1a20093c`:
  your own element, only when an ancestor carries the class.
- **Compound** `.card:global(.is-open)` becomes `.card.tsrx-1a20093c.is-open`:
  your own element, with a class another library toggles on it.
- **Block** `:global { … }` drops the wrapper and leaves every rule inside it
  unscoped. Nested under a scoped rule, `.post { :global { pre { … } } }`, it
  reaches only below that rule, like the prefixed form with the prefix written
  once.

`:global(...)` may only start or end a selector. In the middle,
`.card :global(.x) .title`, it is the `tsrx-css-global-placement` error.

Reach for `:global` only when a prop cannot do the job. To style a child you own,
pass it a class from a theme (see [Apply a theme](#apply-a-theme-to-a-scope) and
[Passing scoped classes](#passing-scoped-classes-to-child-components)) instead:
the dependency is a visible prop, and the child decides which of its elements
take the class. Keep `:global` for a child you cannot change, always with a scoped
selector in front, and put page-wide rules such as `body` resets in a `.css` file
the page links.

### Global Keyframes

Keyframes are scoped by default. To create global keyframes that can be shared
across components, prefix the animation name with `-global-`:

<Code>

```tsrx
export function App() @{
  <>
    <div class="parent">
      <Child />
    </div>

    <style>
      /* Scoped keyframe - only usable within App */
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
  </>
}

function Child() @{
  <>
    <div class="child">Child content</div>

    <style>
      .child {
        animation: fadeIn 1s; /* Uses global fadeIn from App */
      }
    </style>
  </>
}
```

</Code>

## Assign a block to get a class map

Assign a `<style>` block to a variable and it becomes a plain object of class
names instead of a scoped block. The object has `$class`, the block's hash class
(after the classes of any theme it applies), plus one key per standalone class
selector whose value is the hash class and the class name together:

```tsrx
export const theme = <style>
  div {
    color: green;
  }
  .dark {
    color: purple;
  }
</style>;
// theme.$class → 'tsrx-fe4e37b1'
// theme.dark   → 'tsrx-fe4e37b1 dark'

export function Badge({ label }: { label: string }) {
  return <span class={theme.dark}>{label}</span>;
}
```

Pass these strings to child components as ordinary props; the hash class is
already in them. The declaration can sit at module scope or anywhere a
declaration is legal inside a component body. `$class` is reserved, so a block
cannot declare a `.$class` selector, and a standalone `<style>` at module scope is
an error: assign it to a variable.

A block that is exported, applied, or whose `$class` is read anywhere in the
module is a **theme** and keeps every selector, element and descendant selectors
included. A local block used only through its class keys is a plain class map: it
keeps only the selectors that are a single class, such as `.dark`, and every other
selector is removed as unused and left as a `/* (unused) … */` comment in the
compiled CSS.

## Passing Scoped Classes to Child Components

Scoped styles only apply to elements inside the same scope. If you want a parent
to influence how a child component looks, pass entries from a class map as props.

```tsrx
function Child({ class: className }: { class: string }) {
  return <div class={className}>styled child</div>
}

function Parent() @{
  const styles = <style>
    .highlight {
      color: red;
    }
  </style>;

  <Child class={styles.highlight} />
}
```

Style maps also work when rendering dynamic components with the `<{expression}>`
tag syntax, and a child can combine a received class with its own scoped classes:

```tsrx
function Card({ class: className }: { class?: string }) @{
  <>
    <style>
      .card-base {
        border: 1px solid black;
      }
    </style>
    <div class={['card-base', className ?? '']}>card content</div>
  </>
}

function App() @{
  const styles = <style>
    .themed {
      background: purple;
    }
  </style>;

  <Card class={styles.themed} />
}
```

Classes exposed by a class map come from **standalone** selectors in the block.
A class that only appears inside a compound, descendant, or combinator selector is
not exported on the map, so `styles.nested` is undefined for a block whose only
rule is `.wrapper .nested { … }`. To hand a child the block's element and
descendant rules as well, pass `styles.$class` instead (see
[Opt single elements in](#opt-single-elements-in-with-class)).

## Apply a theme to a scope

`<style apply={theme} />` adds the theme's `$class` to the items beside it and
everything below them, the same elements a block's own rules reach, so the
theme's element and descendant rules match those elements as if the theme had
been written there. A self-closing apply adds no hash class of its own. A block
with CSS in it, `<style apply={theme}>…</style>`, applies the theme and declares
the scope's own block in one tag:

```tsrx
// theme.tsrx
const base = <style>
  div {
    font-family: system-ui;
  }
</style>;

export const theme = <style apply={base}>
  div {
    color: green;
  }
  .dark {
    color: purple;
  }
</style>;
// theme.$class → base's hash, then theme's own hash
```

```tsrx
// Panel.tsrx
import { theme } from './theme.tsrx';

export function Panel() @{
  <>
    <style apply={theme}>
      div {
        color: black;
      }
    </style>
    <span class={theme.dark}>Purple</span>
    <div>Black: the local rule beats the theme's green</div>
  </>
}

export function Card() @{
  <>
    <style apply={theme} />
    <article>
      <h2>Green, system-ui</h2>
    </article>
  </>
}
```

- `apply={[a, b]}` applies several themes, and a theme can apply another theme:
  its `$class` then lists the applied classes first and its own hash class last.
- `export const bundle = <style apply={[a, b]} />;` composes themes with no CSS
  of its own; `bundle.$class` is the two themes' classes.
- The `apply` value must be an identifier, a member expression, or an array of
  those, naming a style block declared earlier in the same module or imported.
- A theme declared in the same module becomes a string literal in the class
  attribute, so the element's static HTML is still built once, up front. An
  imported theme is read at runtime through `theme.$class`, so that element's
  class is set when it renders.

An element's final class list is: its own classes, then the hash class of each
enclosing scope outer to inner, then the applied theme classes.

### Opt single elements in with `$class`

`apply` covers a whole scope. When only some elements should pick up a theme,
give those elements `class={theme.$class}` and leave `apply` out: the theme's
element and descendant rules match exactly the elements that carry the class,
and their siblings stay untouched. Because `$class` is a plain string, a child
component can receive it through a prop and put it on its own elements; the
passed class lands before the child's own hash class.

```tsrx
function Card({ parentClass }: { parentClass: string }) @{
  <>
    <style>
      .local {
        padding: 0;
      }
    </style>
    <article class={['local', parentClass]}>
      <h2 class={parentClass}>Blue, from the parent's theme</h2>
    </article>
  </>
}

export function App() @{
  const theme = <style>
    div,
    h2 {
      color: blue;
    }
    .card {
      color: red;
    }
  </style>;
  <>
    <Card parentClass={theme.$class} />
    <div class={theme.$class}>Blue: opted in</div>
    <div class={theme.card}>Red: a class entry carries the hash too</div>
    <p>Untouched</p>
  </>
}
```

Reading `theme.$class` is what makes `theme` a theme: the `div, h2` rule survives
even though nothing exports or applies the block. Opt one element into several
themes with `class={[a.$class, b.$class]}`.

## Which rule wins

Every hash is a single class, so a scoped rule has the specificity of its selector
plus one class, and at equal specificity the rule that comes later in the CSS
wins. The CSS comes out in source order, outer scope first: a scope's sheet goes
where its first block is, after the assigned blocks declared before it, and before
the scopes and assigned blocks nested inside it. Sibling scopes follow source
order. An applied theme's sheet always comes before the block that applies it,
because you can only apply a block you already declared or imported, so a local
rule wins over the theme's rule at equal specificity. That is why the `div` in
`Panel` above is black, not the theme's green.

## Where the CSS goes at runtime

- **On the client**, the Vite plugin turns each `.tsrx` file's CSS into one
  virtual CSS module, imported by the compiled module after its own imports. An
  imported theme's stylesheet is therefore in the document before the stylesheet
  of the file that applies it. Inside one file the sheets are in the order above.
- **On the server**, a render collects the hashes of the scopes it rendered and
  returns them as the `css` set of the result, in the same order: an applied
  theme's hash before the scope that applies it, whichever module the theme
  lives in. A class map registers its sheet when one of its entries is read, so a
  theme that nothing renders sends no CSS. `getCss(css)` turns the set into CSS
  text for a `<style data-ripple-ssr>` tag; see
  [Server-side rendering](/docs/guide/application#server-side-rendering).

A `<style>` rendered inside `<head>` is a plain document stylesheet: it is not
scoped and adds no class to any element.

## Diagnostics

Style errors stop the compile and carry one of these codes:

- `tsrx-style-standalone-needs-fragment`: a `<style>` as the lone output of a
  `@{ … }` body or a control-flow branch. Wrap it with the output it styles in a
  fragment.
- `tsrx-style-standalone-outside-template`: raw CSS in a `<style>` outside every
  `@{ … }` or control-flow body, such as a plain function returning JSX. Use a
  `@{ … }` body, write `<style>{css}</style>`, or assign the block.
- `tsrx-style-standalone-at-module-scope`: a bare `<style>` statement at module
  scope. Assign it to a variable.
- `tsrx-style-apply-value`, `tsrx-style-apply-target`,
  `tsrx-style-apply-before-declaration`, `tsrx-style-apply-duplicate`,
  `tsrx-style-apply-unsupported-host`: `apply` needs one expression value naming
  style blocks declared before it, and cannot sit on a `<head>` style.
- `tsrx-style-reserved-class-key`: an assigned block declares a `.$class`
  selector.
- `tsrx-style-unknown-attribute`: an attribute other than `ref` and `apply` on a
  scoped block.
- `tsrx-css-global-placement`: `:global(...)` in the middle of a selector.

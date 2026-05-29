---
title: Ripple Component Syntax
---

# Component Syntax

Ripple's syntax is a superset of JSX, with one notable difference: components and
elements (which we'll call templates) are written as statements rather than
expressions.

Ripple's compiler then transforms your components into optimized JavaScript code
that surgically applies fine-grained state changes to the DOM.

## Defining a Ripple Component

Ripple components are ordinary TypeScript functions. Use a capitalized function
name, accept props as the first parameter, and return TSRX the same way you would
return JSX.

```ripple
function Hello() {
  return <span>"Hello World!"</span>;
}

export function App() {
  return <Hello />;
}
```

TSRX is the default UI expression form in `.tsrx` files. You can return a single
element directly, or use a fragment when the template needs multiple statements.
Once a TSRX expression is opened, its body is a template statement list:
elements, local variables, control flow, and `<style>` blocks can sit next to
each other.

```ripple
function MyComponent({ name }: { name: string | null }) {
  return <>
    const fallback = 'friend';

    if (name) {
      <p>"Hello, "{name}</p>
    } else {
      <p>"Hello, "{fallback}</p>
    }

    <style>
      p { color: rebeccapurple; }
    </style>
  </>;
}
```

## TSRX Expressions

Because TSRX is expression-based at the point where it opens, UI can be returned,
stored, or passed as a value anywhere a TypeScript expression is allowed. The
inside of that value remains TSRX, so native text children and template control
flow keep working.

```ripple
function createBadge(label: string) {
  return <span class="badge">{label}</span>;
}

function App() {
  const title = <span class="title">"Settings"</span>;

  return <>
    <header>{title}</header>
    {createBadge('New')}
  </>;
}
```

Use fragments for statement-rich templates and single elements for compact return
values. `<tsx:react>` remains the explicit escape hatch when you intentionally
want React JSX semantics.

### TSRX vs React JSX

- `<div>"Text"</div>` is a TSRX expression with Ripple/TSRX text rules.
- `<>...</>` opens a TSRX fragment; its children are statements.
- `<tsx:react>...</tsx:react>` switches to React JSX semantics and requires
  compat setup.

## Guard Returns Before Templates

Functions are just functions, so a component can return `null`, a TSRX element,
or any value accepted by the target runtime before a TSRX expression opens.
Inside a TSRX element or fragment body, use conditional rendering instead of
`return`.

```ripple
function Profile({ user }) {
  if (!user) {
    return null;
  }

  return <>
    <h1>{user.name}</h1>
    <p>{user.email}</p>
  </>;
}
```

## Concept: Expressions

In Ripple (and JSX), we can interpolate expressions into the template with a pair
of {braces}. Inside the braces, we can put a JavaScript expression, which will
then be converted to a string (if it is not already) to be inserted into the DOM.

## Example: Displaying Text

This is the first place we can notice the difference between Ripple and JSX.
Static text can be written directly as a double-quoted child. Unquoted text is
still invalid because Ripple templates are statements rather than expressions, so
bare words in a template would be like writing text in the middle of your code.
Variables, single-quoted strings, template literals, and other JavaScript
expressions still use {braces}.

```ripple
// ✅ Correct - Static text is a direct double-quoted child
<span>"Hello World!"</span>

// ✅ Correct - JavaScript expressions use braces
<span>{'Hello World!'}</span>
<span>{message}</span>

// ❌ Wrong - Compilation error
<span>Hello World!</span>
```

```js
// Think of it like this:
let greet_text = 'Hello World!';
// compared to this:
let greet_text = Hello World!;
```

## Example: Text Interpolation

The most basic form of data-binding is text interpolation. In the example below,
we'll declare a `<span>` element as a statement. Direct double-quoted text can sit
next to dynamic {braces}; JavaScript string and template expressions still go
inside braces.

```ripple
<span>"Message: "{msg}</span>
<span>{`Message: ${msg}`}</span>
<span>{'Message: ' + msg}</span>
```

## Concept: Templates as Lexical Scopes

In Ripple, templates act as lexical scopes, allowing you to declare variables,
call functions, and execute JavaScript statements directly within JSX elements -
similar to block statements in regular JavaScript.

```ripple
function TemplateScope() {
  return <>
  <div>
    // Variable declarations inside templates
    const message = 'Hello from template scope';
    let count = 42;

    // Function calls and expressions
    console.log('This runs during render');

    // Conditional logic
    const isEven = count % 2 === 0;

    <h1>{message}</h1>
    <p>
      "Count is: "
      {count}
    </p>

    if (isEven) {
      <span>"Count is even"</span>
    }

    // Nested scopes work too
    <section>
      const sectionData = 'Nested scope variable';
      <p>{sectionData}</p>
    </section>

    debugger;
    // You can even put debugger statements
  </div>

  </>;
}
```

**Key Benefits:**

- **Inline Logic**: Execute JavaScript directly where you need it in the template
- **Local Variables**: Declare variables scoped to specific parts of your template
- **Debugging**: Place `console.log()` or `debugger` statements anywhere in
  templates
- **Dynamic Computation**: Calculate values inline without helper functions

**Scope Rules:**

- Variables declared in templates are scoped to that template block
- Nested elements create nested scopes
- Variables from outer scopes are accessible in inner scopes
- Template variables don't leak to the function scope

## Attribute Binding

Attribute Binding in Ripple is achieved the same way as JSX. To bind an expression
to an attribute, we write the attribute's name and an equal sign, like plain HTML,
but instead of quotes, we use {braces}, within which, we can write a JS expression
that evaluates to our desired value.

```ripple
<span data-my-attr={attr_val}>"Hi there!"</span>
```

::: info Plain attributes can still be used.

```ripple
<input type="text" />
```

:::

## Raw HTML

By default, all text nodes in Ripple are escaped to prevent unintended script
injections. If you'd like to render trusted HTML onto your page, use the native
`innerHTML` prop:

```ripple
export function App() {
  return <>
  let source = `
<h1>My Blog Post</h1>
<p>Hi! I like JS and Ripple.</p>
`;

  <article innerHTML={source} />

  </>;
}
```

::: info Note The raw HTML passed in should be valid, well-formed HTML. The
following example will not work, since closing tags by themselves are considered
malformed HTML.

```ripple
<article innerHTML={'<div>content</div>'} />
```

:::

### Styling Raw HTML

As raw HTML is not managed by Ripple, scoped styles do not apply to it. To style
raw content, refer to [Styling](/docs/guide/styling#Global-Styles).

## Text Expressions

Direct double-quoted children are static escaped text. Dynamic text is just a
normal `{expression}`. When you need explicit string coercion, write it in
JavaScript with `String(value)`, `value + ''`, or a typed string value.

```ripple
export function Frame({ children }) {
  return <>
  <div class="frame">
    {'before'}
    {children}
    {'after'}
  </div>

  </>;
}
```

Regular text expressions are HTML-escaped by the target renderer. The content is
never parsed as HTML unless you use the framework's raw HTML prop.

```ripple
export function App() {
  return <>
  const markup = '<span>Not HTML</span>';

  // Renders the literal string "<span>Not HTML</span>" as text
  <div>{markup}</div>

  </>;
}
```

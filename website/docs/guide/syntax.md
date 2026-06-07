---
title: Ripple Component Syntax
---

# Component Syntax

Ripple's syntax is a superset of JSX, with additions for local TypeScript setup,
template-native control flow, dynamic elements, and scoped styles.

Ripple's compiler then transforms your components into optimized JavaScript code
that surgically applies fine-grained state changes to the DOM.

## Defining a Ripple Component

Ripple components are ordinary TypeScript functions. Use a capitalized component
name, accept props as the first parameter, and produce JSX the same way you would
in a TypeScript JSX file. Return a single element directly when that is all the
component needs, and use a JSX statement container when setup code belongs next
to the rendered output.

```tsrx
function Hello() {
  return <span>Hello World!</span>;
}

export function App() {
  return <Hello />;
}
```

TSRX is the default UI expression form in `.tsrx` files. You can return a single
element directly. When a template scope mixes TypeScript setup and rendered
output, wrap the scope in `@{...}`. Setup comes first and the container must
finish with exactly one output node: a JSX element, a JSX fragment, or JSX
control flow such as `@if`, `@for`, `@switch`, or `@try`. CSS text inside
`<style>` blocks keeps CSS rules, not template rules.

```tsrx
export function MyComponent({ name }: { name: string | null }) @{
  const fallback = 'friend';

  <>
    @if (name) {
      <p>Hello, {name}</p>
    } @else {
      <p>Hello, {fallback}</p>
    }
    <style>
      p { color: rebeccapurple; }
    </style>
  </>
}
```

If the output needs multiple siblings or text next to elements, wrap the output
in a fragment so it becomes the one final node. A bare expression container is
not a statement-container output, and no script statements can appear after the
final output.

## TSRX Expressions

Because TSRX is expression-based at the point where it opens, UI can be returned,
stored, or passed as a value anywhere a TypeScript expression is allowed. The
inside of that value remains TSRX, so native text children and template control
flow keep working.

```tsrx
function createBadge(label: string) {
  return <span class="badge">{label}</span>;
}

function App() @{
  const title = <span class="title">Settings</span>;

  <>
    <header>{title}</header>
    {createBadge('New')}
  </>
}
```

Use fragments when a value needs multiple children, and single elements for
compact return values.

### TSRX vs React JSX

- `<div>Text</div>` is a JSX element with Ripple/TSRX text rules.
- `<>...</>` opens a JSX fragment; its children are JSX text, elements,
  expression containers, comments, and JSX control-flow expressions.
- `@{...}` opens a JSX statement container. TypeScript setup statements go
  before the final single output node.

## Guard Returns Before Templates

Functions are just functions, so a component can return `null`, a TSRX element,
or any value accepted by the target runtime before a TSRX expression opens.
Inside a statement container, `return` is a real function exit. Use it for
guard-style exits, and use `@if`/`else` when the branch should render inline.

```tsrx
function Profile({ user }) @{
  if (!user) {
    return null;
  }

  <>
    <h1>{user.name}</h1>
    <p>{user.email}</p>
  </>
}
```

## Concept: Expressions

In Ripple (and JSX), we can interpolate expressions into the template with a pair
of {braces}. Inside the braces, we can put a JavaScript expression, which will
then be converted to a string (if it is not already) to be inserted into the DOM.

## Example: Displaying Text

Static text is ordinary JSX text. Variables, single-quoted strings, template
literals, and other JavaScript expressions still use {braces}.

```tsrx
// ✅ Correct - Static text is JSX text
<span>Hello World!</span>

// ✅ Correct - JavaScript expressions use braces
<span>{'Hello World!'}</span>
<span>{message}</span>
```

## Example: Text Interpolation

The most basic form of data-binding is text interpolation. In the example below,
we'll declare a `<span>` element. JSX text can sit next to dynamic {braces};
JavaScript string and template expressions still go inside braces.

```tsrx
<span>Message: {msg}</span>
<span>{`Message: ${msg}`}</span>
<span>{'Message: ' + msg}</span>
```

## Concept: Statement Containers as Lexical Scopes

In Ripple, statement containers act as lexical scopes. You can declare
variables, call functions, and run TypeScript setup directly beside the template
before returning one output node for that scope.

```tsrx
function TemplateScope() @{
  // Variable declarations inside statement containers
  const message = 'Hello from template scope';
  let count = 42;

  // Function calls and expressions
  console.log('This runs during render');

  // Conditional logic
  const isEven = count % 2 === 0;

  debugger;

  <>
    <h1>{message}</h1>
    <p>Count is: {count}</p>

    @if (isEven) {
      <span>Count is even</span>
    }

    // Nested scopes work too
    <section>@{
      const sectionData = 'Nested scope variable';

      <p>{sectionData}</p>
    }</section>
  </>
}
```

Without `@{}`, text remains JSX text:

```tsrx
function LiteralText() {
  return <div>
    let there be love
  </div>;
}
```

**Key Benefits:**

- **Inline Logic**: Execute JavaScript directly where you need it in a statement container
- **Local Variables**: Declare variables scoped to specific parts of your template
- **Debugging**: Place `console.log()` or `debugger` statements anywhere in
  templates
- **Dynamic Computation**: Calculate values inline without helper functions

**Scope Rules:**

- Variables declared in statement containers are scoped to that block
- Nested statement containers and control-flow branches create nested scopes
- Variables from outer scopes are accessible in inner scopes
- Template variables don't leak to the function scope

## Attribute Binding

Attribute Binding in Ripple is achieved the same way as JSX. To bind an expression
to an attribute, we write the attribute's name and an equal sign, like plain HTML,
but instead of quotes, we use {braces}, within which, we can write a JS expression
that evaluates to our desired value.

```tsrx
<span data-my-attr={attr_val}>Hi there!</span>
```

::: info Plain attributes can still be used.

```tsrx
<input type="text" />
```

:::

## Raw HTML

By default, all text nodes in Ripple are escaped to prevent unintended script
injections. If you'd like to render trusted HTML onto your page, use the native
`innerHTML` prop:

```tsrx
export function App() @{
  let source = `
    <h1>My Blog Post</h1>
    <p>Hi! I like JS and Ripple.</p>
  `;

  <article innerHTML={source} />
}
```

::: info Note The raw HTML passed in should be valid, well-formed HTML. The
following example will not work, since closing tags by themselves are considered
malformed HTML.

```tsrx
<article innerHTML={'<div>content</div>'} />
```

:::

### Styling Raw HTML

As raw HTML is not managed by Ripple, scoped styles do not apply to it. To style
raw content, refer to [Styling](/docs/guide/styling#Global-Styles).

## Text Expressions

Plain JSX text is static escaped text. Dynamic text is just a normal
`{expression}`. When you need explicit string coercion, write it in JavaScript
with `String(value)`, `value + ''`, or a typed string value.

```tsrx
export function Frame({ children }) {
  return <div class="frame">
    before
    {children}
    after
  </div>;
}
```

Regular text expressions are HTML-escaped by the target renderer. The content is
never parsed as HTML unless you use the framework's raw HTML prop.

```tsrx
export function App() @{
  const markup = '<span>Not HTML</span>';
  // Renders the literal string "<span>Not HTML</span>" as text
  <div>{markup}</div>
}
```

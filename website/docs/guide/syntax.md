---
title: Ripple Component Syntax
---

# Component Syntax

Ripple's syntax is a superset of JSX, with additions for local TypeScript setup,
template-native control flow, dynamic elements, and scoped styles.

Ripple's compiler then transforms your components into optimized JavaScript code
that surgically applies fine-grained state changes to the DOM.

## Defining a Ripple Component

Ripple components are ordinary TypeScript values. Use a capitalized component
name, accept props as the first parameter, and return TSRX the same way you would
return JSX. Most examples use an arrow function whose body is a TSRX fragment.

```ripple
const Hello = () => <span>Hello World!</span>;

export const App = () => <Hello />;
```

TSRX is the default UI expression form in `.tsrx` files. You can return a single
element directly, or use a fragment when the template needs multiple children.
When a template scope mixes TypeScript setup and rendered output, put setup first
and finish that scope with one JSX element, JSX fragment, or JSX control-flow
expression. CSS text inside `<style>` blocks keeps CSS rules, not template rules.

```ripple
export const MyComponent = ({ name }: { name: string | null }) => <>
  const fallback = 'friend';

  <>
    @if (name) {
      <p>Hello, {name}</p>
    } else {
      <p>Hello, {fallback}</p>
    }
    <style>
      p { color: rebeccapurple; }
    </style>
  </>
</>;
```

## TSRX Expressions

Because TSRX is expression-based at the point where it opens, UI can be returned,
stored, or passed as a value anywhere a TypeScript expression is allowed. The
inside of that value remains TSRX, so native text children and template control
flow keep working.

```ripple
const createBadge = (label: string) => <span class="badge">{label}</span>;

const App = () => {
  const title = <span class="title">Settings</span>;

  return <>
    <header>{title}</header>
    {createBadge('New')}
  </>;
};
```

Use fragments when a value needs multiple children, and single elements for
compact return values.

### TSRX vs React JSX

- `<div>Text</div>` is a TSRX expression with Ripple/TSRX text rules.
- `<>...</>` opens a TSRX fragment; its children are JSX text, elements,
  expression containers, comments, and template directives. Setup statements may
  appear before a final single output node.

## Guard Returns Before Templates

Functions are just functions, so a component can return `null`, a TSRX element,
or any value accepted by the target runtime before a TSRX expression opens.
Inside a TSRX element or fragment body, `return` is a real function exit. Use it
for guard-style exits, and use `@if`/`else` when the branch should render inline.

```ripple
const Profile = ({ user }) => <>
  if (!user) {
    return null;
  }

  <>
    <h1>{user.name}</h1>
    <p>{user.email}</p>
  </>
</>;
```

## Concept: Expressions

In Ripple (and JSX), we can interpolate expressions into the template with a pair
of {braces}. Inside the braces, we can put a JavaScript expression, which will
then be converted to a string (if it is not already) to be inserted into the DOM.

## Example: Displaying Text

Static text is ordinary JSX text. Variables, single-quoted strings, template
literals, and other JavaScript expressions still use {braces}.

```ripple
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

```ripple
<span>Message: {msg}</span>
<span>{`Message: ${msg}`}</span>
<span>{'Message: ' + msg}</span>
```

## Concept: Templates as Lexical Scopes

In Ripple, templates act as lexical scopes. You can declare variables, call
functions, and run TypeScript setup directly in an element or fragment before
returning one output node for that scope.

```ripple
const TemplateScope = () => <div>
    // Variable declarations inside templates
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
      <section>
        const sectionData = 'Nested scope variable';
        <p>{sectionData}</p>
      </section>
    </>
  </div>;
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
<span data-my-attr={attr_val}>Hi there!</span>
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
  let source = `
    <h1>My Blog Post</h1>
    <p>Hi! I like JS and Ripple.</p>
  `;
  return <article innerHTML={source} />
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

Plain JSX text is static escaped text. Dynamic text is just a normal
`{expression}`. When you need explicit string coercion, write it in JavaScript
with `String(value)`, `value + ''`, or a typed string value.

```ripple
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

```ripple
export function App() {
  const markup = '<span>Not HTML</span>';
  // Renders the literal string "<span>Not HTML</span>" as text
  return <div>{markup}</div>
}
```

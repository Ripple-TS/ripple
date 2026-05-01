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

To define a component in Ripple, we can use the `component` keyword, in place of
where we'd normally use a `function` keyword. Internally, Ripple's compiler will
transform that into a function that it can call.

```ripple
component Hello() {
  <span>"Hello World!"</span>
}
```

::: info Notice Anything Missing? The lack of a return statement, unlike a
(functional-style) JSX component isn't erroneous. As explained above, templates
are statements rather than expressions, unlike JSX. We'll explore what you can do
with that later!
:::

## Caveat: Templates Must be within Components

Unlike JSX, Ripple's regular templates are statement-based and can only appear
within the body of a component. If you need JSX in expression position, use the
`<tsx>...</tsx>` wrapper covered below. This design keeps normal component
templates distinct from regular JavaScript logic while still providing an escape
hatch when you need to store, return, or pass JSX as a value.

```ripple
// ❌ Wrong - Plain templates outside the component
const element = <div>"Hello"</div>;  // Compilation error

function regularFunction() {
	return <span>"Not allowed"</span>;  // Compilation error
}

const myTemplate = (
	<div>"Cannot assign JSX"</div>  // Compilation error
);

// ✅ Correct - Templates only inside components
component MyComponent() {
	// Template syntax is valid here
  <div>"Hello World"</div>

	// You can have JavaScript code mixed with templates
	const message = "Dynamic content";
	console.log("This JavaScript works");

	<p>{message}</p>
}

// ✅ Correct - Helper functions can return data
function getMessage() {
	return "Hello from function";  // Return data, not JSX
}

component App() {
	<div>{getMessage()}</div>  // Use function result in template
}
```

## Using `<tsx>` for JSX Expression Values

Use `<tsx>...</tsx>` when JSX needs to exist in expression position rather than as
a normal template statement. This is useful when you want to assign JSX to a
variable, return it from a helper, or pass it directly as a prop or child.

```ripple
// ✅ Correct - Store JSX in a variable
component App() {
  const title = <tsx>
    <span class="title">
      "Settings"
    </span>
  </tsx>;

  <header>{title}</header>
}

// ✅ Correct - Return JSX from a helper function
function createBadge(label: string) {
  return <tsx>
    <span class="badge">
      {label}
    </span>
  </tsx>;
}

component App() {
  {createBadge('New')}
}

// ✅ Correct - Pass JSX directly as props
component Card(props: { title: any; children: any }) {
  <section>
    <h2>{props.title}</h2>
    <div>{props.children}</div>
  </section>
}

component App() {
  <Card
    title={<tsx>
      <span>
        "Settings"
      </span>
    </tsx>}
    children={<tsx>
      <p>
        "Card body"
      </p>
    </tsx>}
  />
}
```

### `<tsx>` vs `<tsx:react>`

- `<tsx>` keeps Ripple syntax and Ripple rendering semantics.
- `<tsx:react>` switches to React JSX semantics and requires compat setup.

Use plain `<tsx>` when you want a Ripple renderable value. Use `<tsx:react>` only
when you are intentionally embedding React.

## Early Returns in Components

Ripple supports early exits from component/template execution via guard clauses.
Use `return;` to stop evaluating the rest of the current render path after a
condition is met.

```ripple
component Profile({ user }) {
  if (!user) {
    <p>"Please sign in to continue."</p>
    return;
  }

  <h1>{user.name}</h1>
  <p>{user.email}</p>
}
```

**Rules:**

- Use only `return;` (without a value) inside component/template scopes.
- `return` with a value (for example `return 'x'` or `return <div />`) is a
  compile error.
- `return` is not allowed at module top level.
- `return` is a control-flow exit, not a JSX return value mechanism.

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
component TemplateScope() {
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
- Template variables don't leak to the component function scope

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
injections. If you'd like to render trusted HTML onto your page, you can use the
HTML directive to opt-out:

```ripple
export component App() {
  let source = `
<h1>My Blog Post</h1>
<p>Hi! I like JS and Ripple.</p>
`;

  <article>{html source}</article>
}
```

::: info Note The raw HTML passed in should be valid, well-formed HTML. The
following example will not work, since closing tags by themselves are considered
malformed HTML.

```ripple
{html '<div>'}content{html '</div>'}
```

:::

### Styling Raw HTML

As raw HTML is not managed by Ripple, scoped styles do not apply to it. To style
raw content, refer to [Styling](/docs/guide/styling#Global-Styles).

## Explicit Text

Direct double-quoted children are static escaped text. By default, a
`{expression}` in a template can render either text or a fragment. If you know
the expression will always be text, you can use the `{text}` directive to make
that explicit:

```ripple
export component Frame({ children }) {
  <div class="frame">
    {text 'before'}
    {children}
    {text 'after'}
  </div>
}
```

The `{text}` directive guarantees the expression is treated as text content. Like
regular expressions, the value is HTML-escaped to prevent script injections.
Unlike `{html}`, the content is never parsed as HTML.

This is particularly useful when you have text alongside `{children}`, since the
compiler can optimize `{text}` expressions more efficiently than general
expressions that might need to handle component rendering.

```ripple
export component App() {
  const markup = '<span>Not HTML</span>';

  // Renders the literal string "<span>Not HTML</span>" as text
  <div>{text markup}</div>
}
```

::: info `text` is a reserved keyword in Ripple expressions. You cannot use `text`
as a variable name inside `{braces}`. If you need a variable called `text`, rename
it or use a different name.
:::

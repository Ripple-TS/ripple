# @tsrx/core

**TypeScript Render Extensions (TSRX)** — the shared parser and compiler
infrastructure that powers TypeScript UI frameworks.

`@tsrx/core` is framework-agnostic. It provides the parser, AST definitions, scope
analysis, and code-generation utilities needed to target _any_ framework runtime
using Ripple's syntax. Framework-specific packages (such as
[`@tsrx/ripple`](../tsrx-ripple)) build on top of `@tsrx/core` to produce the
runtime output for Ripple.

## What is TSRX?

TSRX is an extension to TypeScript's syntax — in the same spirit that JSX is an
extension to JavaScript. It adds a small set of orthogonal syntactic forms that
are ergonomic for describing reactive UI, and leaves the semantics of those forms
to the consuming framework.

A `.tsrx` file is a TypeScript module with TSRX enabled.

## Installation

```bash
pnpm add @tsrx/core
```

## Usage

```js
import { parseModule } from '@tsrx/core';

const ast = parseModule(source, 'App.tsrx');
```

The parser produces an ESTree-compatible AST, augmented with the TSRX node types
listed below. Framework compilers walk this AST to emit their own output.

## TSRX Specification (draft)

TSRX is a superset of TypeScript. All valid TypeScript is valid TSRX. TSRX adds
the following productions.

### 1. `component` declarations

A `component` is a new top-level and expression-level declaration form. It has the
same shape as a function declaration, but is a distinct AST node (`Component`) so
that framework compilers can treat it specially.

```tsx
component Button(props: Props) {
  <button>{props.label}</button>
}
```

- `component` may be used wherever `function` may be used (declaration,
  expression, default export).
- The body of a `component` may contain JSX-like elements as statements — see §3.
- `component` is a contextual keyword. Use as an identifier is preserved in
  non-declaration positions.

### 2. JSX-as-statements

Inside a `component` body, JSX elements are valid _statement_ forms. They describe
rendered output and are not expressions — they have no value. Static text may be
written as a direct double-quoted child; dynamic values and other JavaScript
expressions stay inside `{}`.

```tsx
component Greeting() {
  <h1>"Hello"</h1>
  <p>"Welcome"</p>
}
```

Only double quotes have direct-child text meaning. Single-quoted strings and
template literals remain JavaScript expressions and must be written inside `{}`.

Elsewhere (outside a `component` body), JSX remains an expression, as in standard
JSX.

### 4. Control-flow statements in `component` bodies

Inside a `component` body, the standard JavaScript control-flow keywords `if`,
`else`, `for`, `switch`, and `try` gain an additional role: their branches may
contain JSX-as-statements (§2) describing conditionally- or repeatedly-rendered
output. The keywords retain their usual JavaScript syntax — no new grammar is
introduced — but framework compilers treat them as _reactive_ boundaries.

```tsx
component List(props: { items: Item[]; showHeader: boolean }) {
  if (props.showHeader) {
    <h1>"Items"</h1>
  } else {
    <h2>"(no header)"</h2>
  }

  for (const item of props.items) {
    <li>{item.name}</li>
  }

  switch (props.items.length) {
    case 0:
      <p>"empty"</p>
      break;
    default:
      <p>"has items"</p>
  }

  try {
    <AsyncThing />
  } catch (e) {
    <pre>{String(e)}</pre>
  }
}
```

**Early returns.** A bare `return;` (or `return` at the end of a branch) is a
valid statement inside a `component` body and short-circuits any remaining
rendering in the current branch. This composes naturally with the control-flow
forms above:

```tsx
component Page(props: { user: User | null }) {
  if (props.user == null) {
    <LoginPrompt />
    return;
  }

  <Dashboard user={props.user} />
}
```

Because a `component` body does not produce a value, `return` never carries an
expression — it only marks a rendering short-circuit.

**Nesting inside elements.** Control-flow statements may appear directly as
children of a JSX element, not only at the top level of the component body. Their
branches contribute children to the enclosing element in source order:

```tsx
component Menu(props: { items: Item[]; loading: boolean }) {
  <ul>
    if (props.loading) {
      <li>{'loading…'}</li>
    } else {
      for (const item of props.items) {
        <li>
          <a href={item.href}>{item.label}</a>
          if (item.badge) {
            <span class="badge">{item.badge}</span>
          }
        </li>
      }
    }
  </ul>
}
```

Any control-flow form that is legal at the component-body level is also legal as a
child of a JSX element, and may be nested to arbitrary depth.

TSRX only describes what is syntactically permitted. The reactive semantics
(dependency tracking, list reconciliation, error boundaries, suspense) are the
responsibility of the framework compiler.

### 5. JSX escape hatch: `<tsx>...</tsx>`

Because JSX inside a `component` body is a _statement_ (§2), the element itself
has no value. To embed regular _expression_-form JSX — e.g. when a third-party
library accepts a JSX tree as a value — wrap it in the reserved `<tsx>` element.
Its children are parsed as standard JSX expressions and the whole form evaluates
to the JSX expression value (or an array of values if there are multiple
children).

```tsx
component Page() {
  const header = <tsx><h1>Hello</h1></tsx>;
  renderSomewhereElse(header);
}
```

`<tsx>` is a reserved tag name in TSRX. It has no runtime representation of its
own — the framework compiler unwraps it into the underlying JSX expression.

### 6. Lazy destructuring: `&[]` and `&{}`

Two new destructuring forms prefixed with `&` bind by _reference_ rather than by
value. Each bound name compiles to a lazy property lookup on the source, so reads
and writes are deferred to the use-site.

```tsx
let &[count] = source;        // array-style lazy destructure
let &{ name, age } = props;   // object-style lazy destructure
```

Semantics are provided by the framework compiler. TSRX only defines the syntax and
the AST shape (`kind: 'lazy'` binding patterns).

### 7. `#server` blocks

A `#server { ... }` block marks a lexical region whose contents are intended for
the server compile target. TSRX parses the block and records its exports;
framework compilers decide how to emit or strip it per target.

```ts
#server {
  export async function load() { /* ... */ }
}
```

### 8. `#style` identifier

`#style` is a reserved identifier that refers, at compile time, to the set of
scoped CSS classes declared in the current module. It is legal only in positions
where the framework compiler expects a class-name value.

```tsx
<div class={#style.card} />
```

### 9. Scoped CSS blocks

A `component` may contain a trailing CSS block (delimited by the framework
compiler's chosen grammar). The block is parsed into a `CSS.StyleSheet` AST node
and hashed for scoping.

## What `@tsrx/core` provides

- **`parseModule(source, filename, options?)`** — parse a TSRX module into an
  ESTree AST.
- **Scope analysis** — `createScopes`, `Scope`, `ScopeRoot`, binding tracking
  (`import`, `prop`, `let`, `const`, `function`, `component`, `for_pattern`, …).
- **AST utilities** — pattern walkers, identifier extraction, builders, location
  helpers, obfuscation helpers.
- **CSS support** — `parseStyle`, `analyzeCss`, `renderStylesheets`.
- **HTML helpers** — `isVoidElement`, `isBooleanAttribute`, `isDomProperty`,
  `validateNesting`.
- **Event helpers** — delegated-event utilities, event-name normalization.
- **Source maps** — `convertSourceMapToMappings`.

See `src/index.js` for the full exported surface.

## Non-goals

- `@tsrx/core` does **not** emit runtime code. Code generation lives in framework
  packages (e.g. `@tsrx/ripple`).
- `@tsrx/core` does **not** ship a runtime. There is no reactivity, rendering, or
  DOM code here.
- `@tsrx/core` does **not** lock consumers to a specific output format. Multiple
  compile targets can share the same parser and analysis.

## License

MIT © Dominic Gannaway

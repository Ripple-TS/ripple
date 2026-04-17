# @tsrx/core

**TypeScript Ripple Extensions (TSRX)** — the shared parser and compiler
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
rendered output and are not expressions — they have no value.

```tsx
component Greeting() {
  <h1>{'Hello'}</h1>
  <p>{'Welcome'}</p>
}
```

Elsewhere (outside a `component` body), JSX remains an expression, as in standard
JSX.

### 3. Lazy destructuring: `&[]` and `&{}`

Two new destructuring forms prefixed with `&` bind by _reference_ rather than by
value. Each bound name compiles to a lazy property lookup on the source, so reads
and writes are deferred to the use-site.

```tsx
let &[count] = source;        // array-style lazy destructure
let &{ name, age } = props;   // object-style lazy destructure
```

Semantics are provided by the framework compiler. TSRX only defines the syntax and
the AST shape (`kind: 'lazy'` binding patterns).

### 4. `#server` blocks

A `#server { ... }` block marks a lexical region whose contents are intended for
the server compile target. TSRX parses the block and records its exports;
framework compilers decide how to emit or strip it per target.

```ts
#server {
  export async function load() { /* ... */ }
}
```

### 5. `#style` identifier

`#style` is a reserved identifier that refers, at compile time, to the set of
scoped CSS classes declared in the current module. It is legal only in positions
where the framework compiler expects a class-name value.

```tsx
<div class={#style.card} />
```

### 6. Scoped CSS blocks

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

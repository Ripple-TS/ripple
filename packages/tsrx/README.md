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

## Language docs

The TSRX website is the canonical source for language documentation:

- [Getting Started](https://tsrx.dev/getting-started) — install TSRX for React,
  Preact, Solid, Vue, or Ripple and configure editor/AI tooling.
- [Features](https://tsrx.dev/features) — examples of components, statement
  templates, control flow, scoped styles, submodules, and lazy destructuring.
- [Specification](https://tsrx.dev/specification) — the current grammar and
  parser-level semantics.

Keeping the language reference on the website avoids duplicating the specification
here and keeps package docs focused on the core parser API.

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

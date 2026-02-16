# Ripple Project Guide for AI Agents

Ripple is a TypeScript UI framework that combines the best parts of React, Solid,
and Svelte. Created by Dominic Gannaway ([@trueadm](https://github.com/trueadm)),
Ripple is designed to be JS/TS-first with its own `.ripple` file extension that
fully supports TypeScript.

## Documentation

For comprehensive Ripple syntax, components, reactivity, and API documentation,
see:

- **[website/public/llms.txt](website/public/llms.txt)** - Full LLM-optimized
  documentation
- **[README.md](README.md)** - Project overview and quick start
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Contribution guidelines

## Project Structure

This is a pnpm monorepo. Key packages are marked with `*`.

```
packages/
├── ripple/*                    # Core framework
│   └── src/
│       ├── compiler/           # Compilation pipeline (see Compiler Architecture)
│       │   ├── phases/
│       │   │   ├── 1-parse/    # Acorn-based parser with RipplePlugin
│       │   │   ├── 2-analyze/  # Scope analysis, CSS pruning, validation
│       │   │   └── 3-transform/# Client/server code generation
│       │   ├── scope.js        # Scope and binding management
│       │   ├── types/          # AST type definitions
│       │   └── utils.js        # Compiler utilities
│       ├── runtime/            # Runtime library (see Runtime Architecture)
│       │   ├── internal/
│       │   │   ├── client/     # DOM operations, reactivity, events
│       │   │   └── server/     # SSR string generation
│       │   ├── index-client.js # Client entry (browser)
│       │   └── index-server.js # Server entry (SSR)
│       └── server/             # Server-side rendering utilities
├── language-server/*           # LSP implementation via Volar framework
├── vscode-plugin/*             # VS Code extension (uses language-server)
├── typescript-plugin/*         # TypeScript language service plugin
├── eslint-plugin/*             # ESLint rules for Ripple
├── eslint-parser/*             # ESLint parser for .ripple files
├── prettier-plugin/*           # Prettier formatting support
├── vite-plugin/*               # Vite build integration
├── rollup-plugin/              # Rollup build integration
├── cli/*                       # CLI tool (@ripple-ts/cli)
├── create-ripple/              # Project scaffolding (npx create-ripple)
├── compat-react/*              # React interoperability layer
├── tree-sitter/*               # Tree-sitter grammar for syntax highlighting
├── intellij-plugin/            # IntelliJ/WebStorm support
├── nvim-plugin/                # Neovim support
├── sublime-text-plugin/        # Sublime Text support
├── zed-plugin/                 # Zed editor support
└── textmate/                   # TextMate grammar (shared by editors)

playground/                     # Development playground
website/                        # Documentation website
templates/                      # Project templates (basic, etc.)
scripts/                        # Build and maintenance scripts
```

## Compiler Architecture

The compiler transforms `.ripple` files through three phases:

```
Source Code (.ripple) → Parse → Analyze → Transform → Output (JS + CSS)
```

### Phase 1: Parse (`packages/ripple/src/compiler/phases/1-parse/`)

**Parser:** Acorn extended with `@sveltejs/acorn-typescript` and custom
`RipplePlugin`

**Ripple-specific syntax handled:**

- `component` keyword for component declarations
- JSX with special handling for `@` tracked expressions
- `#server` blocks for server-only code
- `#[]` (TrackedArray), `#{}` (TrackedObject), `#Map()`, `#Set()` shorthand
- `#style` identifier for scoped CSS classes

**Output:** ESTree-compatible AST with Ripple extensions

### Phase 2: Analyze (`packages/ripple/src/compiler/phases/2-analyze/`)

| File             | Purpose                                         |
| ---------------- | ----------------------------------------------- |
| `index.js`       | Main analysis orchestration                     |
| `css-analyze.js` | CSS selector analysis, `:global()` handling     |
| `prune.js`       | Remove unused CSS rules based on template usage |
| `validation.js`  | HTML nesting validation                         |

**Key operations:**

- **Scope creation:** `scope.js` creates scope chains tracking bindings (import,
  prop, let, const, function, component, for_pattern)
- **Reactivity analysis:** Marks tracked expressions, derives tracking metadata
- **CSS scoping:** Hash-based class names via `CSS_HASH_IDENTIFIER`
- **Server block analysis:** Tracks exports from `#server` blocks

### Phase 3: Transform (`packages/ripple/src/compiler/phases/3-transform/`)

**Client transform** (`client/index.js`):

- Generates runtime calls: `_$_.render()`, `_$_.if()`, `_$_.for()`,
  `_$_.switch()`, etc.
- Creates template strings for static HTML
- Sets up event delegation
- Injects CSS hash for scoped styles

**Server transform** (`server/index.js`):

- Generates string concatenation for SSR output
- Handles `#server` block code execution
- Registers CSS for hydration

### Key AST Node Types (`packages/ripple/src/compiler/types/`)

| Node Type                 | Description                                              |
| ------------------------- | -------------------------------------------------------- |
| `Component`               | Component declaration with `id`, `params`, `body`, `css` |
| `Element`                 | HTML/SVG element with `id`, `attributes`, `children`     |
| `Text`                    | Text node wrapping an expression                         |
| `ServerBlock`             | `#server { ... }` block with exports tracking            |
| `TrackedExpression`       | `@expression` tracked reactive value                     |
| `TrackedArrayExpression`  | `#[...]` tracked array literal                           |
| `TrackedObjectExpression` | `#{...}` tracked object literal                          |
| `Attribute`               | Element attribute with `name`, `value`, `shorthand`      |
| `RefAttribute`            | `ref={...}` reference binding                            |
| `SpreadAttribute`         | `{...props}` spread                                      |
| `CSS.StyleSheet`          | Parsed CSS with `hash` for scoping                       |

## Runtime Architecture

### Client Runtime (`packages/ripple/src/runtime/internal/client/`)

| Module          | Responsibility                                                                  |
| --------------- | ------------------------------------------------------------------------------- |
| `runtime.js`    | Core reactivity: `tracked()`, `derived()`, `get()`, `set()`, block scheduling   |
| `blocks.js`     | Block creation: `render()`, `branch()`, `effect()`, `root()`, `destroy_block()` |
| `render.js`     | DOM operations: `set_text()`, `set_class()`, `set_style()`, `set_attribute()`   |
| `template.js`   | Template instantiation: `template()`, `append()`, `assign_nodes()`              |
| `operations.js` | DOM traversal: `child()`, `sibling()`, `create_text()`                          |
| `events.js`     | Event handling: `event()`, `delegate()`, event propagation                      |
| `hydration.js`  | SSR hydration: `hydrating`, `hydrate_node`, `hydrate_next()`                    |
| `bindings.js`   | Two-way bindings for form elements                                              |
| `context.js`    | Context API implementation                                                      |

### Control Flow Blocks

| Block          | File           | Purpose                                                 |
| -------------- | -------------- | ------------------------------------------------------- |
| `if_block`     | `if.js`        | Conditional rendering with branch switching             |
| `for_block`    | `for.js`       | List rendering with reconciliation (ref-based or keyed) |
| `switch_block` | `switch.js`    | Multi-branch rendering                                  |
| `try_block`    | `try.js`       | Error boundaries + async suspense                       |
| `composite`    | `composite.js` | Dynamic component rendering (`<@Component />`)          |
| `portal`       | `portal.js`    | Render children to different DOM location               |

### Reactivity System

**Core concepts:**

- `tracked(value, block)` - Creates a tracked reactive value (`Tracked<V>`)
- `derived(fn, block)` - Creates a computed/derived value
- `get(tracked)` - Reads value, registers dependency
- `set(tracked, value)` - Updates value, schedules updates

**Implementation details:**

- Dependencies tracked via linked list structure: `{ c, t, n }` (consumer,
  tracked, next)
- Dirty checking with clock-based versioning
- Block flags in `constants.js`: `ROOT_BLOCK`, `RENDER_BLOCK`, `EFFECT_BLOCK`,
  `BRANCH_BLOCK`, etc.

### Reactive Collections (`packages/ripple/src/runtime/`)

| Collection      | File        | Description                                 |
| --------------- | ----------- | ------------------------------------------- |
| `TrackedArray`  | `array.js`  | Fully reactive array with all Array methods |
| `TrackedObject` | `object.js` | Shallow reactive object                     |
| `TrackedMap`    | `map.js`    | Reactive Map                                |
| `TrackedSet`    | `set.js`    | Reactive Set                                |
| `TrackedDate`   | `date.js`   | Reactive Date                               |

### Server Runtime (`packages/ripple/src/runtime/internal/server/`)

- String-based output via `Output` class (concatenates `head` and `body`)
- Simplified reactivity (no block scheduling, immediate execution)
- CSS registration for hydration markers
- Escape utilities for safe HTML output

## Language Server (`packages/language-server/src/`)

Built on **Volar framework** with TypeScript integration.

| Plugin         | File                              | Purpose                           |
| -------------- | --------------------------------- | --------------------------------- |
| Completion     | `completionPlugin.js`             | Auto-completion for Ripple syntax |
| Definition     | `definitionPlugin.js`             | Go-to-definition                  |
| Hover          | `hoverPlugin.js`                  | Hover information                 |
| Diagnostics    | `compileErrorDiagnosticPlugin.js` | Compile-time error diagnostics    |
| TS Diagnostics | `typescriptDiagnosticPlugin.js`   | TypeScript diagnostic filtering   |
| Auto-insert    | `autoInsertPlugin.js`             | Auto-insert completions           |
| Highlight      | `documentHighlightPlugin.js`      | Document highlights               |

**Integration:** Uses `@ripple-ts/typescript-plugin` for TypeScript language
service.

## Editor Plugins

All editor plugins use `@ripple-ts/language-server` internally:

| Editor            | Package                | Notes                            |
| ----------------- | ---------------------- | -------------------------------- |
| VS Code           | `vscode-plugin/`       | Primary development target       |
| IntelliJ/WebStorm | `intellij-plugin/`     | TextMate syntax + LSP via LSP4IJ |
| Neovim            | `nvim-plugin/`         | Tree-sitter + LSP                |
| Sublime Text      | `sublime-text-plugin/` | LSP package                      |
| Zed               | `zed-plugin/`          | Tree-sitter queries              |

**Tree-sitter queries:** Located in `packages/tree-sitter/queries/`, copied to
nvim/zed plugins via `pnpm copy-tree-sitter-queries`.

## Validating Changes

**CRITICAL: Use pnpm for all package management. Do NOT use npm or yarn.**

### Required Validation Steps

After making changes, run these commands:

```bash
# Install dependencies (if needed)
pnpm install

# Format code with Prettier
pnpm format

# Check formatting without changes
pnpm format:check

# Run all tests
pnpm test

# Run specific test project
pnpm test --project ripple-client
pnpm test --project ripple-server
pnpm test --project eslint-plugin
pnpm test --project prettier-plugin
```

### Test Projects (from `vitest.config.js`)

| Project            | Tests                                           | Environment |
| ------------------ | ----------------------------------------------- | ----------- |
| `ripple-client`    | `packages/ripple/tests/client/**/*.test.ripple` | jsdom       |
| `ripple-server`    | `packages/ripple/tests/server/**/*.test.ripple` | node        |
| `ripple-hydration` | `packages/ripple/tests/hydration/**/*.test.js`  | jsdom       |
| `eslint-plugin`    | `packages/eslint-plugin/tests/**/*.test.ts`     | jsdom       |
| `eslint-parser`    | `packages/eslint-parser/tests/**/*.test.ts`     | jsdom       |
| `prettier-plugin`  | `packages/prettier-plugin/src/*.test.js`        | jsdom       |
| `cli`              | `packages/cli/tests/**/*.test.js`               | jsdom       |
| `compat-react`     | `packages/compat-react/tests/**/*.test.ripple`  | jsdom       |

### Development Playground

```bash
cd playground
pnpm dev        # Start dev server (Vite)
pnpm lint       # Lint playground code
```

## Code Conventions

### Package Manager

**pnpm is required** (`engines` in package.json enforces this). Do NOT use npm or yarn.

### Language & Types

- **Internal code:** JavaScript (`.js`) with JSDoc type annotations — NOT TypeScript
- **Type definitions:** TypeScript `.d.ts` files in `types/` directories for public API
- **JSDoc imports:** Use `@import` syntax at top of file:
  ```javascript
  /** @import { Block, Tracked, Derived } from '#client' */
  /** @import * as AST from 'estree' */
  ```
- **JSDoc annotations:** Use `@param`, `@returns`, `@type` for all functions:
  ```javascript
  /**
   * @param {Block} block - The block to destroy
   * @returns {void}
   */
  export function destroy_block(block) { ... }
  ```

### Naming Conventions

| Context              | Style                  | Examples                                    |
| -------------------- | ---------------------- | ------------------------------------------- |
| Variables            | `snake_case`           | `active_block`, `is_mutating_allowed`       |
| Functions            | `snake_case`           | `create_scopes`, `set_active_block`         |
| Constants            | `SCREAMING_SNAKE_CASE` | `ROOT_BLOCK`, `FLUSH_MICROTASK`, `DERIVED`  |
| Files                | `kebab-case`           | `css-analyze.js`, `source-map-utils.js`     |
| Component files      | `PascalCase`           | `Button.ripple`, `TodoList.ripple`          |
| Classes              | `PascalCase`           | `Scope`, `TrackedArray`, `Output`           |
| Type parameters      | Single uppercase       | `V` in `Tracked<V>`, `T` in generics        |

### Hot Path Optimizations

In performance-critical runtime code, short property names are used to minimize bundle size:

```javascript
// Block structure uses short names
block.p  // parent
block.t  // teardown function
block.d  // dependencies
block.f  // flags
block.s  // state
block.c  // context
```

### General Guidelines

1. **Consistency:** Look for similar implementations before adding new code
2. **No abbreviations** in variable names (except hot path optimizations above)
3. **Prefer `const`** over `let` when value won't be reassigned
4. **Use `var`** only in specific runtime hot paths for performance
5. **Comments:** Add comments for complex logic, not obvious code

## Tips for Working with the Codebase

### Compiler work

- Parser changes go in `phases/1-parse/`, modify `RipplePlugin` for new syntax
- Scope-related changes in `scope.js` - track bindings with appropriate `kind`
- CSS changes: `css-analyze.js` for parsing, `prune.js` for dead code elimination
- Code generation: separate files for `client/` and `server/` transforms

### Runtime work

- Reactivity: `runtime.js` is the core, understand
  `tracked()`/`derived()`/`get()`/`set()`
- New control flow: add to both client (`internal/client/`) and may need server
  support
- DOM operations: `render.js` for attribute/text updates, `operations.js` for
  traversal
- Events: delegation in `events.js`, check `DELEGATED_EVENTS` constant

### Editor plugins

- Language server plugins in `packages/language-server/src/`
- VS Code extension entry: `packages/vscode-plugin/src/extension.js`
- TypeScript plugin: `packages/typescript-plugin/src/` for IDE integration

### Testing

- Client tests: create `.test.ripple` files in `packages/ripple/tests/client/`
- Server tests: create `.test.ripple` files in `packages/ripple/tests/server/`
- Use `setup-client.js` / `setup-server.js` for test environment setup

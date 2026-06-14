> ⚠️ **HISTORICAL / SUPERSEDED — do not use as a current source of truth.**
>
> This is a pre-implementation "Phase 1" handoff written before the compiler
> existed. The migration it plans is now **fully shipped**: the compiler is
> implemented (`src/compile.js`), `switchBlock` and scoped CSS / `@if` / `@for` /
> portals all work, and there is a full test suite (`tests/compile.test.js` plus
> `packages/ripple-new/tests/`). Nearly every concrete statement below is now
> stale — wrong package path, wrong `@tsrx/core` version (it is pinned at
> `0.1.29`, not `0.1.25`), `switchBlock` described as an unimplemented stub, and
> references to files that never existed (`src/dynamic.ts`, `__tests__/`,
> `_legacy/`). Retained only for historical context.
>
> For current docs see [`README.md`](./README.md) and
> [`packages/ripple-new/README.md`](../ripple-new/README.md).

# TSRX Migration — Phase 1 Findings & Checklist

Branch: `tsrx-migration` Bumped: `@tsrx/core` `^0.1.13` → `^0.1.25` Baseline:
**23/23 test files fail at parse time** on the same construct (`component` keyword
removal). No file currently reaches `compile.js`.

---

## What landed in Phase 1

- `@tsrx/core` bumped to `^0.1.25` in `packages/ripple-new/package.json`.
- All 32 `.tsrx` files snapshotted into sibling `_legacy/` directories (23
  fixtures + 2 benchmarks + 7 hacker-news).
- `scripts/inspect-ast.js` — parse-shape harness. Run as
  `node scripts/inspect-ast.js <file.tsrx> [--tail NodeType]` to dump the new AST.
- `scripts/_phase1_probe*.tsrx` — minimal source samples that parse cleanly under
  0.1.25 and exercise every construct we need (`@if`, `@for`,
  `@try`/`@catch`/`@pending`, `@switch`/`@case`/`@default`, `ref` attr,
  `innerHTML` attr, `<style>`, `createPortal`, lazy destructure, sub-template
  arrow).
- `__tests__/_fixtures/basic.tsrx` hand-ported to new syntax (parses cleanly,
  doesn't compile yet — Phase 3).
- `src/dynamic.ts` — `Dynamic({ is, ...rest })` helper that replaces the removed
  `<@dynamic>` element form.
- `runtime.ts` — `switchBlock(...)` skeleton, exported from `src/index.ts`. Body
  throws "not yet implemented (Phase 1 skeleton)"; Phase 3 fills it in.

---

## Confirmed AST shapes (verified against `@tsrx/core@0.1.25`)

### Component body

```
FunctionDeclaration { id, params, body: JSXCodeBlock { body: Statement[], render: Node | null } }
```

A `function` whose body is a `JSXCodeBlock` IS a component. `body` is setup
statements; `render` is the JSX template returned. The `@{` syntax just opens a
`JSXCodeBlock`.

### Element (in `@{}` body)

```
JSXElement {
  metadata: { native_tsrx: true, templateMode: 'template' | 'script', ... },
  openingElement: JSXOpeningElement { name: JSXIdentifier, attributes: JSXAttribute[] },
  closingElement,
  children: (JSXElement | JSXExpressionContainer | JSXText | JSXIfExpression | ...)[]
}
```

Same `JSXElement` type as standard JSX, but **flagged `native_tsrx: true` via
`metadata`**. We branch on `metadata.native_tsrx` to know we're in template mode.

### Text at child position

`{'literal'}` and `{expr as string}` BOTH parse as `JSXExpressionContainer`.
There's no dedicated `Text` node emitted in this case — we use
`is_stringish_expression`-style walking to decide whether to emit the text
fast-path:

- `TSAsExpression`/`TSTypeAssertion` with `typeAnnotation: TSStringKeyword` ⇒
  definitely text
- String `Literal` ⇒ definitely text
- `TemplateLiteral` ⇒ definitely text
- Otherwise ⇒ fall back to runtime `String(value)` coercion (current `setText`
  path)

### `@if`

```
JSXIfExpression {
  test: Expression,
  consequent: BlockStatement,
  alternate: BlockStatement | null
}
```

`consequent.body` and `alternate.body` are arrays of statements — typically a
single `JSXElement` each. Lowers to
`ifBlock(scope, slot, host, test, thenBody, elseBody)`.

### `@for`

```
JSXForExpression {
  await: boolean,                     // we ignore (Phase 1: error if true)
  left: VariableDeclaration,          // const x of …
  right: Expression,                  // … of right
  index: Identifier | null,           // ; index i
  key: Expression | null,             // ; key x.id
  body: BlockStatement,
  empty: BlockStatement | null
}
```

Header order is `; index i; key x.id` (index first, then key). `key` and `index`
are now first-class fields — we don't have to parse them off the for-of statement
header ourselves.

Lowers to our existing
`forBlock(scope, slot, host, items, getKey, body, extra, flags, deps)` with all
the perf flags + auto-callback + dep-array we layered on top.

### `@try` / `@catch` / `@pending`

```
JSXTryExpression {
  block: BlockStatement,                            // success path
  handler: CatchClause {                            // @catch (err) { … }
    param: Identifier | null,
    body: BlockStatement,
    resetParam?: Pattern | null                     // @catch (err, reset) { … }
  } | null,
  finalizer: BlockStatement | null,                 // standard JS @finally
  pending: BlockStatement | null                    // Suspense fallback
}
```

Must sit **inside a JSX-child position** (e.g. inside a `<>...</>` fragment) — not
at the top of a `@{}` body. Lowers to our existing `tryBlock`.

### `@switch` / `@case` / `@default`

```
JSXSwitchExpression {
  discriminant: Expression,
  cases: SwitchCase[] {
    test: Expression | null,        // null for @default
    consequent: Statement[]         // typically one JSXElement
  }
}
```

Same shape as standard ES `SwitchCase`. Note `case` becomes `@case`, `default`
becomes `@default` inside `@switch`. Lowers to our new
`switchBlock(scope, slot, host, discriminant, [[test, body], …], defaultBody)`.

### `<style>`

```
JSXStyleElement {
  metadata: {
    styleScopeHash: 'tsrx-xxxxxxx',     // pre-computed by parser
    native_tsrx: true,
    templateMode: 'script',
  },
  children: StyleSheet[]                // pre-parsed CSS AST (csstree-shaped)
}
```

The parser pre-computes the hash AND parses the CSS into a structured AST. We feed
it to `@tsrx/core`'s `prepareStylesheetForRender` + `renderStylesheets` to get the
final hashed CSS string + class-rewrite mapping. Drops ~150 lines of ad-hoc
hashing/scoping from our current compile.js.

### Refs and innerHTML

Old `{ref expr}` and `{html expr}` child-position intrinsics are gone. New form is
attribute-level:

- `<div ref={r} />` — `JSXAttribute` with `name.name === 'ref'`
- `<div innerHTML={h} />` — `JSXAttribute` with `name.name === 'innerHTML'`

Handlers: existing ref binding logic in compile.js needs to move from the
child-position branch to the attribute branch. innerHTML similarly: when we see a
static-only-child template AND there's an `innerHTML` attribute, take the existing
only-child innerHTML emit path.

### Lazy destructure

`&{ a, b }` and `&[head, ...tail]` STILL PARSE. The parser stores lazy markers in
`metadata`; we lean on `@tsrx/core`'s `createLazyContext` + `preallocateLazyIds` +
`applyLazyTransforms` to do the lowering. Our current hand-rolled lazy handling
deletes.

### Sub-template arrow (replaces `<tsrx>...</tsrx>`)

```
ArrowFunctionExpression { body: JSXCodeBlock }
```

An arrow whose body is a `JSXCodeBlock` is the new shape for "inline render
function" (used in render-prop patterns, portal bodies, etc.). 4 fixtures use this
pattern via `<tsrx>` blocks today; they'll port to arrows.

### `createPortal(...)` at child position

Unchanged — still a `JSXExpressionContainer` whose `expression` is a
`CallExpression` to the imported `createPortal`. Our existing portal-call
detection works as-is.

---

## Fixture × feature × complexity matrix

23 fixtures + 3 representative apps. Complexity heuristic:

- **Trivial** — only `component`/`{text}` (1-to-1 mechanical rewrite)
- **Small** — adds hooks / `<style>` / static attrs (still mechanical)
- **Medium** — adds `if`/`for`/`try`/portal/sub-template (requires Phase-3 codegen
  work)
- **Heavy** — combines several complex features OR exercises `{html}`/`{ref}`
  attribute migration / `&{}`

| fixture / app                       | features (legacy)                                            | complexity   | notes                                                                                     |
| ----------------------------------- | ------------------------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------- |
| `basic.tsrx`                        | `{text}` SVG MathML                                          | **Trivial**  | Already ported as the Phase 1 specimen.                                                   |
| `fragments.tsrx`                    | `{text}`                                                     | Trivial      |                                                                                           |
| `callbacks.tsrx`                    | `{text}` hooks                                               | Trivial      |                                                                                           |
| `attrs-events.tsrx`                 | `{text}` hooks                                               | Trivial      |                                                                                           |
| `effect-timing.tsrx`                | `{text}` hooks                                               | Trivial      |                                                                                           |
| `hooks.tsrx`                        | `{text}` hooks                                               | Trivial      |                                                                                           |
| `react-conformance.tsrx`            | `{text}` hooks                                               | Trivial      |                                                                                           |
| `components.tsrx`                   | `{text}` `use()` hooks                                       | Small        | Context use — works with body shape change only.                                          |
| `early-return.tsrx`                 | `{text}` `if` hooks                                          | Small        | `if` at statement position → `@if`.                                                       |
| `control.tsrx`                      | `{text}` `if` hooks                                          | Small        | Same.                                                                                     |
| `continue.tsrx`                     | `{text}` `for+key` `if` hooks                                | Small        | `for/if` → `@for/@if`.                                                                    |
| `for.tsrx`                          | `{text}` `for+key` hooks                                     | Small        | `for` → `@for`; header order `; index i; key …`.                                          |
| `try-catch.tsrx`                    | `{text}` `if` `try` hooks                                    | Medium       | `try`/`catch` → `@try`/`@catch`, must wrap in `<>` inside `@{}`.                          |
| `suspense.tsrx`                     | `{text}` `try` `pending` `use()` hooks                       | Medium       | `try`/`pending` → `@try`/`@pending`.                                                      |
| `transitions.tsrx`                  | `{text}` `try` `pending` `use()` hooks                       | Medium       | Same.                                                                                     |
| `nested.tsrx`                       | `{text}` `for+key` `if` `try` hooks                          | Medium       | All control-flow forms.                                                                   |
| `useref.tsrx`                       | `{text}` **`{ref}`** `for+key` `if` hooks                    | Medium       | `{ref expr}` → `ref={expr}` attribute migration.                                          |
| `style.tsrx`                        | `{text}` **`{style}`** `for+key` **`<style>`** `use()` hooks | Heavy        | `{style 'cls'}` removal + `<style>` scoping pipeline swap.                                |
| `portal.tsrx`                       | `{text}` `tsrx-block` `if` `portal` `use()` hooks            | Medium       | `<tsrx>` → arrow; portal call unchanged.                                                  |
| `portal-events.tsrx`                | `{text}` `tsrx-block` `if` `portal` hooks                    | Medium       | Same.                                                                                     |
| `context.tsrx`                      | `{text}` `tsrx-block` `for+key` `if` `portal` `use()` hooks  | Medium       | Same.                                                                                     |
| `tsrx-block.tsrx`                   | `{text}` `tsrx-block` `portal`                               | Medium       | `<tsrx>` → arrow conversion focal test.                                                   |
| `tsrx-features.tsrx`                | `{text}` **`{html}`** `for+key` `for+index` **`&{}`** hooks  | **Heavy**    | `{html}` → `innerHTML` attr + `&{}` lazy + indexed for-of all in one file. Save for last. |
| `benchmarks/ripple-new/Main.tsrx`   | `{text}` `for+key`                                           | Small        | js-framework-benchmark target.                                                            |
| `benchmarks/ripple/Main.tsrx`       | `{text}`                                                     | Trivial      | Side-by-side bench.                                                                       |
| `hacker-news/App.tsrx` + 6 children | `{text}` + various                                           | Small–Medium | Real-world spread; port last after fixtures are green.                                    |

---

## Phase 3 build order (matches the matrix)

The compiler rewrite (Phase 3) should follow this order so each step has tests to
validate it. Each step is a separate commit on `tsrx-migration` and Phase 3
doesn't move on until the tests for that step go green.

1. **Skeleton + component detection**
   - Detect `FunctionDeclaration`/`FunctionExpression`/`ArrowFunctionExpression`
     whose `body` is `JSXCodeBlock`.
   - Wire `@tsrx/core`'s `parseModule` + `createScopes` + `applyLazyTransforms`.
   - Top-level walk via `zimmerframe` instead of our ad-hoc `mapAst`.
   - Pass: `basic.tsrx`, `fragments.tsrx`.

2. **Bindings — static + dynamic text / attrs / class / style / events**
   - `JSXExpressionContainer` at child position → text binding (with
     `is_stringish_expression` for the text-only fast path).
   - `JSXAttribute` with literal vs expression → attr / class / style / event
     binding.
   - Event-bundle compilation for `onClick={() => fn(arg)}`.
   - Pass: `callbacks.tsrx`, `attrs-events.tsrx`, `hooks.tsrx`,
     `effect-timing.tsrx`, `react-conformance.tsrx`.

3. **Components**
   - `JSXElement` whose tag is a capitalised `JSXIdentifier` or
     `JSXMemberExpression` → `componentSlot` call.
   - Pass: `components.tsrx`.

4. **`@if`**
   - `JSXIfExpression` lowering → `ifBlock`.
   - Statement-position `IfStatement` with `metadata.has_template` → same path.
   - Pass: `control.tsrx`, `early-return.tsrx`.

5. **`@for`** — the big one
   - `JSXForExpression` lowering → `forBlock`.
   - **Re-apply every perf optimization**: `pure` flag from purity analysis,
     `singleRoot` detection, `depEligible` + deps-array emission, auto-callback
     rewrite, event-bundle, item-block layout (linked-list ForSlot etc.).
   - Pass: `for.tsrx`, `continue.tsrx`, `nested.tsrx`,
     `benchmarks/ripple-new/Main.tsrx`.
   - **Bench gate**: js-framework-benchmark `swap1k` must match pre-migration
     numbers (~16.5ms median) before moving on.

6. **`@try` / `@catch` / `@pending`**
   - `JSXTryExpression` lowering → `tryBlock`. `pending` field maps to our
     Suspense pending branch.
   - Pass: `try-catch.tsrx`, `suspense.tsrx`, `transitions.tsrx`.

7. **Portal + sub-template arrow**
   - `createPortal(...)` call at child position → `portal(...)`.
   - `ArrowFunctionExpression` body `JSXCodeBlock` → compiled as anonymous render
     function (replaces `<tsrx>` body lowering).
   - Pass: `tsrx-block.tsrx`, `portal.tsrx`, `portal-events.tsrx`, `context.tsrx`.

8. **Attribute-level `ref` + `innerHTML`** (replacing old `{ref}` / `{html}`
   intrinsics)
   - `JSXAttribute` with name `ref` → existing ref binding logic.
   - `JSXAttribute` with name `innerHTML` AND no other dynamic children → existing
     only-child innerHTML fast path.
   - Pass: `useref.tsrx`.

9. **Scoped CSS via `@tsrx/core` pipeline**
   - `JSXStyleElement` → `prepareStylesheetForRender` + `renderStylesheets` +
     `addHashClass` from `@tsrx/core`.
   - Drop our ad-hoc hash-prefix scoper.
   - Pass: `style.tsrx`.

10. **Lazy destructure via `@tsrx/core` pipeline**
    - `createLazyContext` + `preallocateLazyIds` + `applyLazyTransforms` at the
      top of the component-walk.
    - Drop our ad-hoc `&{}` handling.
    - Pass: `tsrx-features.tsrx`.

11. **`@switch`**
    - `JSXSwitchExpression` lowering → `switchBlock`.
    - Implement `switchBlock` runtime (currently stub). Mirror `ifBlock`'s
      branch-swap logic.
    - No fixture covers this yet — add `_fixtures/switch.tsrx` in Phase 3 step 11.

12. **`Dynamic` helper**
    - When the compiler sees a `JSXElement` whose tag identifier resolves to the
      imported `Dynamic`, treat it as a normal component call. No special
      compile-time work; `src/dynamic.ts` does the runtime indirection.

13. **Apps**
    - Port `hacker-news/*.tsrx` and re-verify build.
    - Port `benchmarks/ripple/src/Main.tsrx`.

---

## Risks / open items

- **`async function App() @{ ... }`** support: not in scope per agreed scope.
  Compiler should produce a clear error message for any `async function` whose
  body is `JSXCodeBlock`. Add to step 1.
- **`@case` consequent shape**: confirmed `SwitchCase.consequent: Statement[]`
  containing JSX elements. Need to validate Phase 3 emit for fall-through and
  multi-statement cases.
- **`CatchClause.resetParam`** (`@catch (err, reset)`): new in 0.1.25. We don't
  currently support catch reset; ignore the second arg in Phase 3 v1, surface as a
  TODO.
- **`empty: BlockStatement` on `@for`**: new field — body for the "zero items"
  branch. Phase 3 v1 can ignore (treat as no special handling); add empty-state
  support as a follow-up.
- **`templateMode: 'script'` vs `'template'`**: the parser tells us which
  `JSXElement`s actually emit DOM. We should respect this when planning template
  strings — only `templateMode: 'template'` elements contribute to the cloned
  template HTML.
- **Volar mappings**: still deferred. Add to a follow-up phase once the migration
  ships.

---

## ripple-new runtime: confirmed unchanged surface

The runtime API the compiler emits against (`forBlock`, `ifBlock`, `tryBlock`,
`componentSlot`, `portal`, etc.) does not change in this migration. Phase 3
rewrites compile.js; phase 4 verifies tests + bench. No changes expected to
`src/runtime.ts` beyond the `switchBlock` skeleton implementation (Phase 3
step 11) and the `Dynamic` re-export (already done in Phase 1).

---

## Next handoff

Phase 1 deliverables are on `tsrx-migration`:

```
git log --oneline tsrx-migration ^experiment   # (no commits yet — uncommitted working tree)
git diff --stat                                # see Phase 1 changes
```

To kick off Phase 3, the prompt is:

> "Start Phase 3 step 1 (skeleton + component detection) on `tsrx-migration`.
> Reference `packages/ripple-new/TSRX_MIGRATION.md` for the build order. Don't
> touch fixtures outside the in-progress step; don't merge until step 4 bench gate
> passes."

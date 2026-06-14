# @tsrx/ripple-new

TSRX compiler targeting the [`ripple-new`](../ripple-new) template-clone renderer.
It parses `.tsrx` via `@tsrx/core` and emits JavaScript that calls into the
ripple-new runtime (templates + keyed reconciler + React-shape hooks).

## Exports

- `compile(source, filename)` → `{ code, map }` — compile a `.tsrx` module.
- `rippleNew()` — the Vite plugin (`./vite`).
- `compileToVolarMappings(...)` — type-only lowering for editor tooling
  (`./volar`).

## Scope & non-goals

Targets the **client-only** ripple-new runtime — there is no SSR/hydration
codegen. Async (`async function`) and generator (`function*`) component bodies are
rejected at compile time, as is `@for await` (async iteration); load async data
with `use(promise)` inside a `@try` / `@pending` boundary instead.

Source maps use esrap's real per-token mappings (the same machinery as the
mainline TSRX compilers), captured per node and merged into module coordinates.
The emitted v3 map carries `sources` + inlined `sourcesContent`, a token-level map
for top-level statements and each component's setup statements, and a line anchor
at every component declaration. Because the codegen is string-assembly rather than
a single full-AST esrap print, two things are not yet mapped: expressions embedded
inside JSX templates (event/text/attribute holes) and nested control-flow bodies
(`@for` / `@if` / `@try` item bodies) — closing those requires emitting the
template/binding plumbing as an AST so esrap prints the whole module in one pass.

## Status

Experimental / pre-release (`private`, `0.0.x`).

## Development

```bash
pnpm test --project tsrx-ripple-new   # run the compiler test suite
pnpm smoke                            # print emitted code for a few samples
node scripts/try-compile.js <file>    # compile a single .tsrx file
node scripts/inspect-ast.js <file>    # dump the parsed TSRX AST
```

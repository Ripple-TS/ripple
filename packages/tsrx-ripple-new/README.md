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

Source maps are currently coarse (the codegen is string-assembly, not full AST
printing): the emitted map carries `sources` + inlined `sourcesContent` and
top-level statement/component anchors, so the original `.tsrx` is visible and
boundaries map, but per-token fidelity inside generated runtime plumbing is not
yet provided.

## Status

Experimental / pre-release (`private`, `0.0.x`).

## Development

```bash
pnpm test --project tsrx-ripple-new   # run the compiler test suite
pnpm smoke                            # print emitted code for a few samples
node scripts/try-compile.js <file>    # compile a single .tsrx file
node scripts/inspect-ast.js <file>    # dump the parsed TSRX AST
```

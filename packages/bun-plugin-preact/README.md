# @tsrx/bun-plugin-preact

Bun plugin for compiling `@tsrx/preact` `.tsrx` files.

## Installation

```bash
pnpm add -D @tsrx/bun-plugin-preact
```

## Usage

```ts
import tsrxPreact from '@tsrx/bun-plugin-preact';

await Bun.build({
  entrypoints: ['./src/App.tsrx'],
  outdir: './dist',
  target: 'browser',
  plugins: [tsrxPreact()],
});
```

The plugin compiles `.tsrx` modules with `@tsrx/preact`, runs Bun's TSX transform
for Preact's automatic JSX runtime, and emits component-local `<style>` blocks as
virtual CSS modules.

For `bun:test`, register it from a preload:

```ts
import tsrxPreact from '@tsrx/bun-plugin-preact';

Bun.plugin(tsrxPreact());
```

## Options

- `jsxImportSource`: automatic JSX runtime import source (default: `'preact'`).
- `suspenseSource`: module used by the compiler for Suspense imports.
- `runtimeImports`: helper import mode (`'compiler'` by default, or `'direct'` for
  standalone runtime imports).
- `emitCss`: whether to emit virtual CSS imports (default: `true`).
- `include`, `exclude`: regex filters for source files.

When using `runtimeImports: 'direct'`, install the runtime as a direct production
dependency of the package that owns the compiled modules:

```bash
pnpm add @tsrx/preact-runtime
```

Bun may bundle the helpers into its output, but this plugin only emits bare
`@tsrx/preact-runtime/*` imports and does not provide the runtime package.

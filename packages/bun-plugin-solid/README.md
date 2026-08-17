# @tsrx/bun-plugin-solid

Bun plugin for compiling `@tsrx/solid` `.tsrx` files.

## Installation

```bash
pnpm add @tsrx/solid solid-js @solidjs/web
pnpm add -D @tsrx/bun-plugin-solid
```

## Usage

```ts
import tsrxSolid from '@tsrx/bun-plugin-solid';

await Bun.build({
  entrypoints: ['./src/App.tsrx'],
  outdir: './dist',
  target: 'browser',
  plugins: [tsrxSolid()],
});
```

The plugin compiles `.tsrx` modules with `@tsrx/solid`, runs Solid's JSX transform
through Babel, and emits component-local `<style>` blocks as virtual CSS modules.

For `bun:test`, register it from a preload:

```ts
import tsrxSolid from '@tsrx/bun-plugin-solid';

Bun.plugin(tsrxSolid());
```

## Options

- `solid`: options forwarded to `babel-preset-solid`.
- `runtimeImports`: helper import mode (`'compiler'` by default, or `'direct'` for
  standalone runtime imports).
- `emitCss`: whether to emit virtual CSS imports (default: `true`).
- `include`, `exclude`: regex filters for source files.

When using `runtimeImports: 'direct'`, install the runtime as a direct production
dependency of the package that owns the compiled modules:

```bash
pnpm add @tsrx/solid-runtime
```

Bun may bundle the helpers into its output, but this plugin only emits bare
`@tsrx/solid-runtime/*` imports and does not provide the runtime package.

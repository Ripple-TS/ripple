# @tsrx/bun-plugin-react

Bun plugin for compiling `@tsrx/react` `.tsrx` files.

## Installation

```bash
pnpm add -D @tsrx/bun-plugin-react
```

## Usage

```ts
import tsrxReact from '@tsrx/bun-plugin-react';

await Bun.build({
  entrypoints: ['./src/App.tsrx'],
  outdir: './dist',
  target: 'browser',
  plugins: [tsrxReact()],
});
```

The plugin compiles `.tsrx` modules with `@tsrx/react`, runs Bun's TSX transform
for React's automatic JSX runtime, and emits component-local `<style>` blocks as
virtual CSS modules.

For `bun:test`, register it from a preload:

```ts
import tsrxReact from '@tsrx/bun-plugin-react';

Bun.plugin(tsrxReact());
```

## Options

- `jsxImportSource`: automatic JSX runtime import source (default: `'react'`).
- `emitCss`: whether to emit virtual CSS imports (default: `true`).
- `include`, `exclude`: regex filters for source files.

# @tsrx/bun-plugin-vue

Bun plugin for compiling `@tsrx/vue` `.tsrx` files.

## Installation

```bash
pnpm add -D @tsrx/bun-plugin-vue
```

## Usage

```ts
import tsrxVue from '@tsrx/bun-plugin-vue';

await Bun.build({
  entrypoints: ['./src/App.tsrx'],
  outdir: './dist',
  target: 'browser',
  plugins: [tsrxVue()],
});
```

The plugin compiles `.tsrx` modules with `@tsrx/vue`, runs the downstream
`vue-jsx-vapor` transform, strips the remaining TypeScript syntax with Bun, and
emits component-local `<style>` blocks as virtual CSS modules.

For `bun:test`, register it from a preload:

```ts
import tsrxVue from '@tsrx/bun-plugin-vue';

Bun.plugin(tsrxVue());
```

## Options

- `vapor`: options forwarded to `vue-jsx-vapor`.
- `runtimeImports`: helper import mode (`'compiler'` by default, or `'direct'` for
  standalone runtime imports).
- `emitCss`: whether to emit virtual CSS imports (default: `true`).
- `include`, `exclude`: regex filters for source files.

When using `runtimeImports: 'direct'`, install the runtime as a direct production
dependency of the package that owns the compiled modules:

```bash
pnpm add @tsrx/vue-runtime
```

Bun may bundle the helpers into its output, but this plugin only emits bare
`@tsrx/vue-runtime/*` imports and does not provide the runtime package.

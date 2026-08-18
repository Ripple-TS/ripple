# `@tsrx/vue-runtime`

Small runtime helper package for Vue components compiled from TSRX.

Applications that compile `.tsrx` files can continue installing `@tsrx/vue` alone
with the default `runtimeImports: 'compiler'` mode.

When a compiler or build integration uses `runtimeImports: 'direct'`, the package
that owns the source or generated modules must declare this runtime as a direct
production dependency:

```bash
pnpm add @tsrx/vue-runtime
```

The generated modules contain bare `@tsrx/vue-runtime/*` imports. A builder may
bundle those helpers or leave them external, but it does not provide this package;
the import must be resolvable during the build. Do not rely on dependency hoisting
or on `@tsrx/vue` installing the runtime transitively. Published component
libraries can keep the compiler and build integration in `devDependencies` while
declaring this package in `dependencies`.

Available subpaths:

- `@tsrx/vue-runtime/error-boundary`
- `@tsrx/vue-runtime/ref`

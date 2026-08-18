# `@tsrx/solid-runtime`

Small runtime helper package for Solid components compiled from TSRX.

Applications that compile `.tsrx` files can continue installing `@tsrx/solid`
alone with the default `runtimeImports: 'compiler'` mode.

When a compiler or build integration uses `runtimeImports: 'direct'`, the package
that owns the source or generated modules must declare this runtime as a direct
production dependency:

```bash
pnpm add @tsrx/solid-runtime
```

The generated modules contain bare `@tsrx/solid-runtime/*` imports. A builder may
bundle those helpers or leave them external, but it does not provide this package;
the import must be resolvable during the build. Do not rely on dependency hoisting
or on `@tsrx/solid` installing the runtime transitively. Published component
libraries can keep the compiler and build integration in `devDependencies` while
declaring this package in `dependencies`.

Available subpath:

- `@tsrx/solid-runtime/ref`

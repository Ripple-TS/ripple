# `@tsrx/react-runtime`

Small runtime helper package for React components compiled from TSRX.

Applications that compile `.tsrx` files can continue installing `@tsrx/react`
alone with the default `runtimeImports: 'compiler'` mode.

When a compiler or build integration uses `runtimeImports: 'direct'`, the package
that owns the source or generated modules must declare this runtime as a direct
production dependency:

```bash
pnpm add @tsrx/react-runtime
```

The generated modules contain bare `@tsrx/react-runtime/*` imports. A builder may
bundle those helpers or leave them external, but it does not provide this package;
the import must be resolvable during the build. Do not rely on dependency hoisting
or on `@tsrx/react` installing the runtime transitively. Published component
libraries can keep the compiler and build integration in `devDependencies` while
declaring this package in `dependencies`.

Available subpaths:

- `@tsrx/react-runtime/error-boundary`
- `@tsrx/react-runtime/ref`
- `@tsrx/react-runtime/iterable`

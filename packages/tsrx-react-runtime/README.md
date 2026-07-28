# `@tsrx/react-runtime`

Small runtime helper package for React components compiled from TSRX.

Applications that compile `.tsrx` files can continue installing `@tsrx/react`
alone. Published component libraries can depend on this package and compile with
`runtimeImports: 'direct'` to avoid a production dependency on the compiler.

Available subpaths:

- `@tsrx/react-runtime/error-boundary`
- `@tsrx/react-runtime/ref`
- `@tsrx/react-runtime/iterable`

# `@tsrx/preact-runtime`

Small runtime helper package for Preact components compiled from TSRX.

Applications that compile `.tsrx` files can continue installing `@tsrx/preact`
alone. Published component libraries can depend on this package and compile with
`runtimeImports: 'direct'` to avoid a production dependency on the compiler.

Available subpaths:

- `@tsrx/preact-runtime/error-boundary`
- `@tsrx/preact-runtime/ref`
- `@tsrx/preact-runtime/iterable`

# `@tsrx/solid-runtime`

Small runtime helper package for Solid components compiled from TSRX.

Applications that compile `.tsrx` files can continue installing `@tsrx/solid`
alone. Published component libraries can depend on this package and compile with
`runtimeImports: 'direct'` to avoid a production dependency on the compiler.

Available subpath:

- `@tsrx/solid-runtime/ref`

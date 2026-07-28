# `@tsrx/vue-runtime`

Small runtime helper package for Vue components compiled from TSRX.

Applications that compile `.tsrx` files can continue installing `@tsrx/vue` alone.
Published component libraries can depend on this package and compile with
`runtimeImports: 'direct'` to avoid a production dependency on the compiler.

Available subpaths:

- `@tsrx/vue-runtime/error-boundary`
- `@tsrx/vue-runtime/ref`

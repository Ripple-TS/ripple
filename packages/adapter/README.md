# @ripple-ts/adapter

Shared adapter primitives for Ripple metaframework adapters.

This package contains common runtime helpers and shared type contracts used by
environment-specific adapters like:

- `@ripple-ts/adapter-node`
- `@ripple-ts/adapter-bun`

## Exports

- `DEFAULT_PORT`
- `DEFAULT_HOSTNAME`
- `internal_server_error_response()`
- `run_next_middleware()`

Type exports:

- `FetchHandler`
- `AdapterCoreOptions`
- `NextMiddleware`
- `ServeResult`

## License

MIT

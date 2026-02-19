# @ripple-ts/adapter

[![npm version](https://img.shields.io/npm/v/%40ripple-ts%2Fadapter?logo=npm)](https://www.npmjs.com/package/@ripple-ts/adapter)
[![npm downloads](https://img.shields.io/npm/dm/%40ripple-ts%2Fadapter?logo=npm&label=downloads)](https://www.npmjs.com/package/@ripple-ts/adapter)

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
- `serveStatic()`
- `MIME_TYPES`
- `get_mime_type()`
- `is_hashed_asset()`
- `get_static_cache_control()`

Type exports:

- `FetchHandler`
- `AdapterCoreOptions`
- `NextMiddleware`
- `ServeResult`
- `ServeStaticOptions`

## License

MIT

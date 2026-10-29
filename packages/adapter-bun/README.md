# @ripple-ts/adapter-bun

[![npm version](https://img.shields.io/npm/v/%40ripple-ts%2Fadapter-bun?logo=npm)](https://www.npmjs.com/package/@ripple-ts/adapter-bun)
[![npm downloads](https://img.shields.io/npm/dm/%40ripple-ts%2Fadapter-bun?logo=npm&label=downloads)](https://www.npmjs.com/package/@ripple-ts/adapter-bun)

Bun adapter for Ripple metaframework apps.

It exposes the same `serve(fetch_handler, options?)` contract as
`@ripple-ts/adapter-node`, backed by `Bun.serve`.

## Installation

```bash
pnpm add @ripple-ts/adapter-bun
# or
npm install @ripple-ts/adapter-bun
# or
yarn add @ripple-ts/adapter-bun
```

## Usage

```js
import { serve } from '@ripple-ts/adapter-bun';

const app = serve(async (request) => {
  const url = new URL(request.url);

  if (url.pathname === '/health') {
    return new Response('ok');
  }

  return new Response('Hello from Ripple adapter-bun!', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
});

app.listen(3000);
```

## Streaming RPC

The shared `@ripple-ts/adapter` RPC handler supports iterable responses through
this adapter's existing streaming `Response` path. Normal applications can keep
using the generated document server entry.

To serve RPC in a separate process, create an entry in your project root:

```js
// rpc-server.js
import { serve, runtime } from '@ripple-ts/adapter-bun';
import { createHandler } from './dist/server/rpc.js';

serve(createHandler(runtime), { static: false }).listen(3001);
```

The RPC entry is emitted when the application has server functions. Route
`/_$_ripple_rpc_$_/*` to this process and document requests to the SSR process.
The RPC process loads the addressed function and required dependencies without
loading unrelated pages or the document renderer. Importing both entries into one
process still retains their loaded code. Requests remain subject to host limits;
sources must support restarting from a cursor or a fresh snapshot.

## API

### `serve(fetch_handler, options?)`

- `fetch_handler`:
  `(request: Request, platform?: any) => Response | Promise<Response>`
- `options.port` (default: `3000`)
- `options.hostname` (default: `localhost`)
- `options.static` (default: `{ dir: 'public' }`): serves static files before
  middleware/handler
  - `options.static.dir` (default: `public`, resolved from `process.cwd()`)
  - `options.static.prefix` (default: `/`)
  - `options.static.maxAge` (default: `86400`)
  - `options.static.immutable` (default: `false`)
  - set `options.static = false` to disable automatic static serving
- `options.middleware` (optional):
  `(request, server, next) => Response | Promise<Response> | void`

Returns:

- `listen(port?)`: starts Bun server and returns the Bun server instance
- `close()`: stops the current Bun server instance

### `serveStatic(dir, options?)`

Creates a Bun middleware that serves static assets from `dir`.

- `options.prefix` (default: `/`)
- `options.maxAge` (default: `86400`)
- `options.immutable` (default: `false`)

## Notes

- Requires Bun runtime (`Bun.serve`).
- Static file logic and MIME type mappings are shared from `@ripple-ts/adapter`.
- `platform` passed to `fetch_handler` contains `{ bun_server }`.
- Unhandled errors return `500 Internal Server Error`.

## License

MIT

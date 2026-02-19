# @ripple-ts/adapter-node

[![npm version](https://img.shields.io/npm/v/%40ripple-ts%2Fadapter-node?logo=npm)](https://www.npmjs.com/package/@ripple-ts/adapter-node)
[![npm downloads](https://img.shields.io/npm/dm/%40ripple-ts%2Fadapter-node?logo=npm&label=downloads)](https://www.npmjs.com/package/@ripple-ts/adapter-node)

Node.js adapter for Ripple metaframework apps.

It bridges Node's `IncomingMessage`/`ServerResponse` API to Web
`Request`/`Response`, so your server handler can use standard Fetch APIs.

## Installation

```bash
pnpm add @ripple-ts/adapter-node
# or
npm install @ripple-ts/adapter-node
# or
yarn add @ripple-ts/adapter-node
```

## Usage

```js
import { serve } from '@ripple-ts/adapter-node';

const app = serve(async (request) => {
  const url = new URL(request.url);

  if (url.pathname === '/health') {
    return new Response('ok');
  }

  return new Response('Hello from Ripple adapter-node!', {
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
});

app.listen(3000);
```

## API

### `serve(fetch_handler, options?)`

Creates an HTTP server adapter.

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
- `options.middleware` (optional): Node-style middleware called before
  `fetch_handler`

Returns:

- `listen(port?)`: starts the server and returns Node `Server`
- `close()`: closes the server

### `serveStatic(dir, options?)`

Creates a Node middleware that serves static assets from `dir`.

- `options.prefix` (default: `/`)
- `options.maxAge` (default: `86400`)
- `options.immutable` (default: `false`)

## Middleware

If middleware sends the response (`res.end()` / `res.headersSent`), the fetch
handler is skipped.

```js
import { serve } from '@ripple-ts/adapter-node';

const app = serve(async () => new Response('from handler'), {
  middleware(req, res, next) {
    if (req.url === '/legacy') {
      res.statusCode = 200;
      res.setHeader('content-type', 'text/plain; charset=utf-8');
      res.end('from middleware');
      return;
    }

    next();
  },
});

app.listen(3000);
```

## Notes

- Static file logic and MIME type mappings are shared from `@ripple-ts/adapter`.
- `x-forwarded-proto` and `x-forwarded-host` are respected when constructing the
  request URL.
- Request bodies are streamed for non-`GET`/`HEAD` methods.
- Multiple `set-cookie` headers are forwarded correctly.
- Unhandled errors return `500 Internal Server Error`.

## License

MIT

# @ripple-ts/adapter-vercel

Vercel adapter for the Ripple metaframework.

Deploys your Ripple SSR application to [Vercel](https://vercel.com) using the
[Build Output API v3](https://vercel.com/docs/build-output-api/v3).

## Installation

```bash
pnpm add @ripple-ts/adapter-vercel
```

## Usage

### ripple.config.ts

```typescript
import { defineConfig } from '@ripple-ts/vite-plugin';
import { serve, runtime } from '@ripple-ts/adapter-vercel';
import { routes } from './src/routes.ts';

export default defineConfig({
  adapter: { serve, runtime },
  router: { routes },
});
```

### Build & Deploy

The adapter generates Vercel's
[Build Output API v3](https://vercel.com/docs/build-output-api/v3) structure.

**Option 1: Post-build CLI**

```bash
pnpm vite build && ripple-adapt-vercel
```

Or add to your package.json:

```json
{
  "scripts": {
    "build": "vite build",
    "vercel-build": "vite build && ripple-adapt-vercel"
  }
}
```

**Option 2: Use `adapt()` programmatically**

```javascript
import { adapt } from '@ripple-ts/adapter-vercel';

await adapt({
  outDir: 'dist',
  // options...
});
```

### Options

| Option                   | Type                 | Default       | Description                                                              |
| ------------------------ | -------------------- | ------------- | ------------------------------------------------------------------------ |
| `outDir`                 | `string`             | `'dist'`      | Build output directory (from vite build)                                 |
| `serverless`             | `ServerlessConfig`   | `{}`          | Serverless function configuration                                        |
| `serverless.runtime`     | `string`             | auto-detected | Node.js runtime version (`'nodejs20.x'`, `'nodejs22.x'`, `'nodejs24.x'`) |
| `serverless.regions`     | `string[]`           | `undefined`   | Deployment regions                                                       |
| `serverless.memory`      | `number`             | `undefined`   | Memory (MB) allocated to the function                                    |
| `serverless.maxDuration` | `number`             | `undefined`   | Maximum execution time (seconds)                                         |
| `isr`                    | `ISRConfig \| false` | `false`       | Incremental Static Regeneration config                                   |
| `isr.expiration`         | `number \| false`    | —             | Seconds before background revalidation (`false` = never expire)          |
| `isr.bypassToken`        | `string`             | `undefined`   | Token to bypass the ISR cache                                            |
| `isr.allowQuery`         | `string[]`           | `undefined`   | Query params included in the cache key (empty = ignore query)            |
| `images`                 | `ImagesConfig`       | `undefined`   | Vercel Image Optimization config                                         |
| `headers`                | `VercelHeader[]`     | `[]`          | Custom response headers                                                  |
| `redirects`              | `VercelRedirect[]`   | `[]`          | Custom redirects                                                         |
| `rewrites`               | `VercelRewrite[]`    | `[]`          | Additional rewrites (prepended before catch-all)                         |
| `cleanUrls`              | `boolean`            | `true`        | Remove `.html` extensions from URLs                                      |
| `trailingSlash`          | `boolean`            | `undefined`   | Enforce trailing slash behavior                                          |

## How It Works

1. **`vite build`** produces `dist/client/` (static assets) and
   `dist/server/entry.js` (server bundle)
2. **`adapt()`** restructures the output into `.vercel/output/`:
   - Copies `dist/client/` → `.vercel/output/static/`
   - Creates a serverless function at `.vercel/output/functions/index.func/`
   - Generates `.vercel/output/config.json` with routing rules
   - Uses `@vercel/nft` to trace and bundle server dependencies

The generated structure:

```
.vercel/output/
├── config.json                    # Build Output API v3 config
├── static/                        # Static files (served by Vercel CDN)
│   ├── assets/
│   ├── index.html
│   └── ...
└── functions/
    └── index.func/                # Serverless function
        ├── index.js               # Handler entry point
        ├── .vc-config.json        # Function configuration
        ├── package.json           # ESM marker
        └── ... (traced deps)
```

## Local Development

The adapter re-exports `serve` and `runtime` from `@ripple-ts/adapter-node`, so
local development with `vite dev` and `ripple-preview` works exactly the same as
with adapter-node.

## Incremental Static Regeneration (ISR)

Enable ISR to let Vercel cache serverless responses at the edge and revalidate
them in the background:

```javascript
await adapt({
  isr: {
    // Re-generate cached pages every 60 seconds
    expiration: 60,
  },
});
```

**Never-expiring cache** (only revalidated via on-demand revalidation):

```javascript
await adapt({
  isr: {
    expiration: false,
    bypassToken: process.env.REVALIDATION_TOKEN,
  },
});
```

**Cache key control** — only include specific query parameters:

```javascript
await adapt({
  isr: {
    expiration: 300,
    allowQuery: ['page', 'q'], // /search?q=foo and /search?q=bar are cached separately
  },
});
```

The ISR config is emitted as a `prerender` field in the function's
`.vc-config.json`, following Vercel's
[Build Output API v3 prerender configuration](https://vercel.com/docs/build-output-api/v3/configuration#prerender-configuration).

## Vercel Configuration

No `vercel.json` configuration is needed — the adapter generates all necessary
routing rules via the Build Output API.

If you do have a `vercel.json`, the adapter respects your `buildCommand` and
`outputDirectory` settings. Set your build command to run the adapter:

```json
{
  "buildCommand": "pnpm vite build && pnpm ripple-adapt-vercel"
}
```

# Production SSR example

From the repository root:

```sh
pnpm install
pnpm --filter @ripple-ts/router-ssr-example build
pnpm --filter @ripple-ts/router-ssr-example start
```

Open `http://127.0.0.1:3000/app/`. The example uses a real `/app/` base path, a
code-defined route tree, a retained posts layout, typed params/search, fetch
loaders, pending/error UI, an explicit lazy component, a navigation blocker and
scroll restoration. `/app/stream?stream=1` streams a deferred loader value; other
entries use buffered SSR. Every request constructs a fresh router. Both modes
restore router state before hydrating the existing DOM.

Production responses enforce a nonce-based strict CSP. `server.js` generates a
fresh cryptographic nonce for each response, configures the router, and sets the
policy and `private, no-store` before streaming. The same nonce reaches scripts,
scoped styles and lazy assets. `/app/csp?stream=1` exercises nested streamed
boundaries and late scoped CSS. See the
[SSR policy guide](../../docs/ssr.md#strict-content-security-policy) for
application-owned directives, caching, and the separate treatment of inline style
attributes. See the
[CSP guide](https://ripple-ts.com/docs/guide/content-security-policy) for the
additional contracts:

- `/app/security/trusted-types` (also `?stream=1`): native Trusted Types with an
  explicit policy, trusted HTML, SVG/MathML and script lifecycle controls.
- `/app/security/static`: build-time prerendered HTML and its saved hash header.
  The build verifies stable executable/style hashes; inert render IDs can vary.
- `pnpm --filter @ripple-ts/router-ssr-example dev:csp`: separate Vite policy at
  `http://127.0.0.1:3001/app/security/dev`, with nonce CSS, module HMR and a
  specific WebSocket endpoint. The error overlay and Trusted Types are disabled
  here.

`security-policy.js` uses fixed example-owned allowlists. Replace them with your
application's review/sanitization policy; do not authorize arbitrary strings.
`security-vendor.js` demonstrates a fixed reviewed external script and cleanup.
Live streaming with static hashes is unsupported. Keep the generated
`dist/client/security.html` and `security-policy.json` together when deploying.

`vite.config.js` builds the same `.tsrx` sources for the browser and server. The
Node example server translates Vite's manifest to the router's `scripts` and `css`
manifest entries, serves emitted assets, and propagates disconnected requests to
the renderer. `client.js` exports the router and disposal/remount functions so a
host can remove the application cleanly. The tiny API is demonstration data.

Set the base in `vite.config.js` and adjust the server's asset/API prefix together
when deploying at a different path. Run the server behind your application's HTTP
infrastructure; this example is not a general static-file or API server.

Native transitions use `view-transition-name: route` and standard
`::view-transition-old/new` CSS. Reduced motion disables animation. Navigation
completion means the destination rendered; the browser may still be animating. No
animation API is required for navigation to work.

```sh
pnpm --filter @ripple-ts/router-ssr-example typecheck
pnpm --filter @ripple-ts/tanstack-router exec playwright install chromium firefox webkit
pnpm --filter @ripple-ts/tanstack-router test:browser
pnpm --filter @ripple-ts/tanstack-router test:release
```

The release command installs packed artifacts in a fresh temporary directory,
typechecks ordinary TypeScript and TSRX call sites with `tsrx-tsc`, optimizes
dependencies, builds both targets, and runs the same browser matrix. It removes
the directory on completion; set `KEEP_RELEASE_CONSUMER=1` to retain it for
debugging.

`tsconfig.json` selects `@tsrx/ripple`, Vite's environment types, and the TSRX
TypeScript plugin. Use a TSRX-aware editor (for example the TSRX VS Code
extension) for `.tsrx` diagnostics and cross-file inference. `pnpm typecheck` uses
the published `tsrx-tsc` CLI with this same configuration; plain `tsc` does not
load language-service plugins. `types.ts` contains positive and negative type
checks and is not an application entry point.

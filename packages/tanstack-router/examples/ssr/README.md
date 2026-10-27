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

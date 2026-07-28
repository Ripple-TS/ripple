---
'@tsrx/core': patch
'@ripple-ts/vite-plugin': patch
'@tsrx/vite-plugin-preact': patch
'@tsrx/vite-plugin-react': patch
'@tsrx/vite-plugin-solid': patch
'@tsrx/vite-plugin-vue': patch
---

fix: make `.tsrx` imports visible to Vite's dependency scanner in every plugin

Vite's dep scanner runs through Rolldown without the main plugin pipeline, so
any npm dependency imported only from `.tsrx` files was invisible at startup and
got discovered at request time instead, forcing a re-optimize and a full page
reload. Only `@tsrx/vite-plugin-react` handled this; `@tsrx/vite-plugin-preact`,
`@tsrx/vite-plugin-solid` and `@ripple-ts/vite-plugin` now do too.

`@tsrx/core` gains a `@tsrx/core/vite/dep-scan` entry point with the two plugin
shapes this needs: `createDepScanTransformPlugin` for plugins that transform
`.tsrx` ids directly, and `createDepScanLoadPlugin` for plugins that rewrite them
to a virtual `<path>.tsx` form. Both swallow compile failures, so a single
malformed file no longer costs the whole project its dependency pre-bundling.

Also fixes the scan's own JSX transform, which defaults to React's automatic
runtime. It was emitting an unresolvable `react/jsx-dev-runtime` import into
Preact, Solid and Vue projects, which failed the scan outright — the React-only
form of this bug appeared when `jsxImportSource` was set to a non-React runtime.
The React and Preact plugins now point that transform at the configured import
source, and the Solid and Vue plugins leave JSX untransformed during the scan
since their own JSX stage runs downstream.

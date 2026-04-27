---
'@ripple-ts/vite-plugin': patch
---

fix: register SSR/API middleware as a pre-hook so it runs before Vite's HTML fallback middleware

The dev server's `configureServer` hook previously returned a function (post-hook), which registered SSR/API middleware after Vite's internal middleware stack. Vite's HTML fallback middleware would intercept all non-file GET requests first, preventing SSR rendering and API routes from ever executing.

Switched to a pre-hook (no return value) so middleware is registered before Vite internals. Config loading is deferred to the first request via `ensureConfigLoaded()`, which retries on missing config and surfaces load errors as dev-server 500 pages instead of silently falling through.

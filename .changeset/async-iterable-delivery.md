---
'ripple': minor
'@tsrx/ripple': patch
'@ripple-ts/vite-plugin': patch
'@ripple-ts/adapter': patch
'@ripple-ts/adapter-vercel': patch
---

Extend trackAsync with async iterable sources, accepted previous values, first-ready SSR handoff, and owned incremental RPC delivery with bounded transport recovery. Preserve deferred hydration and DOM identity without additional hydration markers or per-yield scripts. Build isolated RPC function graphs and a separately deployable dispatcher; route Vercel continuation requests to their own function.

Replace the public trackPending API and compiler lowering with getTrackedStatus for tracked/derived handles. Loading checks use state === 'pending'; safe-access guards use state === 'ready'. Convert callback-form inspections into named derived values before reading their status. Completion is reactive and does not publish another data value.

Resolve the generated RPC runtime through the Vite plugin so applications do not need a direct dependency on `@ripple-ts/adapter`.

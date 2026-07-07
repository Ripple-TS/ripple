---
'ripple': patch
'@ripple-ts/vite-plugin': patch
---

Streaming SSR: `render(App, { stream })` now streams progressively. The
synchronous shell (with pending fallbacks for suspended `@try` boundaries and
all CSS registered so far) is flushed immediately; each boundary's content
streams out of order as a framed chunk once its async work settles, including
per-chunk CSS, trackAsync envelopes and `<head>` content. A tiny inline
runtime swaps chunks into their slots before hydration, and hydrated
boundaries activate streamed chunks in place afterwards — claiming the
streamed DOM without re-rendering. Catch-only async boundaries stream an
empty slot and resolve to their body or server-rendered catch; errors whose
catch region is already on the wire hand off to the client boundary via an
error envelope. `render` also gains a `streamTemplate` option for document
scaffolding, and the vite plugin streams render-route responses when
`ssr.streaming` is enabled in ripple.config.ts (falling back to buffered SSR
when index.html lacks the `<!--ssr-head-->`/`<!--ssr-body-->` markers).

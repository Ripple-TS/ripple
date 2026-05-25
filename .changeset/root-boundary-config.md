---
'ripple': patch
'@ripple-ts/vite-plugin': patch
---

Add global root pending/catch boundary support and allow Ripple config routes to reference named entry exports.

Refactor vite-plugin to keep code generation in one place, produce cache as necessary and generate actual files for inspection.

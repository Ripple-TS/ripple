---
'@ripple-ts/tanstack-router': patch
---

Pass the router SSR nonce through Ripple rendering and buffered scoped styles. Expose the nonce to Vite's lazy asset loader, and document and test production nonce-based strict CSP across SSR, hydration, and navigation.

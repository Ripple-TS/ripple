---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
'@tsrx/ripple': patch
---

Treat dynamic tags (`<{expr}>`) like the runtime `Dynamic` helper during
scoped CSS analysis on all targets: type selectors are no longer pruned (the
tag can resolve to any element), the element's classes match scoped
selectors, and the scope hash is applied to its class.

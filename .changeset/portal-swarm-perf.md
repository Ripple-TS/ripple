---
'ripple': patch
'@tsrx/ripple': patch
---

Speed up portals and root event delegation. `<Portal>` now lowers to a dedicated `portal()` runtime call, portal content appends straight into its target without a placeholder node, delegated root listeners are shared per target instead of per portal, event registration no longer scans every root target, and `@if` blocks and compiled `event()` calls allocate fewer closures. `mount()` accepts `rootBoundary: false` to render without the default root try/pending boundary. Cold code paths (keyed-list diff, block error handling, effect-phase flushing, hydration branches) live in their own functions so a first mount compiles less.

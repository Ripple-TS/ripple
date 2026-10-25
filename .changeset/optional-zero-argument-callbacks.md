---
'@tsrx/ripple': patch
---

Preserve optional zero-argument calls when wrapping callbacks in the component
scope, so invoking an omitted callback such as `done?.()` does not throw.

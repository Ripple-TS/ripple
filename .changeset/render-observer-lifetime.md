---
'ripple': patch
---

Add `createRenderObserver()` for integrations that need to await component-subtree
rendering, including async work, supersession, and unmounting. Keep tracked values
usable across their creating component's lifetime, release pending requests when
async children are removed, and propagate errors thrown from catch branches to
the next boundary.

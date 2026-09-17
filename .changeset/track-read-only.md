---
'ripple': minor
'@tsrx/ripple': patch
---

`trackReadOnly(value)` replaces the `readOnly()` method on tracked and derived values: it returns a derived that follows a tracked or writable derived, or a read-only derived as it is. The method is removed, so `count.readOnly()` becomes `trackReadOnly(count)`, imported from `ripple`. Dropping the prototype methods lets a bundle that never takes a read-only view leave the code out.

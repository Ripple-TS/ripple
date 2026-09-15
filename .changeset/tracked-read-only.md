---
'ripple': patch
---

`tracked.readOnly()` returns a read-only view of a `Tracked` or `WritableDerived`: a `Derived<V>` that follows the value and rejects writes, for a child, function, or context that should only read it. It is equivalent to `track(() => tracked.value)`. On a derived that is already read-only, `readOnly()` returns the derived itself.

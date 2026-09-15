---
'ripple': patch
---

A derived created during a block's run (a `track(() => ...)` or `tracked.readOnly()` in an `@if` branch, a keyed `@for` item, a render expression, or component setup) is now unsubscribed from its sources when that block reruns or is destroyed, unless a reader that is still alive holds it. Before, such deriveds stayed subscribed until the block that owned them was destroyed, so a branch that toggled repeatedly accumulated one stale derived per toggle, each walked on every write to the source. The bookkeeping lives in a side table keyed by the creating block, so blocks that create no deriveds pay nothing.

---
'ripple': patch
---

Flush all settled streaming SSR boundaries before `render()` resolves when `closeStream` is `false`, while keeping the sink open for caller writes.

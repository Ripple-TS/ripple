---
'ripple': patch
---

Allow error boundaries to recover after a reset attempt throws synchronously again. Dispose the failed attempt so subsequent resets can render fresh content.

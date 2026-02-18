---
'ripple': patch
---

Fix SSR hydration output for early-return guarded content by emitting hydration
block markers around return-guarded regions, and add hydration/server coverage for
early return scenarios.

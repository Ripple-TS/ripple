---
'ripple': patch
---

Replace all [0] and [1] compiled output with `.value` and direct `lazy`
Throw runtime errors for direct `[0]` and `[1]` access on tracked and derived values.
Fix type removal for non-tsx paths

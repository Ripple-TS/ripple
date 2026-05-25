---
'ripple': patch
'@tsrx/ripple': patch
'@tsrx/core': patch
---

Replace all [0] and [1] compiled output with `.value` and direct `lazy`
Throw runtime errors for direct `[0]` and `[1]` access on tracked and derived values.
Fix type removal for non-tsx paths
Remove the public `get` and `set` exports in favor of `.value` access.
Ignore lazy writes past the tracked tuple length instead of creating numeric properties.

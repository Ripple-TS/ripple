---
'ripple': patch
---

Fix `to_ts` output for lazy array destructuring so it keeps direct destructuring syntax for `track()` and `trackSplit()` instead of expanding through an intermediate `lazy` variable.

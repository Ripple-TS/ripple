---
'ripple': patch
---

Fix client HMR updates when a wrapped component has not mounted yet. The runtime
now avoids calling `set()` on an undefined tracked source and keeps wrapper HMR
state synchronized across update chains.

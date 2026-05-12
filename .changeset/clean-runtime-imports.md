---
'@tsrx/core': patch
'@tsrx/preact': patch
'@tsrx/react': patch
'ripple': patch
---

Keep runtime helper imports on namespaced runtime subpaths so production app
bundles do not pull in compiler-only modules.

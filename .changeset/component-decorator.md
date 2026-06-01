---
'@tsrx/core': patch
'@tsrx/ripple': patch
'ripple': patch
---

Add a static `@Component` decorator marker for Ripple component functions, and
treat Ripple functions as components only when they return TSRX directly or use
that marker.

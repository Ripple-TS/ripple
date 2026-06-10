---
'@tsrx/ripple': patch
'ripple': patch
---

Render `<{expr}>` dynamic tags directly through `_$_.composite` in the client
production output instead of lowering to the `Dynamic` helper component, and
fix hydration of dynamic string tags claiming the SSR-rendered element.

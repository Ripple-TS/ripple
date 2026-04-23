---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/ripple': patch
---

Fix scoped CSS application for elements rendered inside `<tsx>...</tsx>` and bare
`<>...</>` fragment shorthand so they receive the same hash-based classes as
regular template elements.

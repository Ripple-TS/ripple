---
'@tsrx/core': patch
'@tsrx/ripple': patch
'@tsrx/preact': patch
'@tsrx/react': patch
'@tsrx/solid': patch
---

Allow bare `<>...</>` fragments everywhere TSRX accepts `<tsx>...</tsx>`, including template bodies and expression position. The shorthand now compiles across Ripple, React, Preact, and Solid targets, while the explicit `<tsx>...</tsx>` form remains supported.

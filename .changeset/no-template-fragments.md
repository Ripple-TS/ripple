---
'@tsrx/ripple': patch
'@tsrx/preact': patch
'@tsrx/react': patch
'@tsrx/solid': patch
---

Disallow JSX fragment syntax in template bodies unless it appears inside `<tsx>...</tsx>`. Ripple, Preact, React, and Solid compilers now report a compile error instead of accepting or crashing on `<>...</>` in regular templates.

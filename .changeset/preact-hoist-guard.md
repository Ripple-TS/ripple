---
'@tsrx/preact': patch
---

Fix Preact JSX hoisting to only lift elements whose subtree is provably static. Elements containing render-time expressions (e.g. `Date.now()`), spread attributes, or dynamic expression containers are no longer incorrectly hoisted to module level.

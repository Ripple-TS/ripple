---
'@tsrx/preact': patch
'@tsrx/react': patch
'@tsrx/react-playground': patch
'@tsrx/solid-playground': patch
'@tsrx/core': patch
---

Fixes a bug where for all control statements: for, if, switch, try/pending/catch
where using hooks inside to change values, like useState, would not be reflected
in the subsequent code. The fix involved creating continuation hooks and calling
them at the end of the control flow block - it's an oversimplification.

Fixes the for loop by hoisting the generated statement body hooks and types to the
outside of the loop.

Refactors a bunch, but not all, manually created AST nodes into using ast builder
functions.

---
'@tsrx/prettier-plugin': patch
'@tsrx/preact': patch
'@tsrx/ripple': patch
'@tsrx/react': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
'@tsrx/core': patch
---

Enforces a stricter rule for components declared inside classes: they must be
arrow-function class properties (including static), and class component foo() {}
method-style declarations are no longer supported.

Removes component method declarations support in favor of using as properties.

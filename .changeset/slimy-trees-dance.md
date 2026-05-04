---
'@tsrx/preact': patch
'@tsrx/react': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
'@tsrx/core': patch
---

Introduces a typeOnly flag to transformers to compile for either production or
editor support.

Lazy transformations for typeOnly are not skipped, only the & is
removed to make it look like a regular destructure.

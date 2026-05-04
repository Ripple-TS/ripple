---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
'@tsrx/ripple': patch
---

Reject component declarations with more than one parameter. Previously, JSX targets passed extra parameters straight through into the generated function and ripple silently dropped them. Multi-parameter components now error in regular compile and are surfaced as collected diagnostics in the Volar editor pipeline.

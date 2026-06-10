---
'@tsrx/core': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
'@tsrx/ripple': patch
'ripple': patch
---

Remove the runtime `Dynamic` component exports; dynamic rendering is the
`<{expr}>` tag syntax. The `Dynamic` type declarations remain so type-only
output keeps type-checking, but the JS is gone: React and Preact production
output now lowers dynamic tags to a scoped component alias
(`const TsrxDynamic_N = expr;`), Ripple SSR uses the internal
`_$_.dynamic_element` helper, and the imported-`Dynamic` detection for scoped
CSS is removed (the element marking is now `metadata.dynamicElement`, set by
the dynamic-tag lowering).

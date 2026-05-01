---
'@tsrx/prettier-plugin': patch
'@tsrx/core': patch
'@tsrx/ripple': patch
'@tsrx/react': patch
'@tsrx/preact': patch
'@tsrx/solid': patch
'@tsrx/vue': patch
---

Preserve generic type arguments on JSX component tags (e.g. `<RenderProp<User>>`). They were being silently dropped during prettier formatting, during the tsrx → JSX compile output for React/Preact/Solid/Vue, and in Ripple's `to_ts` virtual-code output used by the language server for typechecking.

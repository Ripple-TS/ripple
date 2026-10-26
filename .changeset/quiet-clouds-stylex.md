---
'@ripple-ts/vite-plugin': patch
'@tsrx/ripple': patch
---

Add an optional `@ripple-ts/vite-plugin/stylex` adapter for `@stylexjs/unplugin`
that compiles StyleX in Ripple `.tsrx` components after the Ripple transform.
Support opt-in `ripple({ stylex: true })` compiler lowering for `sx` and separate HTML/SVG attribute types
through `@ripple-ts/vite-plugin/stylex/jsx`.

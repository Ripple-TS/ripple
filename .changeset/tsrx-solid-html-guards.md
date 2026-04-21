---
'@tsrx/solid': patch
---

Drop `{html expr}` support on the Solid target. It used to lower to a Solid
`innerHTML={...}` attribute, but `innerHTML` is element-level (it replaces
all children and has no meaning on composite components) so the implicit
lowering from a child container was error-prone. Compiling `{html ...}`
with `@tsrx/solid` is now a compile-time error that points users at
`innerHTML={...}` as an explicit element attribute. This matches the
`@tsrx/react` behaviour; only Ripple has a first-class `{html ...}`
primitive.

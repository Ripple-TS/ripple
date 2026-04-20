---
'@tsrx/solid': patch
'@tsrx/react': patch
---

`{html expr}` now compiles on the Solid target to an `innerHTML={expr}`
attribute on the parent element, matching Solid's native raw-HTML primitive.
Only one `{html ...}` is permitted per element, and it cannot share the element
with sibling children — both cases produce a helpful compile-time error.

On the React target, `{html ...}` now raises an explicit compile-time error
pointing at `dangerouslySetInnerHTML`. Previously it failed with a generic
astring "Not implemented: Html" message.

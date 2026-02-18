---
'ripple': patch
---

Add a compiler validation error for rendering `children` through text
interpolation (for example `{children}` or `{props.children}`) and direct users to
render children as a component (`<@children />`) instead.

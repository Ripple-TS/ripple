---
'ripple': patch
---

Fix numeric values in a style object (e.g. `{ width: 400 }`) being silently dropped for CSS properties that require a unit. `apply_styles` serialized every value with a plain `String(...)` before calling `style.setProperty`, and the browser ignores a `setProperty` call whose value is a bare unitless number for properties like `width`, `height`, `top`, `left`, or `margin` — no error, the property just never lands on the element. Numeric style values are now formatted through an `isUnitlessNumber`-style allowlist (aligned with React's), appending `px` to any property not on it; `0` stays unitless regardless of property.

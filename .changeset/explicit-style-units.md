---
'ripple': patch
---

Use property-specific CSS types for HTML and SVG style objects and export `CSSProperties` from `ripple/jsx-runtime`. Numeric lengths such as `width: 400` now produce a type error; specify units with `width: '400px'` or `width: '24rem'`. Unitless CSS properties, zero lengths, camelCase and kebab-case names, and CSS custom properties remain supported.

Style properties set to `undefined` are omitted during server rendering and removed on the client, matching the optional property types and supporting conditional style values. Ripple does not infer or add CSS units.

---
'ripple': patch
---

Use property-specific CSS types for HTML and SVG style objects and export `CSSProperties` from `ripple` and `ripple/jsx-runtime`. Numeric lengths such as `width: 400` now produce a type error; specify units with `width: '400px'` or `width: '24rem'`. Unitless CSS properties, zero lengths, camelCase and kebab-case names, and CSS custom properties remain supported.

Style properties set to `null` or `undefined` are omitted during server rendering and removed on the client, matching the nullable and optional property types and supporting conditional style values. Ripple does not infer or add CSS units.

Re-export the `JSX` and `Ripple` namespaces as types from `ripple` so element prop and event types can be imported from the main package. The `ripple/jsx-runtime` exports remain available.

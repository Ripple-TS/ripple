---
'@tsrx/core': minor
'@tsrx/react': minor
'@tsrx/preact': minor
'@tsrx/solid': patch
---

Collapse multiple `ref` attributes on a single element at compile time.

Previously, two `ref={...}` attributes on the same element produced duplicate JSX `ref` props, which React and Preact dedupe (last wins) and Solid passed through untouched. The compilers now detect multiple ref attributes — across both Ripple's `{ref expr}` keyword form and TSX-style `ref={expr}` — and collapse them into a single attribute.

- `@tsrx/react` and `@tsrx/preact` emit `ref={mergeRefs(a, b, ...)}`, importing the shared `mergeRefs` helper from `@tsrx/react/merge-refs` and `@tsrx/preact/merge-refs` respectively. The helper supports both function refs and ref objects, and composes React 19 cleanup return values.
- `@tsrx/solid` emits `ref={[a, b, ...]}`, which Solid's runtime iterates natively. This also fixes a bug where TSX-style `ref={expr}` attributes on a Solid element were not folded into the existing array-merge path.

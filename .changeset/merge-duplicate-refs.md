---
'@tsrx/core': minor
'@tsrx/react': minor
'@tsrx/preact': minor
'@tsrx/solid': minor
'@tsrx/vue': minor
---

Compile-time merge for multiple ref expressions, plus a diagnostic for duplicate `ref={...}` attributes.

**New rule**: an element may have at most one TSX-style `ref={...}` attribute. Multiple `ref={...}` on the same element is now a compile error — they would otherwise produce duplicate JSX props (last-wins at runtime, can't be typed cleanly). The error suggests the supported alternative.

**Multiple `{ref expr}` keyword-form refs are still supported and merge into one ref**:

- `@tsrx/react`, `@tsrx/preact`, and `@tsrx/vue` emit `ref={mergeRefs(a, b, ...)}`, importing the shared `mergeRefs` helper from `@tsrx/react/merge-refs`, `@tsrx/preact/merge-refs`, and `@tsrx/vue/merge-refs` respectively. The helper supports function refs, React-style `{ current }` ref objects, and Vue-style `{ value }` ref objects (e.g. from `ref()` / `useTemplateRef()`), and composes React 19 cleanup return values.
- `@tsrx/solid` emits `ref={[a, b, ...]}`, which Solid's runtime iterates natively.

A single `ref={...}` may be combined with any number of `{ref expr}` on the same element — they all merge together. Single-ref elements (either syntax) emit unchanged with no helper import.

`@tsrx/vue` previously merged multiple `{ref expr}` into an inline arrow callback that only worked for function refs. Vue now uses the shared `mergeRefs` helper, which fixes Vue ref-object handling (`ref()` / `useTemplateRef()`) and the previously-broken combo case (`<el ref={a} {ref b} />`).

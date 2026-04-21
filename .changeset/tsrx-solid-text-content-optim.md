---
'@tsrx/solid': patch
---

When `{text expr}` is the sole child of a host (DOM) element, hoist it to a
`textContent={expr}` attribute on the parent. Solid writes `textContent` as
a direct DOM property, which skips the `insert()`-based text-node binding
it would otherwise emit for a child expression. The optimization only
applies to host elements (composite components don't have a DOM
`textContent`) and bails out if the user has already set `textContent`
explicitly or if there are sibling children (since `textContent` replaces
all other content).

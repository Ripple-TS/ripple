---
'ripple': patch
---

Fix HMR "zoom" issue when a Ripple file is changed in the dev server.

When a layout component contained children with nested `if`/`for` blocks,
hydration would leave `hydrate_node` pointing deep inside the layout's root
element (e.g. a HYDRATION_END comment inside `<main>`). The `append()`
function's `parentNode === dom` check only handled direct children, so it
missed grandchild/deeper positions and incorrectly updated the branch block's
`s.end` to that deep internal node.

This caused two problems on HMR re-render:
1. `remove_block_dom(s.start, s.end)` removed wrong elements (the deep node
   was treated as a sibling boundary, causing removal of unrelated content
   including the root HYDRATION_END comment).
2. `target = hydrate_node` (set after the initial render) became `null` or
   pointed outside the component's region, so new content was inserted at the
   wrong DOM location — producing a layout that appeared "zoomed" because it
   rendered outside its CSS container context.

The fix changes the `parentNode === dom` check to `dom.contains(hydrate_node)`,
consistent with the `anchor === dom` branch that already used `dom.contains()`.
This correctly resets `hydrate_node` to `dom`'s sibling level regardless of
how deeply nested it was inside `dom`.

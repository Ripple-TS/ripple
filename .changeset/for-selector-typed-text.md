---
'@tsrx/ripple': patch
---

Lower `outer === item` (and `!==`) comparisons inside `@for` render expressions to a per-loop selector, so changing the outer value re-renders only the previous and next matching items. Infer `@for` item types from the iterated expression (`T[]`, `Array<T>`, `Set<T>`, module `interface` / `type` declarations, and `track<T>()` values) so typed member reads such as `row.label.value` lower to `set_text` updates instead of the generic expression block, and use the shared `UNINITIALIZED` sentinel instead of allocating a `Symbol()` per rendered class update. A grouped render reads a repeated tracked identifier (such as the `@for` item) once and reuses it across its updates. Template child and sibling traversal is emitted inline (`_$_.hydrating ? _$_.hydrate_child() : node.firstChild`), so each template position keeps its own monomorphic property read instead of sharing one helper's read site across every element type.

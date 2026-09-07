---
'@tsrx/ripple': patch
---

Lower `outer === item` (and `!==`) comparisons inside `@for` render expressions to a per-loop selector, so changing the outer value re-renders only the previous and next matching items. Infer `@for` item types from the iterated expression (`T[]`, `Array<T>`, `Set<T>`, module `interface` / `type` declarations, and `track<T>()` values) so typed member reads such as `row.label.value` lower to `set_text` updates instead of the generic expression block, and use the shared `UNINITIALIZED` sentinel instead of allocating a `Symbol()` per rendered class update.

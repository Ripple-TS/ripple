---
'@tsrx/ripple': patch
'ripple': patch
---

perf: a template `@if` that closes the trailing run of an element's children (nothing rendered follows it) never materializes an anchor node: the element's tail is its position for its whole life. An `@if (outer === item.key)` in a `@for` body lowers to the loop's selector like an attribute comparison, and a comparison against the item's key reads the block's key (fixed for its life) rather than the item, so a change of the outer value re-runs the ifs of its previous and next key alone and a replaced item leaves its ifs untouched; comparisons against the same outer value share one selector per loop. Event delegation reads the composed path only for a nested root and looks the handler property up by one string, and `checked` is compared against the element instead of a cached write.

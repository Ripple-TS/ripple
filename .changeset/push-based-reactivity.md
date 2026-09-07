---
'ripple': patch
---

Faster updates and list rendering in the client runtime. Tracked values now keep a subscriber list, so a write schedules exactly the blocks that read it and the flush no longer scans the owner's subtree; scheduled blocks run in creation order from a queue. Text expressions, keyed list items, and class updates allocate less per row, and `set_class` skips DOM writes when the class is unchanged. Adds the `selector` / `selector_match` internals the compiler uses to share one subscription across `outer === item` comparisons in `@for` templates.

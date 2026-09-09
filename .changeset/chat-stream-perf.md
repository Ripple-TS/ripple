---
'ripple': patch
'@tsrx/ripple': patch
---

Lighter list, `@if`, and mount output on the client. A controlled `@for` (the sole content of its element) appends its items into the parent instead of inserting before an empty text anchor, and an `@if` at the root of such an item creates an anchor only once it needs a position of its own (a branch swap, or a branch that renders nothing), so a keyed list of `@if` items keeps no anchor nodes in the DOM; `mount()` likewise renders into the target without an anchor node. An `@if` block now renders its branch directly and owns the branch's DOM range, and a list keeps its inputs in block state, so every `@if` and `@for` allocates one block less and no closures. Text and class updates compare against the last value in the render block's state instead of a cache on the DOM node; the compiler emits that compared form for single updates as well.

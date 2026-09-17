---
'ripple': patch
'@tsrx/ripple': patch
---

Faster element spreads, dynamic elements and list items. An element spread is applied from the element's own render function instead of a render block of its own, and a spread object identical to the one applied last is skipped without a diff (a spread of a tracked object or of tracked values is always diffed). A dynamic element (`<{tag}>`) is one block that owns its element and applies its attributes itself; a tag that does not change keeps its element and diffs the attributes, so a swap between variants with the same tag no longer recreates the element. An `@if` whose condition reads tracked state is evaluated by the render function of the enclosing content (a list item's, an element's), so the if keeps a block for its branch but not one that runs the condition. A dynamic element or component called inside an `<svg>` or `<math>` template receives the namespace as an argument instead of a `with_ns` closure. On the SVG dashboard benchmark, mounting is about 20% faster and swapping 150 dynamic icons 40% faster.

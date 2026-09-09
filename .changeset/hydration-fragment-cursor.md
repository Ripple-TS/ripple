---
'ripple': patch
'@tsrx/ripple': patch
---

Fix hydration when a fragment root or a slot is followed by siblings. The compiler's closing `next(n)` for a fragment root now counts from wherever the cursor was last positioned, so a trailing element navigated to for an event or attribute, tracked text, a control-flow block, a component, or a `{expression}` no longer makes the cursor overshoot or fall short of the fragment's last node; a trailing element that was descended into is popped back to. Control-flow bodies nested inside an element now emit that `next(n)` too. At runtime, a `{expression}` leaves the cursor on its own end marker like every other block, and a multi-node branch or `@for` item steps to its block's end marker after appending, so the next sibling, item, or component adopts the right node.

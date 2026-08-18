---
'ripple': patch
---

Fix insertion order when a keyed or ref-based `@for` inserts multiple new items in the middle of the list. The pure-insert reconciliation path resolved the DOM anchor per new item by indexing the old blocks with a new-list index, so the anchor drifted into the matched suffix and later items landed after it (e.g. `[A, C, D]` → `[A, B1, B2, C, D]` rendered as `A, B1, C, B2, D`). The anchor is now resolved once, at the start of the matched suffix, and reused for the whole run of inserts.

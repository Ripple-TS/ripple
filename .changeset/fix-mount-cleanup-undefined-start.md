---
'ripple': patch
---

Fix `mount()` cleanup throwing `TypeError: Cannot read properties of undefined (reading 'remove')`. A block whose state had an `undefined` start node was skipped by the strict-equality sentinel check in `assign_nodes`, so the cleanup path forwarded `undefined` into `remove_block_dom` and crashed. `assign_nodes` and the `destroy_block` cleanup gate now treat `null` and `undefined` uniformly.

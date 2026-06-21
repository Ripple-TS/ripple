---
'ripple': patch
---

Scope the client flush traversal to the updated subtree. Previously every flush walked the whole root block tree to find dirty subscribers, so a deeply-scoped update (e.g. mutating state read by only a small subtree) paid a cost proportional to the entire tree rather than the affected branch. `flush_updates` now descends only along the routing path to each directly-scheduled block and fully scans just that block's subtree, where its subscribers live. A tracked read from outside its owner's subtree (e.g. smuggled across sibling subtrees via a module-level variable) is detected in `register_dependency` and transparently falls back to the original full-tree scan, so behavior is unchanged.

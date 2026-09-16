---
'ripple': patch
---

perf: a list item without a tracked of its own (a plain list's item, or a local keyed item) is created through a lean first run (`run_branch`) instead of the generic block runner: fewer checks and no re-run bookkeeping per item.

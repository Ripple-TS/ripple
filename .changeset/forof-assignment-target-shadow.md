---
"@tsrx/core": patch
---

Fix hook outer-binding validator: a `for (x of items)` whose left-hand side is a non-declaration (assignment target) was being treated as a local declaration, allowing hook-result assignments to that outer binding to escape diagnostics.

---
'@tsrx/prettier-plugin': patch
---

Print TypeScript type-predicate return types (`value is string`, `asserts x is T`, `asserts x`, `this is Element`). Previously `TSTypePredicate` had no printer case and formatted as `/* Unknown: TSTypePredicate */`, corrupting the file.

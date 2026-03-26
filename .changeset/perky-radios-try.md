---
'ripple': patch
---

fix(compiler): strip TypeScript class syntax from JS output

This fixes compiler output for `.ripple` classes by stripping TypeScript-only
`implements` clauses and `extends` type arguments from emitted JavaScript.

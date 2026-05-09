---
"@tsrx/core": patch
"@tsrx/react": patch
"@tsrx/preact": patch
---

Constrain React and Preact hook isolation so hook results cannot be assigned to bindings outside generated hook components, and keep hook-bearing `<tsrx>` expressions in regular functions behind stable helper components.

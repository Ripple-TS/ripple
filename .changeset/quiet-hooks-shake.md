---
"@tsrx/core": patch
"@tsrx/react": patch
"@tsrx/preact": patch
---

Constrain React and Preact hook isolation so hook results cannot cross generated hook component boundaries, reject hook callbacks that mutate parent-scope bindings across those boundaries, and keep hook-bearing `<tsrx>` expressions in regular functions behind stable helper components.

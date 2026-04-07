---
'ripple': patch
---

fix(compiler): handle UpdateExpression on lazy bindings with default values

Update expressions (`++`/`--`) on lazy destructured bindings with default values now work correctly. For postfix operations (`count++`), an IIFE captures the fallback value before incrementing. Also added `fallback` function to server runtime.

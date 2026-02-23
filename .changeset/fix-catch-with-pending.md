---
'ripple': patch
---

Fix catch block not executing when used with pending block in try statements.
Previously, errors thrown inside async components within
`try { ... } pending { ... } catch { ... }` blocks were lost as unhandled promise
rejections. Now errors are properly caught and the catch block is rendered. Also
fixes the server-side rendering to not include pending content in the final output
when the async operation resolves or errors.

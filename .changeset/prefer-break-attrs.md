---
'@ripple-ts/prettier-plugin': patch
---

Prefer breaking all JSX attributes onto separate lines instead of breaking expression values inline when an attribute value would cause a line break (e.g. multiline objects, ternaries). This makes element hierarchy easier to identify at a glance.

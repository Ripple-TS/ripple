---
"@tsrx/ripple": patch
"@tsrx/prettier-plugin": patch
---

Avoid stringifying adjacent TSRX expression children when either expression contains a function call, and preserve parentheses around TypeScript assertions before non-null assertions when formatting.

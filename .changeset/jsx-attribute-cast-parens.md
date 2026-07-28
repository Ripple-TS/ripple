---
'@tsrx/core': patch
---

Fix a parse error for `as` casts around parenthesized JSX in attribute values (`prop={((c) => (<Col />)) as any}`). The after-element context fixup popped a still-open outer `(` as if it were leaked, so the outer `)` popped the attribute container's brace and the `as` tokenized as a JSX name instead of starting the cast.

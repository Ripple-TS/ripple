---
'@tsrx/ripple': patch
---

Never render `null` or `undefined` as text in interpolated template output.

When adjacent text and expressions are merged for concatenation, a dynamic
value was coerced with `String(value)`, so a nullish value printed the literal
string `"null"`/`"undefined"` (e.g. `<h1>Welcome,{user.name}</h1>` rendered
`Welcome,null`). The merge now coerces via `String(value ?? '')` so nullish
values render as empty text. This applies to both the client and server
targets. An author-written `String(...)` is unaffected and still stringifies
nullish explicitly.

---
'@tsrx/core': patch
---

Treat `<` in markup text as a literal character when it cannot start a tag, so `<span><3</span>` parses instead of throwing `Unexpected token`

---
'@tsrx/ripple': patch
---

Keep the `export` keyword on `export import Alias = Foo;` and
`export import x = require('…');` in client, server, and editor output. The
compiled module previously dropped the export without an error, so the alias
was no longer exported.

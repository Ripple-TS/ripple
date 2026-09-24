---
'@tsrx/ripple': patch
---

Keep the `export` keyword on `export import Alias = Foo;` and
`export import x = require('…');` in editor and type-checking output, so other
modules can import the alias and the statement maps back to its source.

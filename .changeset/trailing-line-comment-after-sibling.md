---
'@tsrx/core': patch
---

Recognize trailing `//` line comments in template text after a sibling on the
same line. A `//` was only a comment when nothing but whitespace preceded it
on its line, so `@{ … }  // note` (or an element/expression container followed
by a trailing comment) treated the comment as text — and crashed with
`Unexpected token` when the comment contained `<`. A `//` preceded only by
whitespace since the start of its text run (right after a code block, element,
or expression container) now starts a comment. `//` after real text on the
same line is still literal, so `https://…` URLs stay text.

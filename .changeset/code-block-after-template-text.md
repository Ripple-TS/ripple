---
'@tsrx/core': patch
---

Always parse `@{ … }` in template text position as a `JSXCodeBlock`. A code
block preceded by text on the same line (e.g. `Hello @{props.username}`) was
split into JSX text ending in a literal `@` plus a `{ … }` expression
container, because the template raw-text scan only stopped at `<`, `{`, `}`,
and control-flow directives. The scan now also stops at a `@{` code-block
start, so inline blocks after text parse the same as blocks at the start of a
body. A lone `@` not directly followed by `{` remains plain text.

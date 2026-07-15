---
'@tsrx/core': patch
---

Fixed parsing multiline self-closing JSX expressions when whitespace follows `/>`, including parenthesized return expressions and ternaries whose other branch is a fragment or array. The tokenizer now uses the preceding token boundary when deciding whether the following source is template text.

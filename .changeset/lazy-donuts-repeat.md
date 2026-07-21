---
'@tsrx/core': patch
---

Tokenize a `/` in JSX text as literal text when the element is nested inside a `{ … }` expression container. Previously `{cond && (<a>x/y</a>)}` and adjacent expression children separated by a slash (`{a}/{b}`) inside a nested element failed to parse with "Invalid regular expression flag" or "Unterminated regular expression", because the tokenizer left raw-text mode and read the slash as the start of a regular expression.

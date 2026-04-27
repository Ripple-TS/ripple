---
"@tsrx/core": patch
---

Allow empty `<tsx></tsx>` and `<></>` fragments. The parser previously failed with "Unterminated regular expression" because `exprAllowed` leaked out of the template-body loop and caused the closing tag's `/` to be tokenized as a regex literal.

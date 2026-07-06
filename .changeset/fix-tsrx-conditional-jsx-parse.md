---
'@tsrx/core': patch
---

Fix a TSRX parser crash on a conditional/logical JSX branch that Prettier wraps in parentheses across multiple lines when it contains a nested non-self-closing child element on its own line (e.g. `{cond ? (\n  <Outer>\n    <Inner/>\n  </Outer>\n) : null}`). A JSX tokenizer context leaked by the nested child sat above the enclosing `(`, so after the closing `)` the tokenizer stayed in JSX-text mode and mis-tokenized the following `:`.

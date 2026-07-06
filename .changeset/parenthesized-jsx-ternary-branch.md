---
'@tsrx/core': patch
---

Parenthesized multiline JSX with nested children inside a ternary branch of an expression container (e.g. `{cond ? (<Outer><Inner>hi</Inner></Outer>) : null}` spread across lines) no longer fails to parse. After the closing `)`, the tokenizer treated the following `: null` as template raw text of the enclosing element and swallowed it; raw text inside an expression container is now only read when the innermost template element was opened inside that container.

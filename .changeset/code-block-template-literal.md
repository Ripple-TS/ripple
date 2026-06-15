---
'@tsrx/core': patch
---

Fix a parser crash when a template literal is the first thing in a `@{ … }` code block: `let c = @{`123`}` (and `@{ `${x}` }`) threw "Unterminated template" while `@{ '123' }` parsed fine. The code block's opening brace reads the next token ahead, and a template literal's backtick pushes its own tokenizer context; the setup-statement parser then shadowed (or stranded, after a prior statement) that context, so the template body tokenized as ordinary code and never closed. The backtick is now detected so the template-literal context stays on top and the body parses correctly.

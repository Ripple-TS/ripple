---
'@tsrx/core': patch
---

Fix a parse error on a callback prop whose parameter has a no-argument function
type, such as `<Boundary fallback={(reset: () => void) => …}>`. Deciding whether
`(` opens a function type scans ahead, and the scan's state snapshot aliased the
tokenizer's context stack instead of copying it. For an empty parameter list the
scan consumed `(` and returned at `)` without popping the context that `(`
pushed, leaving every later token one frame out of phase — the `>` closing the
element's opening tag was then tokenized as JSX text and reported as
``Unexpected token `>`. Did you mean `&gt;`?``. Lookahead now snapshots the
context stack by value, so it cannot mutate the caller's state.

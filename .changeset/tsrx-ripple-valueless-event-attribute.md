---
'@tsrx/ripple': patch
---

Valueless event attributes (e.g. mid-typing `<div onC>`) no longer crash the compiler with a position-less TypeError. They now produce a positioned error at the attribute (recoverable in loose/collect mode, so editor completions and diagnostics stay alive on the rest of the file), while boolean shorthand on non-event attributes like `<div hidden>` keeps compiling clean.

---
'@tsrx/ripple': patch
---

Server transform: accumulate each runtime block's output into a single `__out`
string and push it once per block (flushing only before a child block) instead
of emitting an `output_push` per element. Adjacent static + dynamic holes
coalesce into one `__out += a + b + c`, and accumulation spans loops and control
flow, so e.g. a whole `@for` feed renders in one push. Output is byte-identical;
this only changes how the SSR string is assembled.

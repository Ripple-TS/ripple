---
'ripple': patch
'@tsrx/ripple': patch
---

Faster cold hydration and server rendering. `hydrate()` accepts `rootBoundary: false` like `mount()`, stepping over the server's root markers itself instead of rendering under a `try` block. The client runtime compiles less on a cold page: the hydration cursor steps live in one module and assign the cursor directly, a list's first render never compiles the diff, a template's clone path stays out of its hydrating closure, `run_block` keeps re-run and teardown handling in separate functions, and the compiler adopts an element's lone text child in place (`hydrate_text`) with no `pop()`. A `@for` whose `index` nothing reads allocates no tracked index per item. Removing the server's inline styles now starts from an animation frame rather than inside `mount()`/`hydrate()`.

On the server, `render()` joins its buffer tree with a plain walk instead of `flat(Infinity).join('')`, `escape()` returns strings without `&`, `<` or `"` after a single regex test, and an `Output` allocates its stream, css and async-operation collections only for the root or on first use.

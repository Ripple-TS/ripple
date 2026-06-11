---
'@tsrx/ripple': patch
---

Support `@{ … }` code blocks in template children position, each with its own
lexical scope. Code-block children of elements, fragments, and control-flow
branches were silently dropped on the client, and the server kept their render
output while losing the setup statements (referencing undeclared variables at
runtime). The lowering pays only for what a block uses: a template-only block
merges statically into the parent template (no `_$_.expression`, no inline
component), a code-only block becomes a plain `{ … }` statement block, and a
block with both setup code and render output becomes a scoped inline component
(`(() => @{ … })()`, the same lowering as value-position blocks). Nested
blocks (`@{ @{ … } }`) shadow correctly instead of collapsing into one scope,
share a single closure and `with_scope` wrapper per chain, and empty chains
compile to nothing.

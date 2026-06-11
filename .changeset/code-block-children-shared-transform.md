---
'@tsrx/core': patch
---

Fix `@{ … }` code blocks in template children position for the shared JSX
transform (react, preact, solid, vue). Nesting deeper than two levels leaked a
raw code block into the statement stream — triggering spurious
`_tsrx_child_*` captures and an IIFE whose render output was discarded
(dropped in react/preact, rendered out of position in solid) — and flattened
blocks merged lexical scopes, so shadowed declarations produced invalid
output. Each block is now its own scope and the lowering pays only for what
the block uses: template-only blocks merge statically into the parent,
code-only blocks become a plain `{ … }` statement block, blocks with both
setup code and render output become a scoped IIFE child, and nested chains
fold into a single closure with nested plain blocks. Empty chains compile to
nothing at any depth.

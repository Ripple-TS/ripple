---
'@tsrx/core': patch
'@tsrx/ripple': patch
---

Keep single-text template output faithful to the source instead of promoting it to a string-literal expression. A component or fragment whose only output is a text node (e.g. `<>@</>` or `<>Hello</>`) is now emitted as-is in both the editor (type-only) view and runtime codegen, rather than being rewritten to `{'@'}` / `{'Hello'}`. This fixes valid text characters like `@` being mangled and preserves source fidelity/mappings across all targets. Nullish or whitespace-only single-text output now renders nothing at runtime instead of emitting a stray empty-string expression.

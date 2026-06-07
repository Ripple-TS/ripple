---
"@tsrx/core": patch
---

Allow a trailing `;` after the render node of a `@{ }` code block or directive body (e.g. `<>…</>;`). The stray semicolon is a meaningless empty statement and is now skipped during parsing instead of being captured as a statement after the render output. This previously produced a "statements cannot follow the rendered output" diagnostic and, because the render node was then mis-bucketed as a body statement, could crash the transformer with "Not implemented: JSXStyleElement" when the output contained a `<style>` element. Prettier still strips the semicolon on format.

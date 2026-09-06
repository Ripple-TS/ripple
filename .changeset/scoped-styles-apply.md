---
'@tsrx/ripple': patch
'ripple': patch
---

Implement sibling-scoped `<style>` blocks, `$class`, and `apply` ([TSRX RFC #1](https://github.com/tsrx-org/RFCs/discussions/1)) for the Ripple target.

- A `<style>` block is scoped to its siblings: it styles the items beside it and everything below them, never the element that contains it. Blocks among the same children share one hash and one stylesheet; nested children lists that hold blocks are nested scopes, and every element carries the hash of each enclosing scope, outer first. Control-flow branches and templates assigned to variables host scopes too.
- Assigning a block to a variable exposes `$class`. Exported, applied, or `$class`-read blocks are themes that keep every selector; other assigned blocks stay class maps. `<style apply={theme} />` attaches a theme to a whole scope, `<style apply={theme}>…</style>` applies and declares in one tag, arrays apply several themes, and a theme may apply other themes. Same-module themes inline as literals; imported themes are read through `theme.$class` at runtime.
- CSS is emitted in lexical order (an applied theme before the block that applies it, a scope's blocks together, nested scopes after their parent). On the server a render registers the sheets it needs in that order, class-map reads register their own sheet, and reading `theme.$class` outside a render no longer throws.
- The style diagnostics of the RFC (`tsrx-style-*` codes) are reported, and type-only output verifies `apply` targets through a `$class` read.
- Fixed: a `@{ … }` block rendered as the child of a DOM element on the client was dropped; it now renders in place. The `#class` spread attribute accepts several class tokens.

Raw CSS in a `<style>` inside a plain function that returns JSX is now an error (`tsrx-style-standalone-outside-template`): use a `@{ … }` body, or `<style>{css}</style>`. Elements are stamped with the scope class after their authored classes, and every element of a scope carries it, not only those a selector matches.

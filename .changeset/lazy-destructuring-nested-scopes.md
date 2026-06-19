---
'@tsrx/core': patch
---

Apply lazy `&{ … }` / `&[ … ]` destructuring inside nested `@{ … }` code blocks
and `@if` / `@for` / `@switch` / `@try` directive bodies (React, Preact, Solid,
and Vue production output), instead of leaving the lazy declaration as a plain
destructure while its references go unrewritten.

These scopes lower to compiler-generated function boundaries — scoped IIFEs,
`.map(...)` callbacks, and `<Show>` / `<For>` / `<Match>` render closures — that
did not exist when `has_lazy_descendants` was first stamped, so the lazy
transform's fast-path skipped them. The descendant flag is now re-derived over
the fully lowered tree before the transform runs, so a `let &{ name } = props`
declared in a nested block or directive body is rewritten to
`let __lazy0 = props` + `__lazy0.name` exactly as it is in a flat component body.
A `@switch` case body's lazy bindings are now collected too (the shared switch
block scope), so a reference like `{value}` becomes `{__lazy0.value}` rather than
a half-transformed `let __lazy0 = props` with a dangling `value`.

Also rewrite a lazy binding used as a JSX element/component name to a member
expression (`function Comp(&{ Item }) @{ <Item></Item> }` →
`function Comp(__lazy0) { return <__lazy0.Item></__lazy0.Item>; }`). The bound
name is no longer a local once the param/declaration is replaced with the
generated `__lazy0` source, so `<Item>` had been leaking a reference to an
undefined identifier; it now reads the component off the lazy source like every
other reference does.

An untyped lazy object param no longer gets a synthesized `{ … : any }` type. The
source specified no type, so the generated param is left implicitly `any`
(`function Comp(__lazy0)`) instead of carrying a fabricated object shape; a param
with an author-provided type still keeps it (`function Comp(__lazy0: Props)`).

Type-only (virtual TSX) output is unchanged: it never runs the lazy transform, so
the param keeps printing as a plain destructure (`{ Item }`, untyped) and `<Item>`
keeps referencing that in-scope binding, which preserves identity-style source
mappings for editor features.

---
'@tsrx/ripple': patch
---

fix(transform): lower template elements in expression-container and attribute-value positions

An element inside a child expression container (`<div>{<h1>…</h1>}</div>`) or
an attribute value (`prop={<h1>…</h1>}`) now lowers to a `tsrx_element` value
in both client and server output — matching what the same element assigned to
a variable produces. Previously the client leaked raw JSX into the compiled
output (broken at runtime) and both modes crashed the printer when the element
contained control-flow directives. Ternary and directive-valued attributes on
the server are fixed by the same change.

Expression children are now classified by provable type: an expression that
provably evaluates to a text primitive (string, number, boolean, bigint,
null/undefined — literals, operators, `String()`/`Number()`/`Boolean()`, `as`
casts, typed bindings and members) keeps the inline text fast paths, and
everything else renders through the value-aware expression paths — so an
element passed as a prop and rendered via `{props.header}` produces its markup
instead of `[object Object]`. `<title>` expression children always use the
escaping text path, keeping hydration markers out of `document.title`.

Also fixes a latent client codegen crash: a text expression following inlined
text in the same template text run (e.g. `<div>label: {String(f())}</div>`)
anchored past the end of the coalesced text node; such expressions now render
through a comment-anchored `_$_.expression`.

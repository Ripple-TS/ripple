---
'@tsrx/ripple': patch
---

Fix `HierarchyRequestError: Node can't be inserted in a #comment parent` during
hydration of a `<>…</>` fragment that contains control flow — e.g. an `@if`
(or `@for`/`@switch`/`@try`/`@else`) body, or a component body, whose fragment
leads with an `@for`/`@if`. In template position the client lowers such a
fragment to a `<!>` placeholder + `expression(() => tsrx_element(…))`, whose
hydration needs a matching `<!--[-->`…`<!--]-->` boundary. The server inlined the
fragment without one, so the client's `expression()` borrowed the first nested
control-flow's start marker as its own and advanced the hydration cursor past
that child's content, landing later operations on a comment node. The server
transform now brackets such fragments with hydration block markers — matching
every other control-flow block — when the fragment is a control-flow branch body
(or nested in an element within one) or leads with content that emits its own
start marker: a control-flow directive or a `{ … }`/`@{ … }` expression lowered
to `render_expression`. Fragments that lead with an element/component/plain text
are unchanged (they reuse their host boundary), so no extra comment nodes are
emitted for the common cases.

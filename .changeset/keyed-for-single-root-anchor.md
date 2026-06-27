---
'ripple': patch
---

Fix `Cannot use 'in' operator to search for 'parent' in null` thrown from
`append()` when reordering or inserting into a keyed `@for` whose item body is a
single control-flow / component root (e.g. `@for (...; key ...) { <Card {item} /> }`
where `Card`'s own body is a single `@if`/`@for`/component). The 0.3.85 wrapper-anchor
optimization leaves such an item block's `s.start` null because its DOM is rendered
through a descendant block, and keyed reconciliation read `s.start` directly as the
insertion anchor. Reconciliation now resolves the real first/last DOM node by
descending child blocks, so no `<!>` comment marker is reintroduced and the
optimization's reduced DOM-mutation cost is preserved. The same resolution is applied
to `@switch` case reordering.

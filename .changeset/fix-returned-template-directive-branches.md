---
'@tsrx/ripple': patch
---

Fix client crash when a `function C() { return <jsx> }` component renders a
template control-flow directive (`@if`/`@for`/`@switch`/`@try`).

The block-statement return form is transformed via the generic function path,
which never sets the `component` render state. A directive-branch element in
statement position (e.g. `@if (cond) { <p>…</p> }`) then matched the
out-of-component "bare template statement" rule and was double-wrapped: its
content compiled into an orphaned template while the template the branch
actually referenced was left empty, crashing at runtime with
`Cannot read properties of null (reading 'cloneNode')`. A synthetic children
render arrow now establishes itself as the component boundary when no enclosing
component is set, so directive branches inline their content correctly. The
`@{ … }` form and the server target were already correct.

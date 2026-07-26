---
"@tsrx/core": patch
---

Fix a parse error when an attribute value contains a control-flow directive (`@if`,
`@for`, `@switch`, `@try`) — either bare or wrapped in a fragment/element — and the
attribute's element has children, e.g.
`<ElementA prop={ @if (ok) { <div /> } }><ElementB /></ElementA>` or
`<ElementA prop={<>@if (ok) { <A /> } @else { <B /> }</>}></ElementA>`.

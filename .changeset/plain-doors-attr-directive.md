---
"@tsrx/core": patch
---

Fix a parse error when a control-flow directive (`@if`, `@for`, `@switch`, `@try`) is
used as an attribute value on an element that has children, e.g.
`<ElementA prop={ @if (ok) { <div /> } }><ElementB /></ElementA>`.

---
'@tsrx/ripple': patch
---

Namespace fixes for elements whose namespace is only known at runtime. The children of a `foreignObject` reset the active namespace to HTML during setup, so control flow and dynamic tags inside one render HTML even when the surrounding `<svg>` belongs to another component. A dynamic element's children take their namespace from the tag the runtime resolves instead of the static parent. A dynamic `class` on an SVG or MathML tag name is set as an attribute rather than through `className`, which threw on an SVG element rendered into a component's `<svg>`.

---
'ripple': patch
---

Blocks keep the namespace they were created in when they rerun. A dynamic element whose tag changes, an `@if` that toggles, or an `@for` that grows inside an SVG that is only known at runtime (children rendered into a component's `<svg>`, a leaf component rendered there) now creates its elements in the SVG namespace instead of HTML, and a nested template cloned in that context no longer throws before a namespaced template has been parsed. A dynamic element whose tag becomes `foreignObject` renders its children as HTML.

---
'@tsrx/ripple': patch
---

Build small static templates with DOM calls: a template of up to eight nested elements, text nodes and placeholder comments now compiles to `template_el` instead of an HTML string, so a page's first render never starts the HTML parser for it. Trees the parser would restructure (table models, selects, list items in list items, ruby annotations, raw-text elements) keep parsing. A template holding an element that could load a resource is flagged so its master is built in the inert template document.

With `textTypes`, a `data-` or `aria-` attribute whose value TypeScript proves to be a string, number or bigint is written with `setAttribute` directly (`primitiveAttributeRanges` in the text type facts).

Attributes of standard HTML elements are written without the runtime's setter discovery: a generated table of Web IDL setters (`src/dom-setters.js`, from TypeScript's `lib.dom.d.ts`) tells the compiler whether a name is a settable property of its element, so it emits `set_property_value` (a non-string value is assigned) or `set_attribute_value` (`setAttribute` alone). Custom elements, tags that are also SVG or MathML elements, and namespaced content keep `set_attribute`.

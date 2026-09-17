---
'ripple': patch
---

Trim the cold path of a first mount: `template_el` builds nested templates and builds a master in the document itself unless the compiler flagged a resource-loading element; Firefox is detected without reading `navigator` (about 0.1 ms on a fresh page); `Event.prototype.__root` is declared with the first delegated listener instead of at mount; `set_attribute` skips the property-setter walk for `data-` and `aria-` names; the first flush of a mounted app's effects runs in one phase; `track()` and deferred component effects call one function less each; and a mount before any delegated event is registered attaches no listeners.

New `set_attribute_value` and `set_property_value` helpers write an attribute the compiler classified with the Web IDL setter table, so a standard element never triggers the descriptor walk of `set_attribute`.

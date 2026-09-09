---
'ripple': patch
'@tsrx/ripple': patch
---

Faster keyed lists and lighter component output on the client. A `@for` keyed by the item itself (`key item`) keys by identity with no key callback, so a re-run compares the item arrays directly and skips the per-item value update; a same-length keyed re-run rewrites the list's block array in place instead of allocating a new one, with the unchanged prefix and suffix skipped by plain compares. Static child components that follow their template siblings append into the parent element instead of inserting before a `<!>` placeholder, so a component with trailing child components clones fewer nodes and leaves no comment anchors in the DOM. The compiler also infers a primitive text type through a call whose callee is declared to return one (a binding typed as a function type, an `as` assertion, a function with a declared return type, or a method or function-typed property of an annotated object), so such text lowers to `set_text` instead of a generic expression block.

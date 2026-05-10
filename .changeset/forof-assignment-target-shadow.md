---
"@tsrx/core": patch
---

Tighten hook outer-binding validator around `for…of`:

- A non-declaration target (`for (x of items)`) was being treated as a local declaration, hiding later hook-result assignments to the same outer binding.
- `let`/`const` declared by a for-of (`for (const x of items)`) was likewise being added to the *enclosing* block's shadowed set, even though the binding is scoped to the loop in JavaScript. This let after-loop assignments to a same-named outer binding (e.g., `for (const x of items) { … } [x] = useState(0)`) escape detection. Loop-declared names are now scoped to the body sub-tree only.
- The for-of's own iteration assignment was not inspected at all, so iterating a hook-derived value into an outer binding (e.g., `for (x of useState(0))` or `for ([a, b] of [useState(0)])`) silently lost the rebind in the emitted code.

All three shapes now report the same diagnostic as a direct hook-result assignment to an outer binding.

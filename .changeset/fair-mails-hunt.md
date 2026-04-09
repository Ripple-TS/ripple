---
'ripple': patch
---

Fix lazy array rest destructuring for tracked and array-like values by routing rest extraction through a shared `array_slice` helper instead of calling `.slice()` directly on the source.

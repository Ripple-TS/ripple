---
'@tsrx/core': patch
---

Fix parsing for JSX-valued attributes whose element has an expression-container child with JSX inside (e.g. `slot={<button>{ok ? <X /> : <Y />}</button>}`) followed by another attribute.

---
'ripple': patch
---

Preserve input and textarea edits made before hydration when attaching `bindValue`.
Adopt the live value into the model without resetting focus or text selection, while
continuing to initialize untouched fields from their bound values.

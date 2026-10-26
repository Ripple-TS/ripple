---
'ripple': patch
'@tsrx/ripple': patch
---

Preserve contenteditable edits made before hydration with `bindInnerHTML`,
`bindInnerText`, and `bindTextContent`. Use server-content snapshots to distinguish
edits and deletions from untouched editors, preserve their DOM nodes and selection,
and initialize untouched bindings normally. Support inherited editability, dynamic
tags, and async server output, with fast paths for empty and HTML-valued editors.
